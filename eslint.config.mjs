import nextCoreWebVitals from "eslint-config-next/core-web-vitals"

const config = [
  ...nextCoreWebVitals,
  {
    ignores: ["convex/_generated/**"],
  },
  {
    rules: {
      "react/no-unescaped-entities": "off",
    },
  },
]

export default config
