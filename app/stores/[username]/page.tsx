// Alias of the canonical /[username] storefront route.
// generateMetadata sets the canonical URL to /[username], so search engines
// index a single storefront URL.
export { default, generateMetadata } from "@/app/[username]/page"

export const dynamic = "force-dynamic"
