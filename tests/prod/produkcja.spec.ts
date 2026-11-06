import { expect, test } from "@playwright/test";

test("produkcja: strona publiczna działa i nie pokazuje oznak środowiska deweloperskiego", async ({ page }) => {
  await page.goto("/"); await expect(page.getByRole("heading", { name: "Ogłoszenia", level: 1 })).toBeVisible(); await expect(page.getByText(/Środowisko deweloperskie/)).toHaveCount(0);
});
// Uwaga: lokalna baza z testów MA konto deweloperskie – aplikacja produkcyjna odrzuca je mimo to (reguła w kodzie, przed zapytaniem do Supabase).
test("produkcja: konto admin@example.test jest odrzucone", async ({ page }) => {
  await page.goto("/admin/logowanie"); await expect(page.getByTestId("dev-banner")).toHaveCount(0);
  await page.getByLabel("Adres e-mail").fill("admin@example.test"); await page.getByLabel("Hasło").fill("Admin123!");
  await page.getByRole("button", { name: "Zaloguj się" }).click(); await expect(page.getByText("Nieprawidłowy adres e-mail lub hasło.")).toBeVisible();
  await page.goto("/admin"); await expect(page).toHaveURL(/\/admin\/logowanie/);
});
test("produkcja: panel wymaga logowania, brak tras debug/testowych", async ({ request }) => {
  for (const p of ["/api/debug", "/debug", "/api/seed", "/api/test", "/api/admin/ogloszenia"]) expect((await request.get(p)).status()).toBe(404);
  expect(await (await request.get("/api/health")).json()).toEqual({ status: "ok" });
});
