// Web3Forms client handler.
//
// Any <form data-web3form> on the page is wired up to submit to Web3Forms via
// fetch (no page reload), with inline success / error feedback. The access key
// is rendered as a hidden <input name="access_key"> from the
// PUBLIC_WEB3FORMS_ACCESS_KEY env var (see Layout / component frontmatter).
//
// Optional per-form data attributes:
//   data-w3-success="..."  custom success message
//
// Mark a status target with [data-w3-status] inside the form to control where
// the message renders; otherwise one is created right above the submit button.

type StatusKind = 'pending' | 'success' | 'error';

const STATUS_CLASSES: Record<StatusKind, string> = {
  pending: 'text-on-surface-variant',
  success: 'text-green-700',
  error: 'text-red-600',
};

function ensureStatusEl(form: HTMLFormElement): HTMLElement {
  let el = form.querySelector<HTMLElement>('[data-w3-status]');
  if (!el) {
    el = document.createElement('p');
    el.setAttribute('data-w3-status', '');
    el.className = 'font-body-sm text-body-sm mt-2';
    const btn = form.querySelector('button[type="submit"]');
    if (btn && btn.parentElement) {
      btn.parentElement.insertBefore(el, btn);
    } else {
      form.appendChild(el);
    }
  }
  return el;
}

function showStatus(el: HTMLElement, kind: StatusKind, message: string) {
  el.className = `font-body-sm text-body-sm mt-2 ${STATUS_CLASSES[kind]}`;
  el.textContent = message;
  el.setAttribute('role', kind === 'error' ? 'alert' : 'status');
}

async function handleSubmit(form: HTMLFormElement, e: Event) {
  e.preventDefault();
  if (!form.reportValidity()) return;

  const status = ensureStatusEl(form);
  const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const accessKey = form.querySelector<HTMLInputElement>('input[name="access_key"]')?.value?.trim();

  if (!accessKey) {
    showStatus(
      status,
      'error',
      'Email service is not configured. Set PUBLIC_WEB3FORMS_ACCESS_KEY in your environment.',
    );
    return;
  }

  const originalLabel = btn?.innerHTML ?? '';
  if (btn) {
    btn.disabled = true;
    btn.dataset.loading = '1';
    btn.innerHTML = 'Sending…';
  }
  showStatus(status, 'pending', 'Sending your message…');

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: new FormData(form),
    });
    const data = await res.json().catch(() => ({ success: false }));

    if (res.ok && data.success) {
      showStatus(
        status,
        'success',
        form.dataset.w3Success ||
          'Thank you! Your message has been sent. Our team will be in touch shortly.',
      );
      form.reset();
    } else {
      showStatus(
        status,
        'error',
        data.message || 'Something went wrong. Please try again or email us directly.',
      );
    }
  } catch {
    showStatus(status, 'error', 'Network error. Please check your connection and try again.');
  } finally {
    if (btn) {
      btn.disabled = false;
      delete btn.dataset.loading;
      btn.innerHTML = originalLabel;
    }
  }
}

export function initWeb3Forms() {
  document.querySelectorAll<HTMLFormElement>('form[data-web3form]').forEach((form) => {
    if (form.dataset.w3Bound) return;
    form.dataset.w3Bound = '1';
    form.addEventListener('submit', (e) => handleSubmit(form, e));
  });
}
