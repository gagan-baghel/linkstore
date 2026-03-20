# Linkstore

> Personal storefronts for affiliate creators.

Linkstore is a Next.js + Convex application for creators who want a public product storefront instead of a plain link list. Users authenticate with Google, manage products and store settings from a dashboard, publish a public store at `/stores/[username]`, and track storefront and outbound click analytics.

## Features

- Google OAuth sign-in with signed JWT session cookies
- Product import with server-side metadata extraction and affiliate URL normalization
- Public creator storefronts with configurable branding, creator profile, and product curation
- Analytics for storefront views, product clicks, referrers, sources, and devices
- Razorpay-backed subscription billing, verification, webhooks, and admin support flows

## Tech Stack

- Frontend: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- UI: Radix UI primitives with shadcn-style components
- Backend: Next.js route handlers plus Convex functions
- Data: Convex
- Authentication: Google OAuth with signed JWT session cookies
- Billing: Razorpay
- Metadata ingestion: server-side `fetch` plus HTML/JSON-LD/Open Graph parsing, with optional Amazon Product Advertising API support

## Development

`npm` is the canonical package manager for this repo.

```bash
npm install

cp .env.example .env.local

# Configure .env.local
# CONVEX_URL=...
# AUTH_JWT_SECRET=...
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
# RAZORPAY_KEY_ID=...
# RAZORPAY_KEY_SECRET=...
# RAZORPAY_WEBHOOK_SECRET=...
# In Google Cloud Console, authorize:
# http://localhost:3000/api/auth/google/callback

npm run dev

npm run lint
npm run test
npm run build
```

## Runtime Configuration

Required in production:

- `CONVEX_URL`
- `AUTH_JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

`AUTH_JWT_SECRET` is also used to derive billing encryption and hashing keys. In local development it can fall back to an in-repo dev default. Production still requires an explicit value.

Optional:

- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` for uploads
- `SUPPORT_EMAIL` for the contact page
- `AMAZON_PAAPI_*` for Amazon product metadata enrichment

## Release Checklist

- Configure all required env vars in production (`CONVEX_URL`, `AUTH_JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, Razorpay keys + webhook secret).
- Verify runtime readiness via `GET /api/health` (should return `ok: true`).
- Test auth flows:
  - Google sign in from `/auth/login`
  - first-time account creation from `/auth/login`
  - logout/session refresh from dashboard navigation
- Test payments end-to-end in Razorpay:
  - checkout order creation
  - successful payment verification
  - webhook processing
  - failure/refund edge cases
- Validate legal/support pages:
  - `/privacy`
  - `/terms`
  - `/refunds`
  - `/contact`
- Run release checks:
- `npm run lint`
- `npm run build`
- `npm run test`
- manual smoke test on mobile + desktop
- edge-case QA from `docs/release-checklist.md` section 8

Detailed release steps: `docs/release-checklist.md`.
Incident response notes: `docs/incident-runbook.md`.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

## 📄 License
This project is licensed under the [MIT License](LICENSE).
