/* Meridian Health — progressive enhancement only.
   Everything works without JS: nav via popover, accordion via <details>,
   dialog via invoker commands. This script adds fallbacks for browsers
   without the newest declarative APIs, a scrollspy, and the confirm flow. */

const dialog = document.getElementById('booking-dialog');
const form = document.getElementById('booking-form');
const donePanel = document.getElementById('booking-done');
const doneCopy = document.getElementById('done-copy');

/* ---- 1. Fallback: invoker commands (command= / commandfor) ----
   If the browser doesn't support commandfor, wire the buttons manually. */
const supportsInvoker =
  'commandfor' in HTMLButtonElement.prototype ||
  'command' in HTMLButtonElement.prototype;

if (!supportsInvoker && typeof dialog?.showModal === 'function') {
  document.querySelectorAll('[command="show-modal"][commandfor="booking-dialog"]')
    .forEach((btn) => btn.addEventListener('click', () => dialog.showModal()));
}

/* ---- 2. Fallback: closedby="any" (light-dismiss on backdrop click) ---- */
if (!('closedBy' in HTMLDialogElement.prototype)) {
  dialog?.addEventListener('click', (e) => {
    // Clicks on the backdrop resolve to the <dialog> element itself.
    if (e.target === dialog) dialog.close('dismiss');
  });
}

/* ---- 3. Booking flow (demo — nothing is sent anywhere) ---- */
const minDate = document.getElementById('f-date');
if (minDate) {
  minDate.min = new Date().toISOString().slice(0, 10);
}

document.getElementById('confirm-btn')?.addEventListener('click', () => {
  if (!form.reportValidity()) return; // native, accessible validation UI
  const name = document.getElementById('f-name')?.value.trim().split(/\s+/)[0];
  const service = document.getElementById('f-service')?.value;
  const date = document.getElementById('f-date')?.value;
  const nice = date
    ? new Date(date + 'T12:00:00').toLocaleDateString(undefined, {
        weekday: 'long', month: 'long', day: 'numeric',
      })
    : 'your preferred day';
  doneCopy.textContent =
    `Thanks${name ? ', ' + name : ''}! We've pencilled in ${service || 'your visit'} for ${nice}. ` +
    `Our scheduling team will confirm shortly — this demo sends nothing.`;
  form.hidden = true;
  donePanel.hidden = false;
});

document.getElementById('done-close')?.addEventListener('click', () => {
  dialog.close('confirmed');
});

/* Reset the dialog for next time once it's fully closed. */
dialog?.addEventListener('close', () => {
  setTimeout(() => {
    donePanel.hidden = true;
    form.hidden = false;
    form.reset();
  }, 300);
});

/* ---- 4. Close the mobile drawer when a link inside is chosen ---- */
document.getElementById('mobile-nav')?.addEventListener('click', (e) => {
  if (e.target.closest('a')) document.getElementById('mobile-nav')?.hidePopover();
});

/* ---- 5. Scrollspy: highlight the section currently in view ---- */
const navLinks = [...document.querySelectorAll('.primary-nav a[href^="#"]')];
const sections = navLinks
  .map((a) => document.querySelector(a.hash))
  .filter(Boolean);

if ('IntersectionObserver' in window && sections.length) {
  const visible = new Map();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.set(entry.target.id, entry.intersectionRatio);
        else visible.delete(entry.target.id);
      }
      const current = [...visible.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      for (const link of navLinks) {
        if (link.hash === `#${current}`) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      }
    },
    { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.25, 0.5, 1] }
  );
  sections.forEach((s) => observer.observe(s));
}
