# Meridian Health — healthcare demo website

A modern, dependency-free healthcare clinic website built with semantic HTML,
modern CSS, and a few lines of progressive-enhancement JavaScript. It follows
the patterns documented in this repository's
[Modern Web Guidance](https://developer.chrome.com/docs/modern-web-guidance)
guides.

## Run it

Any static file server works — no build step, no dependencies:

```shell
python3 -m http.server 8000 --directory healthcare-website
# → http://localhost:8000
```

## What's inside

| File | Purpose |
| --- | --- |
| `index.html` | Semantic single-page site: hero, services, clinicians, testimonials, FAQ, contact, booking dialog, mobile drawer |
| `styles.css` | Cascade layers, `oklch()` + `light-dark()` design tokens, container queries, scroll-driven reveal animations, `@starting-style` enter/exit transitions, reduced-motion support |
| `app.js` | Progressive enhancement only: invoker-command / `closedby` fallbacks, scrollspy (IntersectionObserver), demo booking confirmation |
| `assets/logo.png` | Generated brand mark / favicon |

## Modern platform features used

- **`<dialog>` + invoker commands** (`command="show-modal"` / `commandfor`) for the
  booking modal, with JS fallback for older browsers; `closedby="any"` light dismiss
- **Popover API** for the mobile navigation drawer (top layer, light dismiss, zero JS)
- **Native `<details name>` exclusive accordion** for the FAQ
- **Scroll-driven animations** for header elevation, section reveals, and stat bars —
  no scroll listeners, no animation library
- **`@starting-style` + `transition-behavior: allow-discrete`** for entry/exit
  animations of dialogs, popovers, and backdrops
- **Container queries** so service cards adapt to their own width
- **Accessible forms**: correct `autocomplete` tokens, `:user-invalid` feedback that
  only appears after interaction, `field-sizing: content` on the notes textarea
- **`light-dark()` + `color-scheme`**, `oklch()` color tokens, `accent-color`,
  `text-wrap: balance / pretty`, `scrollbar-color`
- **`prefers-reduced-motion`** honored globally
- **Scrollspy** with `IntersectionObserver` + `aria-current`

## Disclaimer

This is a demonstration site. All content — clinicians, reviews, contact details —
is fictional and illustrative only; nothing here is medical advice, and the
booking form sends nothing anywhere.
