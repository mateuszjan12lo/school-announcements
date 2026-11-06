import { defineConfig, devices } from "@playwright/test";

// Testy bezpieczeństwa na zbudowanej wersji PRODUKCYJNEJ (wymaga wcześniejszego `npm run build`).
const PORT = 3200;
export default defineConfig({
  testDir: "tests/prod", workers: 1, reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, ...devices["Desktop Chrome"] },
  webServer: { command: `node .next/standalone/server.js`, url: `http://localhost:${PORT}/api/health`, reuseExistingServer: false, timeout: 60_000,
    env: { ...(process.env as Record<string, string>), NODE_ENV: "production", APP_ENV: "production", PORT: String(PORT), HOSTNAME: "127.0.0.1" } },
});
