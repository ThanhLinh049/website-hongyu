// Branded HTML email templates for the Hong Yu website forms.
//
// Pure module (no imports) so it renders anywhere. Inline styles + table layout
// for maximum email-client compatibility (Gmail, Outlook, Apple Mail). Brand
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

function rowsHtml(fields: EmailField[]): string {
  return fields
    .filter((f) => f.value != null && String(f.value).trim() !== '')
    .map((f) => {
      const val = escapeHtml(f.value).replace(/\n/g, '<br/>');
      return `
      <tr>
        <td style="padding:14px 24px 0 24px;">
          <div style="font:600 11px/1.4 Arial,Helvetica,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:${NAVY};">${escapeHtml(
        f.label,
      )}</div>
          <div style="font:400 15px/1.5 Arial,Helvetica,sans-serif;color:${INK};padding-top:3px;">${val}</div>
        </td>
      </tr>`;
    })
    .join('');
}

function rowsText(fields: EmailField[]): string {
  return fields
    .filter((f) => f.value != null && String(f.value).trim() !== '')
    .map((f) => `${f.label}: ${String(f.value)}`)
    .join('\n');
}

/** Full-page branded shell around a set of labelled rows. */
function shell(opts: {
  preheader: string;
  heading: string;
  intro: string;
  fields: EmailField[];
  siteUrl?: string;
}): string {
  const year = 2026;
  const site = (opts.siteUrl || '').replace(/\/$/, '');
  const siteLine = site
    ? `<a href="${escapeHtml(site)}" style="color:${NAVY};text-decoration:none;">${escapeHtml(
        site.replace(/^https?:\/\//, ''),
      )}</a>`
    : 'Hong Yu';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:${BG};">
  <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${escapeHtml(
    opts.preheader,
  )}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${LINE};border-radius:12px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:${NAVY};background-image:linear-gradient(135deg,${NAVY},${NAVY_DARK});padding:26px 24px;">
          <div style="font:800 24px/1 Arial,Helvetica,sans-serif;letter-spacing:.12em;color:#ffffff;">HONG YU</div>
          <div style="font:600 11px/1.4 Arial,Helvetica,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#bcd3f5;padding-top:6px;">Custom Badges &middot; Patches &middot; Metal Products</div>
        </td></tr>
        <tr><td style="height:4px;background:${ORANGE};font-size:0;line-height:0;">&nbsp;</td></tr>
        <!-- Intro -->
        <tr><td style="padding:26px 24px 6px 24px;">
          <div style="font:700 19px/1.3 Arial,Helvetica,sans-serif;color:${INK};">${escapeHtml(opts.heading)}</div>
          <div style="font:400 14px/1.6 Arial,Helvetica,sans-serif;color:${MUTED};padding-top:8px;">${escapeHtml(
            opts.intro,
          )}</div>
        </td></tr>
        <!-- Fields -->
        <tr><td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;">
            ${rowsHtml(opts.fields)}
            <tr><td style="padding:22px 24px 4px 24px;"><div style="height:1px;background:${LINE};font-size:0;line-height:0;">&nbsp;</div></td></tr>
          </table>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 24px 26px 24px;">
          <div style="font:400 12px/1.6 Arial,Helvetica,sans-serif;color:${MUTED};">
            This message was sent from the ${siteLine} website. Reply directly to respond to the sender.
          </div>
          <div style="font:400 11px/1.6 Arial,Helvetica,sans-serif;color:#9ca3af;padding-top:8px;">
            &copy; ${year} Hong Yu. All rights reserved.
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Contact / quote-request email. */
export function renderContactEmail(fields: Record<string, any>, siteUrl?: string) {
  const ordered: EmailField[] = [
    { label: 'Name', value: fields.name },
    { label: 'Email', value: fields.email },
    { label: 'Company', value: fields.Company ?? fields.company },
    { label: 'Phone', value: fields.Phone ?? fields.phone },
    { label: 'Product Type', value: fields['Product Type'] },
    { label: 'Estimated Quantity', value: fields['Estimated Quantity'] },
    { label: 'Dimensions', value: fields.Dimensions },
    { label: 'Finish', value: fields.Finish },
    { label: 'Backing Attachment', value: fields['Backing Attachment'] },
    { label: 'Requested Lead Time', value: fields['Requested Lead Time'] },
    { label: 'Project Notes', value: fields.message },
    { label: 'Agreed to Terms', value: fields['Agreed to Terms'] },
  ];
  const heading = 'New Quote Request';
  const intro = `You have a new manufacturing quote request from ${fields.name || 'a website visitor'}.`;
  return {
    subject: `New Quote Request — ${fields.name || 'Hong Yu Website'}`,
    html: shell({ preheader: intro, heading, intro, fields: ordered, siteUrl }),
    text: `${heading}\n${intro}\n\n${rowsText(ordered)}`,
  };
}

/** Newsletter subscription email. */
export function renderNewsletterEmail(fields: Record<string, any>, siteUrl?: string) {
  const ordered: EmailField[] = [{ label: 'Subscriber Email', value: fields.email }];
  const heading = 'New Newsletter Subscriber';
  const intro = 'Someone just subscribed to Hong Yu industrial insights from the website.';
  return {
    subject: 'New Newsletter Subscriber — Hong Yu',
    html: shell({ preheader: intro, heading, intro, fields: ordered, siteUrl }),
    text: `${heading}\n${intro}\n\n${rowsText(ordered)}`,
  };
}
