import { wpQuery } from './api';

/**
 * Resolve where form emails should be delivered. Priority:
 *   1. WP → Site Settings → Form Recipient Email  (client-editable in wp-admin)
 *   2. WP → Footer Column 1 → Email
 *   3. FORM_RECIPIENT env fallback
 *   4. Hard default
 */
export async function resolveFormRecipient(): Promise<string> {
  const envFallback =
    (typeof process !== 'undefined' ? process.env.FORM_RECIPIENT : undefined) ||
    import.meta.env.FORM_RECIPIENT ||
    'thanhlinh92a@gmail.com';

  const valid = (e: unknown) =>
    typeof e === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.trim());

  try {
    const data = await wpQuery({
      query: `{
        page(id: "site-settings", idType: URI) {
          siteSettingsPage {
            formRecipientEmail
            footerColumn1 { email }
          }
        }
      }`,
    });
    const s = data?.page?.siteSettingsPage;
    const fromWp = s?.formRecipientEmail || s?.footerColumn1?.email;
    if (valid(fromWp)) return String(fromWp).trim();
  } catch {
    // WP unreachable (e.g. local WP down) — fall through to env default.
  }
  return envFallback;
}
