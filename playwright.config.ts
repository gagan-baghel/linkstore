import fs from "node:fs"
import path from "node:path"
import { defineConfig } from "@playwright/test"

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return

  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue

    const separatorIndex = line.indexOf("=")
    if (separatorIndex === -1) continue

    const key = line.slice(0, separatorIndex).trim()
    if (!key || process.env[key]) continue

    let value = line.slice(separatorIndex + 1).trim()
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    process.env[key] = value
  }
}

loadEnvFile(path.join(process.cwd(), ".env.local"))

const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000"

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL,
    browserName: "chromium",
    channel: "chrome",
    headless: true,
  },
  webServer: {
    command: "npm run dev",
    url: `${baseURL}/auth/login`,
    reuseExistingServer: true,
    timeout: 180_000,
  },
})
