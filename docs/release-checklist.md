# Release Checklist

## 1. Configuration
- Set required env vars in production:
  - `CONVEX_URL`
  - `AUTH_JWT_SECRET`
  - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
  - `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
  - `RAZORPAY_WEBHOOK_SECRET`
  - `SERVER_SHARED_SECRET` — required in TWO places with the same value:
    the Next.js server env AND the Convex deployment
    (`npx convex env set SERVER_SHARED_SECRET <value>`). All Convex functions
    fail closed without it. Set it on the deployment BEFORE `convex deploy`
    (crons bake the value at push time), and remove any
    `DISABLE_CONVEX_GUARD` flag once both sides carry the secret.
- In Google Cloud Console, register the callback URL:
  - `https://your-domain.com/api/auth/google/callback`
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
- Session revocation:
  - older session becomes invalid after revoke
  - current session remains valid after revoke
- Billing:
  - duplicate verify call (idempotency behavior)
  - webhook retry delivery
  - payment captured but verify delayed
  - refunded payment does not grant active access
