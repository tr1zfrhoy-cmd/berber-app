# حلاق دلفري · Barber Delivery — PRD

## Original Problem Statement
> "مرحبا اريده تطبيق حلاق دلفري لخدمه الزبائن كامل من الاعدادات والخريطه والزرار واجهه التحميل والمحفظه والاستقطاع لكل حلاقه وربط حسابتي ك دعم للناس"

## Architecture
- **Backend**: FastAPI + MongoDB + JWT (HS256, 30d). All routes under `/api`.
- **Frontend**: React + Tailwind + Leaflet + react-router. Cairo font. RTL Arabic. Dark luxury (gold #D4AF37 on #050505).
- **Single combined app** routing by role: customer / barber / admin.

## User Personas
1. **Customer** — books home barber service, browses map, pays in IQD.
2. **Barber** — receives requests, accepts/rejects, sees wallet (after 1,000 IQD/job platform fee).
3. **Admin** — owner (tr1zfrhoy@gmail.com auto-promoted), oversees stats, users, bookings, support chat.

## Core Requirements (Static)
- Currency: Iraqi Dinar (IQD).
- Services: حلاقة كاملة 10,000 · حلاقة أطفال 5,000 · لحية/شعر 5,000 · سشوار 5,000.
- Platform fee: **1,000 IQD** deducted on booking acceptance (barber).
- Free OpenStreetMap (Leaflet, CartoDB Dark tiles).
- Support: WhatsApp `07812059874`, Email `tr1zfrhoy@gmail.com`, in-app chat.
- Withdrawal: barber requests via in-app chat with mastercard number.

## What's Implemented (2026-02)
- [x] Splash loading screen with brand animation (Berber name)
- [x] **Phone + name + password authentication** (no email)
- [x] Admin auto-promotion by phone `07812059874`
- [x] Customer home (4 service tiles, hero, recent bookings, FAB)
- [x] Booking form with inline validation; coords + customer_phone forwarded
- [x] Map view (Leaflet dark tiles, barbers + customer markers, FAB)
- [x] Barber dashboard:
  - Customer phone clickable (`tel:`)
  - "فتح الموقع في الخرائط" link → Google Maps with lat,lng
  - **Push Notifications** (browser Notification API + audio ping)
  - Accept (-1,000 IQD) / Reject / Start / Complete
- [x] Wallet (gross/fees/net for barber, spent for customer, revenue for admin)
- [x] Support chat (user thread, admin grouped threads, WhatsApp/email shortcuts)
- [x] Settings (profile, location, logout)
- [x] Admin dashboard, users, bookings
- [x] Bottom tab nav per role
- [x] State-machine guard on booking accept (409 double-accept)
- [x] **PWA**: manifest.json, service worker (/sw.js), gold scissors `icon.svg`
- [x] **Privacy / No-Index**: robots.txt + meta noindex,nofollow,noarchive,nosnippet
- [x] **Capacitor config** (`capacitor.config.json`, `PUBLISHING.md`) for Google Play & App Store

## Test Status
- Backend pytest: **24/24 passing**
- Frontend: 100% on tested critical flows (login, booking, accept, push permission, validation)

## Backlog
### P1 — Next Phase
- Withdrawal record entity (track payouts) + admin "mark paid" action
- Push notifications (web push / FCM) for new bookings
- Ratings & reviews after completion
- Barber availability/schedule
- Multiple language toggle (AR/EN)

### P2
- In-app payments via Stripe (when keys provided)
- Photos upload (barber portfolio, before/after) via object storage
- ETA + live tracking
- Service add-ons (henna, hair color, etc.)

## Test Credentials
See `/app/memory/test_credentials.md`.
