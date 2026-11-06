import { defineConfig, devices } from "@playwright/test";

// Testy strony instalacji PWA (/instalacja). Nie wymagają bazy: Supabase wskazuje na nieosiągalny adres, a strona go nie używa.
const PORT = 3101;
export default defineConfig({
  testDir: "tests/install", workers: 1, reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, ...devices["Desktop Chrome"], reducedMotion: "reduce" },
  webServer: { command: `npm run dev -- -p ${PORT}`, url: `http://localhost:${PORT}/api/health`, reuseExistingServer: false, timeout: 120_000,
    env: { ...(process.env as Record<string, string>), NEXT_DIST_DIR: ".next-install", NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:1", NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder", NEXT_PUBLIC_APP_URL: "" } },
});
