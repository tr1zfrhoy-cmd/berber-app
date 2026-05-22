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
- [x] **Phone + name + password authentication** (no email) - admin role escalation blocked
- [x] Admin auto-promotion by phone `07812059874`
- [x] Customer home (services, hero, recent bookings, FAB, rate-barber CTA on completed)
- [x] Booking form with inline validation; coords + customer_phone forwarded
- [x] Map view (Leaflet dark tiles, barbers + customer markers, FAB)
- [x] Barber dashboard:
  - Customer phone clickable (`tel:`)
  - Google Maps link with lat,lng
  - **Push Notifications** (browser Notification API + audio ping)
  - **Wallet balance card** with شحن via WhatsApp CTA
  - Accept/Reject/Start/Complete state machine
- [x] **Wallet system**: barber has `wallet_balance`; commission (500 IQD, dynamic) deducted from wallet on accept; barber keeps 100% of booking price
- [x] **Admin dynamic settings** (`/app/admin-settings`): editable commission, WhatsApp phone, full CRUD on services & prices
- [x] **Admin user detail page** (`/app/users/:id`): click any user → full profile + **wallet top-up form** (+/- amount, reason)
- [x] Barber profile: avatar URL, portfolio (URL list), ratings
- [x] **Ratings system**: 5-star modal after completed bookings; aggregated rating_avg + count on barber; public `/api/barbers/{id}` with reviews
- [x] Services split: full, kids, hair, beard, blowdry (all editable from admin)
- [x] Support chat + **WhatsApp pre-filled messages** by role (customer/barber)
- [x] Settings (profile, avatar, portfolio, location, WhatsApp support, logout)
- [x] Bottom tab nav per role
- [x] State-machine guard on booking accept + 402 balance check
- [x] **PWA**: manifest.json, service worker, new scissors icon.svg
- [x] **Privacy / No-Index**: robots.txt + meta noindex,nofollow,noarchive
- [x] **Capacitor config** + `/app/PUBLISHING.md` for store publishing
- [x] **Barber Works social feed** (grouped per barber, horizontal carousel, full-screen lightbox preview)
- [x] **Direct image uploads** (avatar + portfolio) via Emergent Object Storage; gallery access enabled on mobile
- [x] **Admin delete user** (with cascade cleanup of bookings/wallet/chat/ratings; admins protected)
- [x] **Password management** (2026-02-22):
  - Signup screen already collects password
  - Settings: user changes own password (current + new + confirm, with show/hide toggle)
  - Admin: `POST /api/admin/users/{id}/password` to reset any user's password from the user detail page
- [x] **Content moderation** (2026-02-22):
  - Customers can flag any image in Barber Works feed (Flag icon overlay + reason modal)
  - New `reports` collection + `POST /api/reports`, `GET/PATCH /api/admin/reports`
  - Admin Dashboard shows pending count badge + dedicated `/app/reports` page with filters and status actions
  - Each report links back to the barber's user-detail page (uses existing admin delete)

## Test Status
- Backend pytest: **21/21 passing** (iteration 3)
- Frontend: 100% on all tested iteration-3 flows

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
