import Swal from 'sweetalert2'

/* ---------------------------------------------------------------------------
   SweetAlert2 helpers — one consistent dialog system for the whole app.

     showSuccess(title, text?, opts?)      success dialog (auto-closes by default)
     showError(title, text?, opts?)        error dialog
     showWarning(title, text?, opts?)      warning dialog (validation, duplicates…)
     showConfirm({ title, text, … })       resolves true/false
     confirmDelete(what, detail?)          strong destructive confirmation
     showLoading(title?, text?)            blocking spinner (no outside click/Esc)
     closeLoading()                        closes the spinner if it is open
     withLoading(fn, { title, text })      spinner while fn() runs; ALWAYS closes,
                                           even when fn throws
     toast.success / toast.error           compact non-blocking notifications

   Styling uses the site's Tailwind tokens. Inside the admin panel dialogs pick
   up the admin typography (Inter); on the public website they keep the
   website's fonts.
---------------------------------------------------------------------------- */

/** Adds the admin class to the container when an admin screen is mounted. */
const context = () => (typeof document !== 'undefined' && document.querySelector('.admin-ui') ? 'admin-swal' : 'site-swal')

const BTN = {
  primary:
    'inline-flex items-center justify-center rounded-full bg-primary px-6 py-3.5 text-[14px] font-semibold leading-none text-white transition hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
  danger:
    'inline-flex items-center justify-center rounded-full bg-red-600 px-6 py-3.5 text-[14px] font-semibold leading-none text-white transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600',
  cancel:
    'inline-flex items-center justify-center rounded-full border border-border bg-white px-6 py-3.5 text-[14px] font-semibold leading-none text-text transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
}

const ICON_COLOR = {
  success: '#417572', // primary
  warning: '#b88e2d', // accent
  error: '#c0392b',
  question: '#417572',
  info: '#417572',
}

/** Public website: the booking palette (forest green, logo gold) on the ivory card. */
const SITE_ICON_COLOR = {
  success: '#1a3832',
  warning: '#c9952f',
  error: '#a8322a',
  question: '#1a3832',
  info: '#1a3832',
}

/** Base dialog classes; `confirm` selects the confirm-button style. */
const classes = (confirm = 'primary') => ({
  container: `nawa-swal ${context()}`,
  popup: 'nawa-swal-popup',
  title: 'nawa-swal-title',
  htmlContainer: 'nawa-swal-text',
  actions: 'nawa-swal-actions',
  confirmButton: BTN[confirm],
  cancelButton: BTN.cancel,
  loader: 'nawa-swal-loader',
  timerProgressBar: 'nawa-swal-progress',
})

const base = (icon, title, text, { danger = false, ...opts } = {}) => ({
  icon,
  iconColor: (context() === 'site-swal' ? SITE_ICON_COLOR : ICON_COLOR)[icon],
  title,
  text,
  buttonsStyling: false,
  reverseButtons: true,
  showClass: { popup: 'nawa-swal-in' },
  hideClass: { popup: 'nawa-swal-out' },
  customClass: classes(danger ? 'danger' : 'primary'),
  ...opts,
})

export function showSuccess(title, text, opts = {}) {
  return Swal.fire(
    base('success', title, text, {
      confirmButtonText: 'Done',
      timer: 4500,
      timerProgressBar: true,
      ...opts,
    }),
  )
}

export function showError(title = 'Something went wrong', text, opts = {}) {
  return Swal.fire(base('error', title, text, { confirmButtonText: 'OK', ...opts }))
}

export function showWarning(title, text, opts = {}) {
  return Swal.fire(base('warning', title, text, { confirmButtonText: 'OK', ...opts }))
}

/** Generic confirmation. Resolves to true only when the user confirms. */
export async function showConfirm({
  title = 'Are you sure?',
  text = 'This action cannot be undone.',
  confirmText = 'Yes, continue',
  cancelText = 'Cancel',
  icon = 'warning',
  danger = false,
} = {}) {
  const res = await Swal.fire(
    base(icon, title, text, {
      danger,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      focusCancel: danger, // destructive actions default to "Cancel"
    }),
  )
  return res.isConfirmed
}

/** Strong confirmation for permanent deletes. */
export function confirmDelete(what = 'this item', detail = 'This action cannot be undone.') {
  return showConfirm({
    title: `Delete ${what}?`,
    text: `${detail}${/cannot be undone/i.test(detail) ? '' : ' This action cannot be undone.'}`,
    confirmText: 'Yes, delete',
    icon: 'warning',
    danger: true,
  })
}

const LOADING_CLASS = 'nawa-swal-popup--loading'

/** Blocking loading dialog. Pair with closeLoading(), or use withLoading(). */
export function showLoading(title = 'Please wait…', text) {
  // The dialog has no button to take focus, so release it from the page first: SweetAlert hides
  // the page (aria-hidden) and the browser blocks that while a field inside it is still focused.
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  Swal.fire({
    title,
    text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false, // no button, so Enter cannot dismiss it either
    showClass: { popup: 'nawa-swal-in' },
    hideClass: { popup: 'nawa-swal-out' },
    customClass: { ...classes(), popup: `nawa-swal-popup ${LOADING_CLASS}` },
  })
  // Start the spinner synchronously — not in didOpen — so a fast response can
  // never close the dialog before the spinner starts and leave it stuck.
  Swal.showLoading()
}

