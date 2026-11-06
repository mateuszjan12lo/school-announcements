import { defineConfig, devices } from "@playwright/test";

try { process.loadEnvFile(".env.local"); } catch { /* zmienne mogą pochodzić z otoczenia */ }

const PORT = 3100;
export default defineConfig({
  testDir: "tests/e2e", globalSetup: "./tests/e2e/global-setup.ts", workers: 1, fullyParallel: false, retries: 0, reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure", reducedMotion: "reduce" },
  webServer: { command: `npm run dev -- -p ${PORT}`, url: `http://localhost:${PORT}/api/health`, reuseExistingServer: false, timeout: 120_000, env: { NEXT_DIST_DIR: ".next-e2e" } },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /responsive/ },
    { name: "mobile", use: { ...devices["Pixel 5"] }, testMatch: /responsive/ },
    { name: "tablet", use: { ...devices["Desktop Chrome"], viewport: { width: 820, height: 1180 } }, testMatch: /responsive/ },
  ],
});
