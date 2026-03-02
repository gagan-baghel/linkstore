# Release Checklist

## 1. Configuration
- Set required env vars in production:
  - `CONVEX_URL` (or `NEXT_PUBLIC_CONVEX_URL` for dev fallback)
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
  - `RAZORPAY_WEBHOOK_SECRET`
  - `PAYMENTS_DATA_KEY`
- Optional:
  - `CLOUDINARY_*` for uploads
  - `SUPPORT_EMAIL` for contact page

## 2. Readiness Probe
- Call `GET /api/health`.
- Verify response:
  - `ok: true`
  - no required failures.
- In production, ensure `NEXT_PUBLIC_APP_URL` is explicitly set.

## 3. Authentication Smoke Tests
- Sign up with email/password from `/auth/register`.
- Complete email verification code flow.
- Sign in with email/password from `/auth/login`.
- Sign in with Google from `/auth/login`.
- Verify sign out from dashboard menu and side nav.

## 4. Billing Smoke Tests (Razorpay)
- Create checkout order (`/api/subscription/checkout`).
- Complete payment and verify activation (`/api/subscription/verify`).
- Confirm webhook is received (`/api/subscription/webhook`).
- Validate downgrade/expired behavior when subscription is inactive.
- Confirm admin override flow works for support use.

## 5. Product and Store Smoke Tests
- Create, edit, duplicate, archive product.
- Update store settings and theme.
- Verify public storefront loads on desktop and mobile.

## 6. Trust and Compliance
- Confirm legal pages are reachable:
  - `/privacy`
  - `/terms`
  - `/refunds`
  - `/contact`

## 7. Build/Quality Gates
- `npm run lint`
- `npm run build`
- Resolve any blocker before deploy.

## 8. Edge-Case QA
- Wrong password returns safe error (no sensitive leakage).
- Repeated login attempts are rate-limited (429) and recover after window.
- Signup verification:
  - invalid OTP
  - expired OTP
  - resend OTP flow
- Google OAuth:
  - first-time user
  - existing user re-login
  - canceled OAuth consent
- Billing:
  - duplicate verify call (idempotency behavior)
  - webhook retry delivery
  - payment captured but verify delayed
  - refunded payment does not grant active access
