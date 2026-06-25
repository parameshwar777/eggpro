
## Goal

Make WhatsApp OTP usage minimal (it's expensive) and bullet-proof the login/signup flows end to end.

## Rules to enforce

- WhatsApp OTP is used **only** for: (a) phone signup verification, (b) phone login when user has no password yet (legacy).
- Once a phone user has a password, phone login = phone + password. **No OTP**.
- Password reset = **email link only** (Resend). Never via WhatsApp.
- Every user must have a real email on file. Phone users must add email + password after first OTP verify.
- A phone number can belong to only one account. An email can belong to only one account.

---

## 1. Signup flow (Phone via WhatsApp)

Steps on `AuthPage` when channel = WhatsApp + mode = signup:

1. User enters 10-digit phone → "Continue".
2. Edge function `check-identity` runs first:
   - If phone already linked to an account that signed up via **email** → show:
     > "This number is already linked to an email account (j***@gmail.com). Please log in with email, or contact support to switch."
     Block. Do NOT send OTP.
   - If phone already linked to a phone account → "Phone already registered. Please log in."
   - Else → call `whatsapp-otp` send.
3. User enters OTP → verify.
4. **Profile completion screen** (new step `complete-profile`): required fields
   - Full Name (required)
   - Email (required, validated, uniqueness checked via `check-identity`)
   - Password (required, min 8 chars) + Confirm
   - Referral code (optional)
5. On submit: create auth user with `email + password`, set `phone` + `full_name` in `profiles`, mark `phone_verified = true`.

Result: user can log in later with **either** email+password **or** phone+password, no further OTPs needed.

## 2. Login flow

### Email tab (unchanged)
Email + password → standard `signInWithPassword`.

### WhatsApp/Phone tab → relabel to **"Phone"**
- Phone + password (default).
- "Forgot password?" link → asks for email → sends Resend reset link.
- Tiny secondary link "First time? Sign up" → routes to signup OTP flow.
- **No OTP on login** unless the user has no password set (legacy users); in that case fall back to OTP then force password creation immediately after.

Internally: phone login resolves phone → email (`profiles.phone → auth.users.email`) via edge function `phone-to-email`, then signInWithPassword.

## 3. Forgot password

- Always email-based via existing Resend flow.
- On phone tab "Forgot password?" → modal asks for the email registered on the account → `resetPasswordForEmail` → `/reset-password` page (already exists).
- Never send OTP for reset.

## 4. Duplicate / conflict scenarios

`check-identity` edge function returns one of:
- `phone_free_email_free` → proceed
- `phone_taken_by_email_user` → block with explanatory message + "Login with email" CTA
- `phone_taken_by_phone_user` → "Already registered, log in"
- `email_taken` (during profile completion) → "Email already used, pick another or log in"

No automatic account deletion. (The user mentioned "delete and create new" — that's risky because it would erase orders/wallet. We'll instead **guide** the user to existing account; deletion only via support.)

## 5. Profile gating

After login, if `profiles.email IS NULL` OR `profiles.full_name IS NULL` → force-redirect to `/complete-profile` before allowing checkout/orders. Applies to any legacy phone-only accounts.

## 6. Edge functions

- New: `check-identity` — input `{ phone?, email? }`, returns conflict status. Uses service role to query `auth.users` + `profiles`. No PII leaked beyond masked email.
- New: `phone-to-email` — input `{ phone }`, returns `{ email }` for password sign-in. Rate limited.
- Existing `whatsapp-otp` — restrict `purpose` to `signup` or `legacy_login` only.

## 7. DB

- `profiles`: ensure `email TEXT`, `phone_verified BOOLEAN DEFAULT false`, `email_verified BOOLEAN DEFAULT false`.
- Unique index on `profiles.phone` (where not null).
- Trigger `handle_new_user` already copies email/phone; extend to also set `email` from `auth.users.email`.

## 8. Test matrix (must pass before ship)

| # | Scenario | Expected |
|---|---|---|
| 1 | New user, email signup | Works, profile has email + name |
| 2 | New user, phone signup → OTP → completes profile w/ email+pw | Works |
| 3 | Same user tries email login | Works |
| 4 | Same user tries phone login w/ password | Works (no OTP) |
| 5 | Email-signup user tries phone signup with same number | Blocked: "linked to email account" |
| 6 | Phone-signup user tries email signup with same email | Blocked: "email already used" |
| 7 | Forgot password from phone tab | Email link sent, OTP NOT sent |
| 8 | Legacy phone user (no password) logs in | OTP sent once, then forced to set password + email |
| 9 | Invalid phone (<10 digits) | Validation blocks before OTP call |
| 10 | Spam: same phone request OTP repeatedly | Rate-limited (60s resend timer already present + server-side per-phone 5/hour cap) |
| 11 | OTP entered wrong 5×  | Code invalidated, must request new |
| 12 | Checkout while `profiles.email IS NULL` | Redirect to `/complete-profile` |
| 13 | Reset password flow end-to-end | Works for both email and phone users |

## 9. UI changes

- `AuthPage.tsx`: rename "WhatsApp" tab to "Phone", restructure to (Login | Signup) toggle, add profile-completion step after OTP verify, add "Forgot password?" with email prompt on Phone tab, remove OTP from phone-login path when password exists.
- New `CompleteProfilePage.tsx` reused both during signup and as a gate for legacy users.
- Add masked-email helper for conflict messages.

## 10. Cost guardrails

- WhatsApp OTP send is wrapped server-side with:
  - Per-phone: max 5 sends/hour, 20/day
  - Per-IP: max 10/hour
  - Hard block if `check-identity` says phone is taken by email user (never sends).

---

If you approve, I'll implement in this order: DB migration → `check-identity` + `phone-to-email` edge functions → AuthPage rework → CompleteProfile page + gate → manual run-through of the 13 test cases.
