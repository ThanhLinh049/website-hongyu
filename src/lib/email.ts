// Branded HTML email templates for the Hong Yu website forms.
//
// Pure module (no imports) so it renders anywhere. Inline styles + table layout
// for maximum email-client compatibility (Gmail, Outlook, Apple Mail — no
// flex/grid, bulletproof button, hybrid 2-col that stacks on mobile). Brand
// palette from tailwind.config:
//   navy   #003f87  (primary)
//   orange #E67E22  (cta accent)

const NAVY = '#003f87';
const NAVY_DARK = '#00306a';
const ORANGE = '#E67E22';
const INK = '#1c1b1b';
const MUTED = '#6b7280';
const LINE = '#e5e7eb';
const BG = '#f3f4f6';
const CARD = '#f8fafc';

const FONT = 'Arial,Helvetica,sans-serif';

export function escapeHtml(input: unknown): string {
  const s = input == null ? '' : String(input);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface EmailField {
  label: string;
  value: unknown;
}

const hasValue = (f: EmailField) => f.value != null && String(f.value).trim() !== '';

function rowsText(fields: EmailField[]): string {
  return fields
    .filter(hasValue)
    .map((f) => `${f.label}: ${String(f.value)}`)
    .join('\n');
}

/* ---------------------------------------------------------------- sections */

// Small uppercase section label ("REQUEST DETAILS", "PROJECT NOTES").
const sectionLabel = (text: string) =>
  `<div style="font:700 11px/1.4 ${FONT};letter-spacing:.14em;text-transform:uppercase;color:${MUTED};padding:0 0 10px 0;">${escapeHtml(text)}</div>`;

// One spec cell: tiny label over a strong value (used inside the 2-col grid).
function specCell(f: EmailField): string {
  const val = escapeHtml(f.value).replace(/\n/g, '<br/>');
  return `<div style="font:700 10px/1.4 ${FONT};letter-spacing:.1em;text-transform:uppercase;color:${NAVY};">${escapeHtml(f.label)}</div>
    <div style="font:600 15px/1.45 ${FONT};color:${INK};padding-top:2px;">${val}</div>`;
}

// Short fields laid out 2-up, spec-sheet style (hairline under each row).
// class="stack" + the media query in shell() makes the columns stack on mobile.
function specGrid(fields: EmailField[]): string {
  if (!fields.length) return '';
  let rows = '';
  for (let i = 0; i < fields.length; i += 2) {
    const left = fields[i];
    const right = fields[i + 1];
    rows += `
      <tr>
        <td class="stack" width="50%" valign="top" style="padding:12px 16px 12px 0;border-bottom:1px solid ${LINE};">${specCell(left)}</td>
        <td class="stack" width="50%" valign="top" style="padding:12px 0 12px 16px;border-bottom:1px solid ${LINE};">${right ? specCell(right) : '&nbsp;'}</td>
      </tr>`;
  }
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>`;
}

// Long text (notes / message): full-width quote block with an accent bar.
function noteBlock(f: EmailField): string {
  const val = escapeHtml(f.value).replace(/\n/g, '<br/>');
  return `
    <div style="padding-top:22px;">
      ${sectionLabel(f.label)}
      <div style="border-left:3px solid ${ORANGE};background:${CARD};padding:14px 16px;border-radius:0 8px 8px 0;font:400 14px/1.65 ${FONT};color:${INK};">${val}</div>
    </div>`;
}

// Sender identity card: who is asking, with tappable email / phone.
function senderCard(p: { name?: string; email?: string; phone?: string; company?: string }): string {
  if (!p.name && !p.email && !p.phone && !p.company) return '';
  const contactBits = [
    p.email
      ? `<a href="mailto:${escapeHtml(p.email)}" style="color:${NAVY};font:600 13px/1.5 ${FONT};text-decoration:none;">${escapeHtml(p.email)}</a>`
      : '',
    p.phone
      ? `<a href="tel:${escapeHtml(String(p.phone).replace(/[^+\d]/g, ''))}" style="color:${NAVY};font:600 13px/1.5 ${FONT};text-decoration:none;">${escapeHtml(p.phone)}</a>`
      : '',
  ]
    .filter(Boolean)
    .join(`<span style="color:${LINE};">&nbsp;&nbsp;|&nbsp;&nbsp;</span>`);

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CARD};border:1px solid ${LINE};border-radius:10px;">
      <tr>
        <td style="padding:16px 18px;">
          ${p.name ? `<div style="font:800 16px/1.3 ${FONT};color:${INK};">${escapeHtml(p.name)}</div>` : ''}
          ${p.company ? `<div style="font:400 13px/1.5 ${FONT};color:${MUTED};padding-top:2px;">${escapeHtml(p.company)}</div>` : ''}
          ${contactBits ? `<div style="padding-top:8px;">${contactBits}</div>` : ''}
        </td>
      </tr>
    </table>`;
}

// Bulletproof CTA button (renders as a solid block even in Outlook).
function ctaButton(label: string, href: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:26px auto 4px auto;">
      <tr>
        <td align="center" bgcolor="${ORANGE}" style="border-radius:8px;">
          <a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 32px;font:700 14px/1 ${FONT};letter-spacing:.04em;color:#ffffff;text-decoration:none;border-radius:8px;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`;
}

/* ------------------------------------------------------------------- shell */

/** Full-page branded frame around prebuilt body sections. */
function shell(opts: { preheader: string; bodyHtml: string; siteUrl?: string }): string {
  const year = 2026;
  const site = (opts.siteUrl || '').replace(/\/$/, '');
  // PNG logo served from the frontend's /public (WebP is unreliable in mail
  // clients). Falls back to a text wordmark when the site origin is unknown.
  const logoUrl = site ? `${site}/logo-email.png` : '';
  const siteLine = site
    ? `<a href="${escapeHtml(site)}" style="color:${NAVY};text-decoration:none;">${escapeHtml(site.replace(/^https?:\/\//, ''))}</a>`
    : 'Hong Yu Emblem';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  @media only screen and (max-width:480px){
    .stack{display:block!important;width:100%!important;padding-left:0!important;padding-right:0!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:${BG};">
  <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${escapeHtml(opts.preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${LINE};border-radius:12px;overflow:hidden;">
        <!-- Header: compact brand band -->
        <tr><td align="center" style="background:${NAVY};background-image:linear-gradient(135deg,${NAVY},${NAVY_DARK});padding:18px 24px;text-align:center;">
          ${
            logoUrl
              ? `<img src="${escapeHtml(logoUrl)}" width="104" alt="Hong Yu Emblem" style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;width:104px;max-width:104px;height:auto;" />`
              : `<div style="font:800 20px/1 ${FONT};letter-spacing:.12em;color:#ffffff;">HONG YU EMBLEM</div>`
          }
        </td></tr>
        <tr><td style="height:3px;background:${ORANGE};font-size:0;line-height:0;">&nbsp;</td></tr>
        <!-- Body -->
        <tr><td style="padding:26px 28px 24px 28px;">
          ${opts.bodyHtml}
        </td></tr>
        <!-- Footer -->
        <tr><td style="border-top:1px solid ${LINE};padding:16px 28px 20px 28px;">
          <div style="font:400 12px/1.6 ${FONT};color:${MUTED};">
            Sent from the ${siteLine} website &middot; reply directly to respond to the sender.
          </div>
          <div style="font:400 11px/1.6 ${FONT};color:#9ca3af;padding-top:4px;">
            &copy; ${year} Hong Yu Emblem. All rights reserved.
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* --------------------------------------------------------------- templates */

// The quote form is builder-driven (labels are configured in WP admin), so
// fields are classified generically by label/shape:
//   identity (name/email/phone/company) -> sender card
//   long text (notes/message, multiline or >90 chars) -> full-width note block
//   everything else                     -> 2-column spec grid
export function renderContactEmail(fields: Record<string, any>, siteUrl?: string) {
  const skip = new Set(['botcheck', 'attachment']);
  const all: EmailField[] = Object.entries(fields)
    .filter(([k]) => !skip.has(k))
    .map(([label, value]) => ({ label, value }))
    .filter(hasValue);

  const labelIs = (re: RegExp) => (f: EmailField) => re.test(f.label);
  const take = (re: RegExp): EmailField | undefined => {
    const i = all.findIndex(labelIs(re));
    return i >= 0 ? all.splice(i, 1)[0] : undefined;
  };

  const name = take(/^(?!.*company).*name/i);
  const email = take(/e-?mail/i);
  const phone = take(/phone|tel/i);
  const company = take(/company/i);

  const isLong = (f: EmailField) =>
    /note|message|detail|description|comment/i.test(f.label) ||
    String(f.value).includes('\n') ||
    String(f.value).length > 90;
  const longs = all.filter(isLong);
  const shorts = all.filter((f) => !isLong(f));

  const who = name ? String(name.value) : 'Hong Yu Emblem Website';
  const heading = 'New Quote Request';
  const intro = `You have a new manufacturing quote request from ${who}.`;

  const bodyHtml = `
    <div style="font:800 20px/1.3 ${FONT};color:${INK};">${escapeHtml(heading)}</div>
    <div style="font:400 14px/1.6 ${FONT};color:${MUTED};padding:6px 0 18px 0;">${escapeHtml(intro)}</div>
    ${senderCard({
      name: name && String(name.value),
      email: email && String(email.value),
      phone: phone && String(phone.value),
      company: company && String(company.value),
    })}
    ${shorts.length ? `<div style="padding-top:22px;">${sectionLabel('Request details')}${specGrid(shorts)}</div>` : ''}
    ${longs.map(noteBlock).join('')}
    ${email ? ctaButton(`Reply to ${who}`, `mailto:${String(email.value)}`) : ''}`;

  const textFields: EmailField[] = [
    ...(name ? [name] : []),
    ...(company ? [company] : []),
    ...(email ? [email] : []),
    ...(phone ? [phone] : []),
    ...shorts,
    ...longs,
  ];

  return {
    subject: `New Quote Request — ${who}`,
    html: shell({ preheader: intro, bodyHtml, siteUrl }),
    text: `${heading}\n${intro}\n\n${rowsText(textFields)}`,
  };
}

/** Newsletter subscription email. */
export function renderNewsletterEmail(fields: Record<string, any>, siteUrl?: string) {
  const email = String(fields.email || '');
  const heading = 'New Newsletter Subscriber';
  const intro = 'Someone just subscribed to Hong Yu Emblem industrial insights from the website.';

  const bodyHtml = `
    <div style="font:800 20px/1.3 ${FONT};color:${INK};">${escapeHtml(heading)}</div>
    <div style="font:400 14px/1.6 ${FONT};color:${MUTED};padding:6px 0 18px 0;">${escapeHtml(intro)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CARD};border:1px solid ${LINE};border-radius:10px;">
      <tr><td align="center" style="padding:20px 18px;">
        <div style="font:700 10px/1.4 ${FONT};letter-spacing:.14em;text-transform:uppercase;color:${NAVY};">Subscriber email</div>
        <div style="padding-top:6px;"><a href="mailto:${escapeHtml(email)}" style="font:700 17px/1.4 ${FONT};color:${INK};text-decoration:none;">${escapeHtml(email)}</a></div>
      </td></tr>
    </table>`;

  return {
    subject: 'New Newsletter Subscriber — Hong Yu Emblem',
    html: shell({ preheader: intro, bodyHtml, siteUrl }),
    text: `${heading}\n${intro}\n\nSubscriber Email: ${email}`,
  };
}
