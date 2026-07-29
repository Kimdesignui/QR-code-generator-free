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

const createMiuiSafeUrl = async (destination) => {
  const response = await fetch('https://cleanuri.com/api/v1/shorten', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ url: destination }),
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) throw new Error(`Shortener returned ${response.status}`);

  const result = await response.json();
  if (
    typeof result.result_url !== 'string'
    || !/^https:\/\/cleanuri\.com\/[a-zA-Z0-9_-]+$/.test(result.result_url)
  ) {
    throw new Error('Shortener returned an invalid URL');
  }

  return result.result_url;
};

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
      const contactUrl = `${requestUrl.origin}/c/${id}`;

      try {
        const url = await createMiuiSafeUrl(contactUrl);
        return jsonResponse({ id, url, contactUrl }, 201);
      } catch (error) {
        console.error('Failed to create MIUI-safe URL', error);
        return jsonResponse({ error: 'Could not create a scanner-compatible link' }, 502);
      }
    }
  }

  return jsonResponse({ error: 'Could not create a unique link' }, 503);
};

export const config = {
  path: '/api/contacts',
  method: 'POST',
};
