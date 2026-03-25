/** @type {import('next').NextConfig} */
const baseSecurityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
]

const securityHeaders =
  process.env.NODE_ENV === "production"
    ? [...baseSecurityHeaders, { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : baseSecurityHeaders

const nextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    ppr: false,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
