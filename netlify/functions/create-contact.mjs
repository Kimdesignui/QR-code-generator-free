import { getStore } from '@netlify/blobs';

const FIELD_LIMITS = {
  fullName: 120,
  jobTitle: 120,
  organization: 160,
  address: 300,
  phone: 40,
  email: 160,
  website: 300,
};

const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  },
});

const sanitizeContact = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;

  const contact = {};
  for (const [field, limit] of Object.entries(FIELD_LIMITS)) {
    if (typeof input[field] !== 'string') return null;
    contact[field] = input[field].trim().slice(0, limit);
  }

  if (!Object.values(contact).some(Boolean)) return null;
  if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) return null;

  if (contact.website) {
    const candidate = /^https?:\/\//i.test(contact.website)
      ? contact.website
      : `https://${contact.website}`;

    try {
      const parsed = new URL(candidate);
      if (!['http:', 'https:'].includes(parsed.protocol)) return null;
      contact.website = parsed.href;
    } catch {
      return null;
    }
  }

  return contact;
};

const makeId = () => crypto.randomUUID().replaceAll('-', '').slice(0, 12);

export default async (req) => {
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const requestUrl = new URL(req.url);
  const origin = req.headers.get('origin');
  if (origin && origin !== requestUrl.origin) {
    return jsonResponse({ error: 'Invalid origin' }, 403);
  }

  const contentType = req.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return jsonResponse({ error: 'JSON required' }, 415);
  }

  const rawBody = await req.text();
  if (rawBody.length > 3000) return jsonResponse({ error: 'Payload too large' }, 413);

  let input;
  try {
    input = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const contact = sanitizeContact(input);
  if (!contact) return jsonResponse({ error: 'Invalid contact details' }, 422);

  const store = getStore({ name: 'qr-contacts', consistency: 'strong' });

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = makeId();
    const result = await store.set(id, JSON.stringify(contact), { onlyIfNew: true });
    if (result.modified) {
      return jsonResponse({ id, url: `${requestUrl.origin}/c/${id}` }, 201);
    }
  }

  return jsonResponse({ error: 'Could not create a unique link' }, 503);
};

export const config = {
  path: '/api/contacts',
  method: 'POST',
};
