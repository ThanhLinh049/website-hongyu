import type { APIRoute } from 'astro';
import { renderContactEmail } from '../../lib/email';
import { resolveFormRecipient } from '../../lib/form-recipient';

export const prerender = false;

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
// Keep total request comfortably under Resend's limit; skip oversized uploads.
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

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

  if (!fields.name || !fields.email) {
    return json({ success: false, message: 'Name and email are required.' }, 400);
  }

  if (!apiKey) {
    return json(
      { success: false, message: 'Email service is not configured (RESEND_API_KEY missing).' },
      500,
    );
  }

  const to = await resolveFormRecipient();
  const { subject, html, text } = renderContactEmail(fields, siteUrl);

  const payload: Record<string, any> = {
    from,
    to: [to],
    reply_to: fields.email,
    subject,
    html,
    text,
  };

  // Attach the uploaded artwork when present and within size limits.
  if (file && file.size <= MAX_ATTACHMENT_BYTES) {
    const buf = Buffer.from(await file.arrayBuffer());
    payload.attachments = [{ filename: file.name || 'artwork', content: buf.toString('base64') }];
  } else if (file) {
    payload.text += `\n\n[Note: an attachment "${file.name}" was too large to include and should be requested from the sender.]`;
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
