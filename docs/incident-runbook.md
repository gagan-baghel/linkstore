# Incident Runbook

## P0 - Login Outage
- Symptoms: users cannot sign in/sign up, frequent 401/500 responses.
- Checks:
  - `AUTH_JWT_SECRET`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` values in deployment env.
  - `GET /api/health` for auth config readiness.
  - Browser console/network for `/api/auth/google/start|callback` failures.
  - Confirm the session cookie is being set and not rejected by the browser.
- Mitigation:
  - Roll back to last known good deploy if recent auth changes caused regression.
  - Announce temporary auth disruption in status channel.

## P0 - Payment Outage
- Symptoms: checkout/verify/webhook failures, subscriptions not activating.
- Checks:
  - `GET /api/health` for Razorpay + `AUTH_JWT_SECRET` readiness.
  - Razorpay dashboard event delivery + webhook signature errors.
  - API logs for `/api/subscription/checkout|verify|webhook`.
- Mitigation:
  - Pause new purchases in UI if checkout fails persistently.
  - Reprocess missed payment confirmations from Razorpay events.

## P1 - Storefront/API Degradation
- Symptoms: slow loads, intermittent 5xx, product/store edits failing.
- Checks:
  - Convex deployment health.
  - Recent deployment changes in API routes.
  - Rate-limit responses (`429`) and origin-blocked responses (`403`).
- Mitigation:
  - Scale down noisy traffic source.
  - Temporarily relax non-critical limits if safe.
  - Roll back if regression introduced in latest release.

## Post-Incident
- Capture timeline, root cause, blast radius, and remediation.
- Add regression test or checklist item to prevent recurrence.