/**
 * Closes the loading dialog if it is the one currently open (never closes other alerts).
 * Checks the popup element directly rather than Swal.isVisible(), which depends on layout.
 */
export function closeLoading() {
  if (Swal.getPopup()?.classList.contains(LOADING_CLASS)) Swal.close()
}

/**
 * Runs `fn` behind a loading dialog and always closes it afterwards (also on
 * errors), so a spinner can never be left on screen. Re-throws fn's error.
 */
export async function withLoading(fn, { title = 'Please wait…', text } = {}) {
  showLoading(title, text)
  try {
    return await fn()
  } finally {
    closeLoading()
  }
}

/** Minimal success mark for the booking dialog: a fine ring and a check that draw themselves in. */
const BOOKING_MARK =
  '<svg class="booking-mark" viewBox="0 0 64 64" width="64" height="64" fill="none" aria-hidden="true" focusable="false">' +
  '<circle class="booking-mark-ring" cx="32" cy="32" r="30" stroke="currentColor" stroke-width="1.25"/>' +
  '<path class="booking-mark-check" d="M21 33.5l7.5 7.5L44 25" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>' +
  '</svg>'

/**
 * Appointment confirmation in the site's booking style (styles: .booking-swal* in index.css):
 * warm ivory card, forest-green serif title under a minimal drawn check, muted green text and a
 * rectangular forest-green "Continue" button. No default SweetAlert icon or colours.
 */
export function showBookingSuccess({ title, text, confirmText = 'Continue' }) {
  return Swal.fire({
    title: `${BOOKING_MARK}<span>${escapeHtml(title)}</span>`,
    html: `<span class="booking-swal-rule" aria-hidden="true"></span><p>${escapeHtml(text)}</p>`,
    confirmButtonText: confirmText,
    buttonsStyling: false,
    showClass: { popup: 'nawa-swal-in' },
    hideClass: { popup: 'nawa-swal-out' },
    customClass: {
      container: `nawa-swal ${context()}`,
      popup: 'booking-swal',
      title: 'booking-swal-title',
      htmlContainer: 'booking-swal-text',
      actions: 'booking-swal-actions',
      confirmButton: 'booking-swal-btn',
    },
  })
}

/** Maps an API error (see services/api.js) to the right alert type. */
export function showApiError(err, { title = 'Something went wrong', warningTitle = 'Please check your details' } = {}) {
  const status = err?.status
  if (status === 0) return showError('Connection problem', err.message)
  if ([400, 409, 413, 422, 429].includes(status)) return showWarning(status === 429 ? 'Please wait a moment' : warningTitle, err.message)
  return showError(title, err?.message)
}

/* ---------------------------------------------------------------------------
   Toasts — compact floating notifications (styles: .nawa-toast* in index.css).
   Same SweetAlert2 timer, hover-to-pause and dismissal as before; only the
   markup and styling are custom.
---------------------------------------------------------------------------- */

const escapeHtml = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const ICONS = {
  success:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 6 9 17l-5-5"/></svg>',
  error:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 8v5"/><path d="M12 16.5h.01"/><circle cx="12" cy="12" r="9"/></svg>',
}

const CLOSE_ICON =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18M6 6l12 12"/></svg>'

const TOAST_CLASSES = {
  container: 'nawa-toast-container',
  popup: 'nawa-toast',
  htmlContainer: 'nawa-toast-content',
  closeButton: 'nawa-toast-close',
  timerProgressBar: 'nawa-toast-progress',
}

const toastMixin = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  showCloseButton: true,
  closeButtonHtml: CLOSE_ICON,
  closeButtonAriaLabel: 'Dismiss notification',
  timer: 3200,
  timerProgressBar: true,
  buttonsStyling: false,
  showClass: { popup: 'nawa-toast-in' },
  hideClass: { popup: 'nawa-toast-out' },
  customClass: TOAST_CLASSES,
  didOpen: (el) => {
    el.addEventListener('mouseenter', Swal.stopTimer)
    el.addEventListener('mouseleave', Swal.resumeTimer)
  },
})

/** Fires a toast. `description` is optional; without it only the title line is shown. */
function fireToast(variant, title, description, timer) {
  const body = `
    <div class="nawa-toast-body">
      <span class="nawa-toast-icon nawa-toast-icon--${variant}">${ICONS[variant]}</span>
      <div class="nawa-toast-text">
        <p class="nawa-toast-title">${escapeHtml(title)}</p>
        ${description ? `<p class="nawa-toast-desc">${escapeHtml(description)}</p>` : ''}
      </div>
    </div>`
  return toastMixin.fire({
    html: body,
    timer,
    customClass: { ...TOAST_CLASSES, container: `nawa-toast-container ${context()}` },
    // Success is a polite status update; errors interrupt.
    didRender: (popup) => {
      popup.setAttribute('role', variant === 'error' ? 'alert' : 'status')
      popup.setAttribute('aria-live', variant === 'error' ? 'assertive' : 'polite')
      popup.classList.toggle('nawa-toast--error', variant === 'error')
    },
  })
}

export const toast = {
  success: (title, description) => fireToast('success', title, description, 3200),
  error: (title, description) => fireToast('error', title, description, 5000),
}
