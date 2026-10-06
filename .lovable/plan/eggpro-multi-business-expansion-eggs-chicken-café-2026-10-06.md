# EggPro Multi-Business Expansion (Eggs + Chicken + Café)

All changes are additive. Existing egg shopping, login, cart, checkout, orders, communities, payments and admin keep working exactly as today. No tables, columns, users or orders are removed.

## Phase 1 — Brand + Welcome screen
- Upload the new EggPro logo and use it on the Welcome screen, Home header, About page, Chicken/Café pages and admin header (old mascot no longer the primary logo).
- New Welcome screen after the splash/map intro with three large cards:
  - EGGPRO — "Fresh Eggs Delivered Daily" — SHOP EGGS → opens the existing egg app (community select / home as today).
  - EGGPRO CHICKEN — "Slow-Growing Broiler · Tasty • Quality • Naturally Raised" — EXPLORE CHICKEN → info page.
  - EGGPRO CAFÉ — "High-Protein Food • Fresh Ingredients" — COMING SOON.
- A small "Switch business" button in the egg Home header to return to the Welcome screen.

## Phase 2 — Chicken information page
- EGG PRO BROILER intro, "Naturally Tasty Meat", "A Better Choice for Health-Conscious Consumers" — exact supplied wording, no medical claims.
- MEAT CHARACTERISTICS table with all 16 supplied rows exactly as given, horizontal scroll, sticky first column, highlighted EGG PRO column, plus the supplied note.
- NEXT button at the bottom → Chicken products.

## Phase 3 — Chicken ordering
- Product list from the database (name, weight, price, offer price, image, availability). Branded placeholder when no image.
- Choose quantity, then DELIVERY (uses existing communities + saved addresses) or PICK UP AT CENTER (no community needed).
- Pickup: list active centers with address, instructions, image, VIEW ON GOOGLE MAPS (disabled if no link).
- Booking days, pickup day, start/end/cutoff time and refund policy are read from admin settings and shown to the customer; booking blocked on non-booking days.
- Payment via the existing Razorpay flow. Prices are recalculated on the server, not trusted from the phone.
- After payment: "YOUR CHICKEN PICKUP CODE" screen (CHKN-XXXXXX random, unique), center, order ID, deadline, COPY CODE, SHOW QR CODE.
- Chicken orders appear in the user's Orders tab with a "Chicken" tag and pickup code.

## Phase 4 — Pickup verification (staff)
- New "chicken_staff" role, each staff member optionally assigned to one center. Admins can verify at any center.
- Verification screen: enter code (or scan QR) → VERIFY PICKUP → shows result → separate CONFIRM HANDOVER.
- All checks run on the server: code exists, chicken pickup order, paid, correct center, not collected, not expired. Messages: INVALID PICKUP CODE / WRONG PICKUP CENTER (names correct center) / ORDER ALREADY COLLECTED / EXPIRED / ✓ PICKUP VERIFIED.
- Records verified_at/by, center, handed_over_at/by.

## Phase 5 — Café
- Café page: EGGPRO CAFÉ, COMING SOON, "Will open on 11 October 2026", messaging about high protein / fresh & real ingredients / great taste, and active Café locations with photo or branded placeholder. No products, prices or checkout.

## Phase 6 — Admin (mobile-friendly, existing yellow theme, existing admin login)
- New sidebar groups: Chicken → Products, Pickup Centers, Pickup Schedule, Orders, Pickup Verification; Café → Locations.
- Every image is uploaded straight from the phone gallery (JPG/PNG/WEBP, auto-compressed) — no URL typing. Replace / remove supported.
- Add / edit / enable / disable / reorder for chicken products, pickup centers and café locations. Google Maps link + latitude/longitude fields left empty for you to fill (nothing invented).
- Chicken orders list with status filter (Pending, Ready, Verified, Handed over, Expired, Cancelled) and "Mark ready".
- Admin Users: assign chicken staff role + center.
- Change history (who/when) stored for products, centers, schedule and handovers.

## Phase 7 — Egg delivery timing update
- Change the egg slot configuration (admin-editable, India time) to two slots:
  - MORNING DELIVERY: orders 9 PM – 9 AM → delivered 10 AM – 12 PM
  - EVENING DELIVERY: orders 9 AM – 7 PM → delivered before 9 PM
- Orders placed between 7 PM and 9 PM roll into the morning slot. Chicken rules never apply to eggs.

## Technical details
- New tables (with GRANTs + RLS, public read of active rows, admin write via has_role): chicken_products, chicken_pickup_centers, cafe_locations, chicken_pickup_verifications (unique pickup_code, FK to orders), admin_audit_log, staff_centers.
- Chicken pickup settings stored as one JSON row in existing admin_settings (key chicken_pickup_settings).
- Extend orders additively: business ('eggs' default), fulfillment_type, pickup_center_id. Existing rows default to eggs so nothing changes.
- Add 'chicken_staff' to app_role enum.
- Public storage bucket "business-media" with folders eggpro/logo, chicken/products, chicken/pickup-centers, cafe/locations; only admins can upload/delete.
- Edge functions: create-chicken-order (server price calc + Razorpay order), extend verify-payment to generate pickup code for chicken pickup orders, verify-chicken-pickup (verify + handover actions, role/center checks), cron expiry of overdue pickups.
- Admin WhatsApp alert reused for chicken orders, labelled "CHICKEN".

## Needs from you
- Actual 4 stall names, addresses and Google Maps links (can be entered in admin after launch).
- Chicken products and prices (entered in admin).
