import { expect, type Page } from "@playwright/test";
export const ADMIN = ["admin@example.test", "Admin123!"] as const;
export async function loginAdmin(page: Page) {
  await page.goto("/admin/logowanie");
  await page.getByLabel("Adres e-mail").fill(ADMIN[0]); await page.getByLabel("Hasło").fill(ADMIN[1]);
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await expect(page).toHaveURL(/\/admin$/); await expect(page.getByRole("heading", { name: "Ogłoszenia" })).toBeVisible();
}
/** Wartość dla datetime-local: teraz + minuty (czas polski). */
export function inMinutes(min: number) {
  const d = new Date(Date.now() + min * 60_000);
  const p = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(d);
  return p.replace(" ", "T");
}
