import Swal from 'sweetalert2'

/** SweetAlert2 themed with the site's design tokens (Tailwind classes, no default styling). */
const themed = Swal.mixin({
  buttonsStyling: false,
  customClass: {
    popup: '!rounded-[28px] !p-8 !font-sans',
    title: '!font-serif !text-[28px] !font-normal !text-text',
    htmlContainer: '!text-[15px] !text-text-soft',
    actions: '!gap-3 !mt-6',
    confirmButton:
      'rounded-full bg-primary px-6 py-3.5 text-[14px] font-semibold leading-none text-white transition hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    cancelButton:
      'rounded-full border border-border bg-white px-6 py-3.5 text-[14px] font-semibold leading-none text-text transition hover:bg-muted',
    icon: '!border-secondary',
  },
})

/** Resolves to true when the user confirms a destructive action. */
export async function confirmDelete(what = 'this item', detail = 'This action cannot be undone.') {
  const res = await themed.fire({
    icon: 'warning',
    title: `Delete ${what}?`,
    text: detail,
    showCancelButton: true,
    confirmButtonText: 'Yes, delete',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    focusCancel: true,
    customClass: {
      confirmButton:
        'rounded-full bg-red-600 px-6 py-3.5 text-[14px] font-semibold leading-none text-white transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600',
      cancelButton:
        'rounded-full border border-border bg-white px-6 py-3.5 text-[14px] font-semibold leading-none text-text transition hover:bg-muted',
      popup: '!rounded-[28px] !p-8 !font-sans',
      title: '!font-serif !text-[28px] !font-normal !text-text',
      htmlContainer: '!text-[15px] !text-text-soft',
      actions: '!gap-3 !mt-6',
    },
  })
  return res.isConfirmed
}

const toastMixin = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3200,
  timerProgressBar: true,
  customClass: { popup: '!rounded-2xl !font-sans !text-[14px] !shadow-xl' },
  didOpen: (el) => {
    el.addEventListener('mouseenter', Swal.stopTimer)
    el.addEventListener('mouseleave', Swal.resumeTimer)
  },
})

export const toast = {
  success: (title) => toastMixin.fire({ icon: 'success', title, iconColor: '#417572' }),
  error: (title) => toastMixin.fire({ icon: 'error', title, timer: 5000 }),
}
