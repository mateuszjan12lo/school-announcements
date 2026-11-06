import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { loginAdmin } from "./helpers";

const serious = async (page: import("@playwright/test").Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations
  .filter((v) => ["serious", "critical"].includes(v.impact ?? "")).map((v) => `${v.id}: ${v.nodes[0]?.html.slice(0, 120)}`);
const noHScroll = (page: import("@playwright/test").Page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

test("feed: bez poziomego przewijania, przyciski ≥ 44 px", async ({ page }, info) => {
  await page.goto("/"); expect(await noHScroll(page), info.project.name).toBe(true);
  for (const l of await page.getByRole("link", { name: /Dodaj do kalendarza|Klasa|Wszystkie/ }).all()) expect((await l.boundingBox())!.height).toBeGreaterThanOrEqual(44);
});
test("panel: bez poziomego przewijania, przyciski ≥ 44 px", async ({ page }, info) => {
  await loginAdmin(page); expect(await noHScroll(page), info.project.name).toBe(true);
  for (const b of await page.locator("main button, header button").all()) expect((await b.boundingBox())!.height, await b.innerText()).toBeGreaterThanOrEqual(44);
});
for (const path of ["/", "/?klasa=c7a", "/admin/logowanie"]) test(`axe (gość) ${path}`, async ({ page }) => { await page.goto(path); expect(await serious(page)).toEqual([]); });
for (const path of ["/admin", "/admin/nowe", "edycja"]) test(`axe (admin) ${path}`, async ({ page }) => { await loginAdmin(page); if (path === "edycja") await page.getByRole("link", { name: "Edytuj" }).first().click(); else await page.goto(path); expect(await serious(page)).toEqual([]); });
