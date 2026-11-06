import { describe, expect, it } from "vitest";
import { isDevEmail, isProduction, productionViolations, rejectDevLogin } from "@/lib/safety";

describe("odrzucanie kont deweloperskich w produkcji", () => {
  it("produkcja odrzuca każdy adres @example.test (także admin@example.test), niezależnie od wielkości liter i spacji", () => {
    for (const env of [{ NODE_ENV: "production" }, { APP_ENV: "production" }, { VERCEL_ENV: "production" }])
      for (const e of ["admin@example.test", " Admin@Example.TEST ", "student@example.test"]) expect(rejectDevLogin(e, env)).toBe(true);
  });
  it("poza produkcją konto deweloperskie jest dozwolone, a zwykłe konta nigdy nie są odrzucane przez tę regułę", () => {
    expect(rejectDevLogin("admin@example.test", { NODE_ENV: "development" })).toBe(false);
    expect(rejectDevLogin("dyrektor@szkola.pl", { NODE_ENV: "production" })).toBe(false);
  });
  it("Vercel Preview (NODE_ENV=production, VERCEL_ENV=preview) NIE jest produkcją, a VERCEL_ENV=production wygrywa z APP_ENV=development", () => {
    expect(isProduction({ NODE_ENV: "production", VERCEL_ENV: "preview" })).toBe(false); expect(rejectDevLogin("admin@example.test", { NODE_ENV: "production", VERCEL_ENV: "preview" })).toBe(false);
    expect(isProduction({ VERCEL_ENV: "production", APP_ENV: "development" })).toBe(true);
  });
  it("rozpoznaje produkcję", () => { expect(isProduction({ VERCEL_ENV: "production" })).toBe(true); expect(isProduction({ VERCEL_ENV: "preview" })).toBe(false); expect(isDevEmail("a@szkola.pl")).toBe(false); });
});

describe("kontrola konfiguracji produkcyjnej", () => {
  it("wykrywa wszystkie zabronione ustawienia", () => {
    const v = productionViolations({ NODE_ENV: "production", DEBUG: "true", DEV_ADMIN_EMAIL: "x", SEED_ENV: "development", NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321", ADMIN_EMAIL: "admin@example.test" });
    expect(v).toHaveLength(5);
  });
  it("wykrywa klucz service_role z prefiksem NEXT_PUBLIC_", () => { expect(productionViolations({ NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: "x" })).toHaveLength(1); });
  it("czysta produkcja przechodzi; środowisko deweloperskie jest ignorowane", () => {
    expect(productionViolations({ NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co" })).toEqual([]);
    expect(productionViolations({ NODE_ENV: "development", DEBUG: "true" })).toEqual([]);
  });
});
