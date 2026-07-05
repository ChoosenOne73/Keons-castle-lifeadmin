# LifeAdmin — PWA (Progressive Web App)

This is the installable, offline-capable version of LifeAdmin. It is a
standalone web app — no Apple App Store or Google Play submission required.
People install it straight from a browser onto their phone or computer's
home screen.

## What's inside

- `index.html` — the app itself (all 6 screens: Dashboard, Documents,
  Document Detail, Family, Alerts, Settings)
- `styles.css` — all styling
- `app.js` — navigation logic, install-prompt handling, service worker setup
- `manifest.json` — tells phones/browsers how to install the app (name,
  icons, colors, start screen)
- `sw.js` — service worker that caches the app so it works offline after
  first load
- `icons/` — full icon set (72px–512px, plus maskable + Apple touch icon)

## How to host it

Any static file host works. A few simple options:

1. **Netlify / Vercel** — drag-and-drop the whole `lifeadmin-pwa` folder.
   Both give you a live HTTPS URL in under a minute, which is required for
   PWA installability (service workers only run on HTTPS, or on localhost
   for testing).
2. **GitHub Pages** — push this folder to a repo and enable Pages.
3. **Your own domain** — upload via FTP/cPanel to any web host that serves
   static files. Just make sure the folder structure stays intact (the
   manifest and service worker use relative paths).

## How people install it

- **Android (Chrome)** — visiting the site shows an "Install app" banner
  automatically (the one built into this app, plus Chrome's native one).
  Tapping it adds a real app icon to their home screen.
- **iPhone (Safari)** — Safari doesn't show an automatic install prompt.
  Users tap Share → "Add to Home Screen." It then behaves like a normal
  app icon with no Safari address bar.
- **Desktop (Chrome/Edge)** — an install icon appears in the address bar.

## Selling it

Since this isn't distributed through Apple or Google, you control
distribution entirely — for example:

- Sell access via your own checkout (Stripe, Gumroad, etc.) and email
  customers the live URL plus install instructions once they purchase.
- List it as a digital download / service on Amazon (under a digital
  goods or services category, not the Appstore) and deliver the same way.
- Gate the URL behind a login if you want to restrict it to paying
  customers only.

## Updating the app later

Because of the service worker cache, returning users may briefly see the
old version after you push an update. Bump the `CACHE_NAME` value at the
top of `sw.js` (e.g. `lifeadmin-v1` → `lifeadmin-v2`) every time you
deploy changes — this forces the service worker to fetch fresh files.
