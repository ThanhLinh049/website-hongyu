// Progressive-enhancement handler for the site's AJAX forms.
//
// Any <form data-ajax-form action="/api/..."> is submitted via fetch (no page
// reload) to its own action URL, which returns { success, message }. Inline
// status feedback is shown and the submit button is disabled while sending.
//
// Optional: mark a status target with [data-form-status] inside the form,
// otherwise one is created just above the submit button. Set data-success on
// the form to override the success message.

type StatusKind = 'pending' | 'success' | 'error';

const STATUS_CLASSES: Record<StatusKind, string> = {
  pending: 'text-on-surface-variant',
  success: 'text-green-700',
  error: 'text-red-600',
};

function ensureStatusEl(form: HTMLFormElement): HTMLElement {
  let el = form.querySelector<HTMLElement>('[data-form-status]');
  if (!el) {
    el = document.createElement('p');
    el.setAttribute('data-form-status', '');
    el.className = 'font-body-sm text-body-sm mt-2';
    const btn = form.querySelector('button[type="submit"]');
    if (btn && btn.parentElement) btn.parentElement.insertBefore(el, btn);
    else form.appendChild(el);
  }
  return el;
}

function showStatus(el: HTMLElement, kind: StatusKind, message: string) {
  const base = el.dataset.statusBase || '';
  el.className = `${base} ${STATUS_CLASSES[kind]}`.trim();
  el.textContent = message;
  el.setAttribute('role', kind === 'error' ? 'alert' : 'status');
}

async function handleSubmit(form: HTMLFormElement, e: Event) {
  e.preventDefault();
  if (!form.reportValidity()) return;

  const status = ensureStatusEl(form);
  if (!status.dataset.statusBase) status.dataset.statusBase = status.className;
  const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const endpoint = form.getAttribute('action') || '';

  const originalLabel = btn?.innerHTML ?? '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = 'Sending…';
  }
  showStatus(status, 'pending', 'Sending…');

  try {
    const res = await fetch(endpoint, { method: 'POST', body: new FormData(form) });
    const data = await res.json().catch(() => ({ success: false }));
    if (res.ok && data.success) {
      showStatus(status, 'success', form.dataset.success || data.message || 'Thank you! Your message has been sent.');
      form.reset();
    } else {
      showStatus(status, 'error', data.message || 'Something went wrong. Please try again.');
    }
  } catch {
    showStatus(status, 'error', 'Network error. Please check your connection and try again.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalLabel;
    }
  }
}

export function initForms() {
  document.querySelectorAll<HTMLFormElement>('form[data-ajax-form]').forEach((form) => {
    if (form.dataset.ajaxBound) return;
    form.dataset.ajaxBound = '1';
    form.addEventListener('submit', (e) => handleSubmit(form, e));
  });
}
