
- Chicken ordering, pickup codes and staff verification run through the `chicken-order` edge function (actions: create/confirm/verify/handover/expire); never validate prices or pickups on the client. Why: server-side trust for payments and handovers.
- Orders table is shared across businesses via `orders.business` ('eggs' default) and `fulfillment_type`; egg flows must ignore chicken rows' pickup fields. Why: additive, backward-compatible expansion.
- Admin-uploaded business images go to the `product-images` bucket under chicken/…, cafe/… folders and DB stores the path; render with `mediaUrl` + `SafeImage`. Why: public buckets can't be created in this workspace and placeholders must never break.
- Egg delivery slot hours are evaluated in Asia/Kolkata; a slot with orderStart === orderEnd is disabled. Why: device timezone must not affect cutoffs.
- Automated Twilio order alerts use an approved Content template, load paid-order details server-side, and accept only service or admin callers. Why: outbound WhatsApp sessions expire and client payloads must not trigger arbitrary alerts.
- Track splash completion in module memory plus sessionStorage per app launch (SplashPage renders nothing once done) and replace-navigate directly to Welcome; restore the profile community independently on Welcome. Why: startup, including WebView reloads within one launch, must not replay or wait for profile requests.
- Business image editing uses react-easy-crop before the existing upload flow, with square product and 16:9 location crops and contain-fit previews. Why: portrait photos stay visible and optional crops match customer frames.
- Chicken fixed actions share an additive safe-area spacer; pickup dates mirror the server's IST deadline for display only. Why: avoid clipped actions and misleading dates without moving validation to the client.
- Native Back from egg Home explicitly replace-navigates to Welcome. Why: Home is a business entry screen, not the app exit screen.
