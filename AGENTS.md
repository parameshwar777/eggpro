
- Chicken ordering, pickup codes and staff verification run through the `chicken-order` edge function (actions: create/confirm/verify/handover/expire); never validate prices or pickups on the client. Why: server-side trust for payments and handovers.
- Orders table is shared across businesses via `orders.business` ('eggs' default) and `fulfillment_type`; egg flows must ignore chicken rows' pickup fields. Why: additive, backward-compatible expansion.
- Admin-uploaded business images go to the `product-images` bucket under chicken/…, cafe/… folders and DB stores the path; render with `mediaUrl` + `SafeImage`. Why: public buckets can't be created in this workspace and placeholders must never break.
- Egg delivery slot hours are evaluated in Asia/Kolkata; a slot with orderStart === orderEnd is disabled. Why: device timezone must not affect cutoffs.
- Automated Twilio order alerts use an approved Content template, load paid-order details server-side, and accept only service or admin callers. Why: outbound WhatsApp sessions expire and client payloads must not trigger arbitrary alerts.
- Track splash completion in module memory per app launch and replace-navigate directly to Welcome; restore the profile community independently on Welcome. Why: startup must not replay or wait for profile requests.
