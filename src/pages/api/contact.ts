import type { APIRoute } from 'astro';
import { renderContactEmail } from '../../lib/email';
import { resolveFormRecipient } from '../../lib/form-recipient';

export const prerender = false;

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
// Vercel serverless functions cap the request body at ~4.5MB, so anything larger
// never even reaches this handler (the platform returns 413). Keep our own limit
// just under that and surface a clear error, instead of silently dropping the
// file while still reporting success. Keep this number in sync with the
// "Max Xmb" hint shown in contact.astro (uploadHint).
const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;

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

  // Parse fields + optional file (multipart) or JSON.
  const fields: Record<string, any> = {};
  let file: File | null = null;
  try {
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      Object.assign(fields, await request.json());
    } else {
      const fd = await request.formData();
      for (const [k, v] of fd.entries()) {
        if (v instanceof File) {
          if (v.size > 0) file = v;
        } else {
          fields[k] = v;
        }
      }
    }
  } catch {
    return json({ success: false, message: 'Invalid form submission.' }, 400);
  }

  // Honeypot — pretend success so bots get no signal.
  if (fields.botcheck) return json({ success: true, message: 'Thank you.' });

  // Find a valid email among the submitted values to use as reply-to; require
  // at least one so the team can always respond to the enquiry.
  const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  const emailEntry = Object.entries(fields).find(
    ([k, v]) => k !== 'botcheck' && typeof v === 'string' && emailRe.test(v.trim()),
  );
  if (!emailEntry) {
    return json({ success: false, message: 'A valid email address is required.' }, 400);
  }
  const replyTo = String(emailEntry[1]).trim();

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
  const { subject, html, text } = renderContactEmail(fields, siteUrl);

  const payload: Record<string, any> = {
    from,
    to: [to],
    reply_to: replyTo,
    subject,
    html,
    text,
  };

  // Reject oversized artwork with a clear message rather than sending the
  // enquiry without the file (which looked like success but lost the artwork).
  if (file && file.size > MAX_ATTACHMENT_BYTES) {
    return json(
      {
        success: false,
        message:
          'Your artwork file is too large (max 4MB). Please compress it or share a download link in the notes.',
      },
      400,
    );
  }
  // Attach the uploaded artwork when present.
  if (file) {
    const buf = Buffer.from(await file.arrayBuffer());
    payload.attachments = [{ filename: file.name || 'artwork', content: buf.toString('base64') }];
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return json({
        success: true,
        message: 'Thank you! Your quote request has been sent. Our team will reply within 24 hours.',
      });
    }
    const err = await res.json().catch(() => ({}));
    return json(
      { success: false, message: err?.message || 'Could not send your message. Please try again.' },
      502,
    );
  } catch {
    return json({ success: false, message: 'Network error. Please try again shortly.' }, 502);
  }
};
