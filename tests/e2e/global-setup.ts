import { chromium, type FullConfig } from "@playwright/test";

/** Rozgrzewka serwera deweloperskiego: kompiluje wszystkie trasy przed testami, aby przeładowania HMR nie przerywały pierwszych kliknięć. */
export default async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch(); const page = await browser.newPage({ baseURL: config.projects[0].use.baseURL });
  await page.goto("/"); await page.goto("/offline"); await page.goto("/admin/logowanie");
  await page.getByLabel("Adres e-mail").fill("admin@example.test"); await page.getByLabel("Hasło").fill("Admin123!");
  await page.getByRole("button", { name: "Zaloguj się" }).click(); await page.waitForURL(/\/admin$/);
  await page.goto("/admin/nowe"); await page.getByRole("link", { name: "← Wróć do panelu" }).click(); await page.getByRole("link", { name: "Edytuj" }).first().click(); await page.waitForURL(/\/admin\/[0-9a-f-]{36}$/);
  await page.goto("/admin"); await page.getByRole("button", { name: /Wyloguj/ }).click(); await page.waitForURL(/logowanie/);
  await browser.close();
}
