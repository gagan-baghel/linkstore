# Release Checklist

## 1. Configuration
- Set required env vars in production:
  - `CONVEX_URL` (or `NEXT_PUBLIC_CONVEX_URL` for dev fallback)
  - `AUTH_JWT_SECRET`
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
- Sign in with email/password from `/auth/login`.
- Verify sign out from dashboard menu and side nav.
- Change password from `/dashboard/account/security` and confirm older sessions are invalidated.

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
- Password rotation:
  - incorrect current password
  - old password rejected after update
  - current session remains valid after update
- Billing:
  - duplicate verify call (idempotency behavior)
  - webhook retry delivery
  - payment captured but verify delayed
  - refunded payment does not grant active access
