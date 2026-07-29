import { getStore } from '@netlify/blobs';

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const escapeVCard = (value = '') => String(value)
  .replace(/\\/g, '\\\\')
  .replace(/\r?\n/g, '\\n')
  .replace(/;/g, '\\;')
  .replace(/,/g, '\\,');

const normalizePhone = (phone = '') => phone.replace(/[.\s()-]/g, '');

const buildVCard = (contact) => [
  'BEGIN:VCARD',
  'VERSION:3.0',
  `ORG;CHARSET=UTF-8:${escapeVCard(contact.organization)}`,
  `N;CHARSET=UTF-8:${escapeVCard(contact.fullName)};;;;`,
  `FN;CHARSET=UTF-8:${escapeVCard(contact.fullName)}`,
  `TITLE;CHARSET=UTF-8:${escapeVCard(contact.jobTitle)}`,
  `ADR;TYPE=WORK;CHARSET=UTF-8:;;${escapeVCard(contact.address)};;;;`,
  `TEL;TYPE=CELL,VOICE:${normalizePhone(contact.phone)}`,
  `EMAIL;TYPE=INTERNET:${contact.email}`,
  `URL:${contact.website}`,
  'END:VCARD',
].join('\r\n');

const renderPage = (contact) => {
  const phone = normalizePhone(contact.phone);
  const title = contact.fullName || 'Danh thiếp';
  const fileName = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9-]+/gi, '-');
  const vCardHref = `data:text/vcard;charset=utf-8,${encodeURIComponent(buildVCard(contact))}`;

  const phoneLink = phone
    ? `<a class="action action-phone" href="tel:${escapeHtml(phone)}">Gọi ${escapeHtml(contact.phone)}</a>`
    : '';
  const emailLink = contact.email
    ? `<a class="action action-email" href="mailto:${escapeHtml(contact.email)}">Gửi email</a>`
    : '';
  const websiteLink = contact.website
    ? `<a class="action action-web" href="${escapeHtml(contact.website)}" target="_blank" rel="noopener noreferrer">Mở website</a>`
    : '';

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>${escapeHtml(title)} – Thông tin liên hệ</title>
  <link rel="stylesheet" href="/contact.css">
</head>
<body>
  <main class="contact-shell">
    <article class="contact-card">
      <div class="contact-avatar" aria-hidden="true">${escapeHtml(title.charAt(0).toUpperCase() || 'L')}</div>
      <p class="eyebrow">Thông tin liên hệ</p>
      <h1>${escapeHtml(title)}</h1>
      ${contact.jobTitle ? `<p class="job-title">${escapeHtml(contact.jobTitle)}</p>` : ''}
      ${contact.organization ? `<p class="organization">${escapeHtml(contact.organization)}</p>` : ''}
      ${contact.address ? `<p class="address">${escapeHtml(contact.address)}</p>` : ''}
      <div class="actions">
        ${phoneLink}
        ${emailLink}
        ${websiteLink}
        <a class="action action-save" href="${escapeHtml(vCardHref)}" download="${escapeHtml(fileName || 'lien-he')}.vcf">Lưu vào danh bạ</a>
      </div>
    </article>
  </main>
</body>
</html>`;
};

const renderNotFound = () => `<!doctype html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Không tìm thấy liên hệ</title>
  <link rel="stylesheet" href="/contact.css">
</head>
<body>
  <main class="contact-shell">
    <article class="contact-card contact-error">
      <p class="eyebrow">Liên kết không hợp lệ</p>
      <h1>Không tìm thấy liên hệ</h1>
      <p class="address">Hãy kiểm tra lại mã QR hoặc tạo một mã mới.</p>
      <a class="action action-web" href="/">Về trang tạo QR</a>
    </article>
  </main>
</body>
</html>`;

export default async (req, context) => {
  const id = context.params.id || '';
  if (!/^[a-f0-9]{12}$/.test(id)) {
    return new Response(renderNotFound(), {
      status: 404,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
    });
  }

  const store = getStore({ name: 'qr-contacts', consistency: 'strong' });
  const stored = await store.get(id);
  if (!stored) {
    return new Response(renderNotFound(), {
      status: 404,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
    });
  }

  let contact;
  try {
    contact = JSON.parse(stored);
  } catch {
    return new Response(renderNotFound(), {
      status: 500,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
    });
  }

  return new Response(renderPage(contact), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=86400',
      'content-security-policy': "default-src 'none'; style-src 'self'; img-src 'self'; base-uri 'none'; frame-ancestors 'none'",
      'referrer-policy': 'no-referrer',
      'x-content-type-options': 'nosniff',
    },
  });
};

export const config = {
  path: '/c/:id',
};
