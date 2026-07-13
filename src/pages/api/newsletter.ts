import type { APIRoute } from 'astro';
import { renderNewsletterEmail } from '../../lib/email';
import { resolveFormRecipient } from '../../lib/form-recipient';

export const prerender = false;

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const env = (k: string) =>
  (typeof process !== 'undefined' ? process.env[k] : undefined) ?? (import.meta.env as any)[k];

export const POST: APIRoute = async ({ request, url }) => {
  const apiKey = env('RESEND_API_KEY');
  const from = env('RESEND_FROM') || 'Hong Yu <onboarding@resend.dev>';
  const siteUrl = env('PUBLIC_SITE_URL') || url.origin;

  const fields: Record<string, any> = {};
  try {
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      Object.assign(fields, await request.json());
    } else {
      const fd = await request.formData();
      for (const [k, v] of fd.entries()) if (!(v instanceof File)) fields[k] = v;
    }
  } catch {
    return json({ success: false, message: 'Invalid submission.' }, 400);
  }

  if (fields.botcheck) return json({ success: true, message: 'Thank you.' });

  const email = String(fields.email || '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ success: false, message: 'Please enter a valid email address.' }, 400);
  }

  if (!apiKey) {
    return json(
      { success: false, message: 'Email service is not configured (RESEND_API_KEY missing).' },
      500,
    );
  }

  const to = await resolveFormRecipient();
  if (!to) {
    return json(
      { success: false, message: 'Email service is not configured (no recipient address).' },
      500,
    );
  }
  const { subject, html, text } = renderNewsletterEmail({ email }, siteUrl);

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], reply_to: email, subject, html, text }),
    });
    if (res.ok) {
      return json({ success: true, message: "You're subscribed! Thanks for joining Hong Yu insights." });
    }
    const err = await res.json().catch(() => ({}));
    return json(
      { success: false, message: err?.message || 'Could not subscribe you. Please try again.' },
      502,
    );
  } catch {
    return json({ success: false, message: 'Network error. Please try again shortly.' }, 502);
  }
};
