# Release Checklist

## 1. Configuration
- Set required env vars in production:
  - `CONVEX_URL`
  - `AUTH_JWT_SECRET`
  - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
  - `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
  - `RAZORPAY_WEBHOOK_SECRET`
  - `PAYMENTS_DATA_KEY`
- In Google Cloud Console, register the callback URL:
  - `https://your-domain.com/api/auth/google/callback`
- Optional:
  - `CLOUDINARY_*` for uploads
  - `SUPPORT_EMAIL` for contact page
  - If using the env-managed launch coupon: `SUBSCRIPTION_FREE_MONTH_COUPON_MAX_REDEMPTIONS` and `SUBSCRIPTION_FREE_MONTH_COUPON_EXPIRES_AT`
  - Optional but recommended for coupons: `COUPON_HASH_SECRET` (otherwise coupon hashing reuses `AUTH_JWT_SECRET`)

## 2. Readiness Probe
- Call `GET /api/health`.
- Verify response:
  - `ok: true`
  - no required failures.
- In production, ensure `NEXT_PUBLIC_APP_URL` is explicitly set.
- If the env-managed coupon is enabled, ensure `/api/health` reports no coupon-related required failures.

## 3. Authentication Smoke Tests
- Start Google sign-in from `/auth/login`.
- Verify first-time Google sign-in creates an account from `/auth/register`.
- Verify sign out from dashboard menu and side nav.

## 4. Billing Smoke Tests (Razorpay)
- Create checkout order (`/api/subscription/checkout`).
- Complete payment and verify activation (`/api/subscription/verify`).
- Confirm webhook is received (`/api/subscription/webhook`).
- Validate downgrade/expired behavior when subscription is inactive.
- Confirm admin override flow works for support use.

## 5. Product and Store Smoke Tests
- Create, edit, duplicate, archive product.
- Update store settings and public storefront details.
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
- `npm run test`
- Resolve any blocker before deploy.

## 8. Edge-Case QA
- Repeated Google auth starts/callback retries are rate-limited (429) and recover after window.
- Coupon redemption:
  - active subscribers cannot stack an additional coupon
  - env coupon rejects if expiry or redemption cap is missing
- Session revocation:
  - older session becomes invalid after revoke
  - current session remains valid after revoke
- Billing:
  - duplicate verify call (idempotency behavior)
  - webhook retry delivery
  - payment captured but verify delayed
  - refunded payment does not grant active access
