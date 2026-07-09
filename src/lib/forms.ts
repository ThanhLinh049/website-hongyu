// Progressive-enhancement handler for the site's AJAX forms.
//
// Any <form data-ajax-form action="/api/..."> is submitted via fetch (no page
// reload) to its own action URL, which returns { success, message }. Before the
// request the form is validated client-side: each invalid field gets a red
// outline + an inline message beneath it, the first invalid field is focused,
// and a form-level status line is shown. Errors clear as the user fixes them.
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

// Same shape the server accepts (requires a dot in the domain) so the client
// doesn't pass an address the API would then reject.
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

// Per-field inline error <p>, keyed by the field it belongs to.
const errorEls = new WeakMap<Field, HTMLElement>();

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

// Fields we actually validate: skip the honeypot and anything the browser
// itself excludes from constraint validation (hidden, disabled, etc.).
function validatableFields(form: HTMLFormElement): Field[] {
  return Array.from(form.querySelectorAll<Field>('input, select, textarea')).filter(
    (f) => f.name !== 'botcheck' && f.willValidate,
  );
}

// Human-friendly message for whatever is wrong with a field.
function messageFor(field: Field): string | null {
  const v = field.validity;
  if (!v.valid) {
    if (v.valueMissing) {
      if (field instanceof HTMLInputElement && field.type === 'checkbox')
        return 'Please check this box to continue.';
      if (field instanceof HTMLSelectElement) return 'Please select an option.';
      return 'This field is required.';
    }
    if (v.typeMismatch)
      return field instanceof HTMLInputElement && field.type === 'email'
        ? 'Please enter a valid email address.'
        : 'Please enter a valid value.';
    if (v.patternMismatch) return field.title || 'Please match the requested format.';
    if (v.rangeUnderflow || v.rangeOverflow || v.stepMismatch)
      return 'Please enter a valid number.';
    return field.validationMessage || 'Please check this field.';
  }
  // Extra semantic check the browser is too lenient about: e.g. "a@b" passes
  // type=email but has no TLD, which the server rejects.
  if (field instanceof HTMLInputElement && field.type === 'email') {
    const val = field.value.trim();
    if (val && !EMAIL_RE.test(val)) return 'Please enter a valid email address.';
  }
  return null;
}

// Where the inline message sits: after the field, or after its relative wrapper
// (selects are wrapped in a .relative div holding the chevron) so it never
// overlaps sibling decorations.
function anchorFor(field: Field): HTMLElement {
  const parent = field.parentElement;
  if (parent && parent.classList.contains('relative')) return parent;
  return field;
}

function setFieldError(field: Field, message: string) {
  field.setAttribute('aria-invalid', 'true');
  // Inline style wins over any Tailwind border class regardless of source order.
  if (!(field instanceof HTMLInputElement && field.type === 'checkbox')) {
    field.style.borderColor = '#dc2626';
  }
  let el = errorEls.get(field);
  if (!el) {
    el = document.createElement('p');
    el.setAttribute('data-field-error', '');
    el.className = 'mt-1 text-[13px] leading-snug text-red-600';
    anchorFor(field).insertAdjacentElement('afterend', el);
    errorEls.set(field, el);
  }
  el.textContent = message;
}

function clearFieldError(field: Field) {
  field.removeAttribute('aria-invalid');
  field.style.borderColor = '';
  const el = errorEls.get(field);
  if (el) {
    el.remove();
    errorEls.delete(field);
  }
}

// Validate the whole form, painting inline errors. Returns true when valid.
function validateForm(form: HTMLFormElement): boolean {
  let firstInvalid: Field | null = null;
  for (const field of validatableFields(form)) {
    const msg = messageFor(field);
    if (msg) {
      setFieldError(field, msg);
      if (!firstInvalid) firstInvalid = field;
    } else {
      clearFieldError(field);
    }
  }
  if (firstInvalid) {
    firstInvalid.focus();
    if (typeof firstInvalid.scrollIntoView === 'function')
      firstInvalid.scrollIntoView({ block: 'center', behavior: 'smooth' });
    return false;
  }
  return true;
}

// Re-validate a single field once the user has interacted with it, so errors
// disappear the moment the input becomes valid.
function bindLiveValidation(form: HTMLFormElement) {
  const revalidate = (e: Event) => {
    const field = e.target as Field;
    if (!field || !('validity' in field) || field.name === 'botcheck') return;
    if (!errorEls.has(field) && field.getAttribute('aria-invalid') !== 'true') return;
    const msg = messageFor(field);
    if (msg) setFieldError(field, msg);
    else clearFieldError(field);
  };
  form.addEventListener('input', revalidate);
  form.addEventListener('change', revalidate);
}

function clearAllErrors(form: HTMLFormElement) {
  for (const field of validatableFields(form)) clearFieldError(field);
}

async function handleSubmit(form: HTMLFormElement, e: Event) {
  e.preventDefault();

  const status = ensureStatusEl(form);
  if (!status.dataset.statusBase) status.dataset.statusBase = status.className;

  if (!validateForm(form)) {
    showStatus(status, 'error', 'Please fix the highlighted fields and try again.');
    return;
  }

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
      clearAllErrors(form);
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
    // We drive validation ourselves; suppress the browser's native bubbles.
    form.noValidate = true;
    bindLiveValidation(form);
    form.addEventListener('submit', (e) => handleSubmit(form, e));
  });
}
