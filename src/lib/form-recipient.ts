import { wpQuery } from './api';

/**
 * Resolve where form emails should be delivered. Priority:
 *   1. WP → Site Settings → Form Recipient Email  (client-editable in wp-admin)
 *   2. WP → Footer Column 1 → Email
 *   3. FORM_RECIPIENT env fallback
 *
 * Returns '' when none of these resolve. There is deliberately NO hardcoded
 * address: a stray personal inbox baked into the source could silently swallow
 * every customer lead. Callers must treat '' as "recipient not configured" and
 * refuse to send (see the API routes).
 */
export async function resolveFormRecipient(): Promise<string> {
  const envFallback =
    (typeof process !== 'undefined' ? process.env.FORM_RECIPIENT : undefined) ||
    import.meta.env.FORM_RECIPIENT ||
    '';

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
    // WP unreachable (e.g. local WP down) — fall through to env fallback.
  }

  if (valid(envFallback)) return String(envFallback).trim();

  console.warn(
    '[resolveFormRecipient] No recipient configured — set WP → Site Settings → Form Recipient Email, or the FORM_RECIPIENT env var. Form submissions will be rejected until then.',
  );
  return '';
}
