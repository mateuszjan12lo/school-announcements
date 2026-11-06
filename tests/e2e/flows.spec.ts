import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { inMinutes, loginAdmin } from "./helpers";
import { idByTitle } from "./db";

test.describe("ogłoszenia publiczne", () => {
  test("pierwszy ekran: polskie ogłoszenia bez logowania; przypięte na górze; wygasłe ukryte", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "pl"); await expect(page.getByRole("heading", { name: "Ogłoszenia", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2 }).first()).toHaveText("Wywiadówka – spotkanie z rodzicami"); // przypięte
    await expect(page.getByText("📌 Przypięte")).toBeVisible();
    await expect(page.getByText("Kiermasz ciast")).toHaveCount(0); // wygasłe
    expect(await page.locator("a[href*='/admin']").count()).toBe(0); // brak odnośnika do panelu
  });
  test("karta pokazuje klasę, termin i datę wygaśnięcia", async ({ page }) => {
    await page.goto("/"); const card = page.locator("article", { hasText: "Projekt z matematyki" });
    await expect(card.getByText("Klasa 7A")).toBeVisible(); await expect(card.getByText("Jutro")).toBeVisible(); await expect(card.getByText(/Wygasa:/)).toBeVisible();
  });
  test("filtr klasy pokazuje klasę + całą szkołę, bez innych klas", async ({ page }) => {
    await page.goto("/"); await page.getByRole("link", { name: "Klasa 7A" }).click();
    await expect(page.getByText("Projekt z matematyki")).toBeVisible(); await expect(page.getByText("Wywiadówka")).toBeVisible(); await expect(page.getByText("Wycieczka do muzeum")).toHaveCount(0);
  });
  test("„Dodaj do kalendarza” pobiera poprawny plik .ics", async ({ page }) => {
    await page.goto("/"); const card = page.locator("article", { hasText: "Projekt z matematyki" });
    const [dl] = await Promise.all([page.waitForEvent("download"), card.getByRole("link", { name: /Dodaj do kalendarza/ }).click()]);
    const txt = readFileSync((await dl.path())!, "utf8");
    expect(txt).toContain("BEGIN:VEVENT"); expect(txt).toContain("SUMMARY:Projekt z matematyki"); expect(txt).toContain("TRIGGER:-P1D"); expect(dl.suggestedFilename()).toMatch(/\.ics$/);
  });
  test("ogłoszenie bez terminu nie ma przycisku kalendarza; .ics wygasłego, bez terminu i nieistniejącego → 404", async ({ page, request }) => {
    await page.goto("/"); await expect(page.locator("article", { hasText: "Zmiana planu zajęć" }).getByRole("link", { name: /kalendarza/ })).toHaveCount(0);
    expect((await request.get(`/ogloszenia/${await idByTitle("Zmiana planu zajęć")}/kalendarz.ics`)).status()).toBe(404); // bez terminu
    expect((await request.get(`/ogloszenia/${await idByTitle("Kiermasz ciast (zakończony)")}/kalendarz.ics`)).status()).toBe(404); // wygasłe
    expect((await request.get("/ogloszenia/nie-ma/kalendarz.ics")).status()).toBe(404);
    const ok = await request.get(`/ogloszenia/${await idByTitle("Wywiadówka – spotkanie z rodzicami")}/kalendarz.ics`); expect(ok.status()).toBe(200); expect(ok.headers()["content-type"]).toContain("text/calendar");
  });
  test("health check", async ({ request }) => { expect(await (await request.get("/api/health")).json()).toEqual({ status: "ok" }); });
});

test.describe("panel administratora – bezpieczeństwo", () => {
  test("bez logowania /admin, /admin/nowe i edycja → logowanie", async ({ page }) => {
    for (const p of ["/admin", "/admin/nowe", "/admin/11111111-1111-4111-8111-111111111111"]) { await page.goto(p); await expect(page).toHaveURL(/\/admin\/logowanie/); }
  });
  test("złe hasło → komunikat, brak dostępu", async ({ page }) => {
    await page.goto("/admin/logowanie"); await page.getByLabel("Adres e-mail").fill("admin@example.test"); await page.getByLabel("Hasło").fill("zle");
    await page.getByRole("button", { name: "Zaloguj się" }).click(); await expect(page.getByText("Nieprawidłowy adres e-mail lub hasło.")).toBeVisible();
    await page.goto("/admin"); await expect(page).toHaveURL(/\/admin\/logowanie/);
  });
  test("blokada po 5 nieudanych próbach (także z poprawnym hasłem)", async ({ browser }) => {
    const p = await (await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": "203.0.113.77" } })).newPage();
    for (let i = 0; i < 5; i++) { await p.goto("/admin/logowanie"); await p.getByLabel("Adres e-mail").fill(`ofiara${i}@example.test`); await p.getByLabel("Hasło").fill("zle"); await p.getByRole("button", { name: "Zaloguj się" }).click(); await expect(p.getByText("Nieprawidłowy adres e-mail lub hasło.")).toBeVisible(); }
    await p.goto("/admin/logowanie"); await p.getByLabel("Adres e-mail").fill("admin@example.test"); await p.getByLabel("Hasło").fill("Admin123!");
    await p.getByRole("button", { name: "Zaloguj się" }).click(); await expect(p.getByText(/Zbyt wiele prób logowania/)).toBeVisible();
  });
  test("wylogowanie kończy sesję", async ({ page }) => {
    await loginAdmin(page); await page.getByRole("button", { name: /Wyloguj/ }).click(); await expect(page).toHaveURL(/\/admin\/logowanie/);
    await page.goto("/admin"); await expect(page).toHaveURL(/\/admin\/logowanie/);
  });
  test("zapis bez sesji nie działa: API Supabase z kluczem anon odrzuca INSERT", async ({ request }) => {
    const r = await request.post(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/announcements`, { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, "Content-Type": "application/json" }, data: { title: "Włamanie" } });
    expect(r.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe("panel administratora – zarządzanie", () => {
  test("dodaj → widoczne publicznie → edytuj → przypnij → usuń (z potwierdzeniem)", async ({ browser }) => {
    const title = `Test E2E ${Date.now()}`;
    const a = await (await browser.newContext()).newPage(); await loginAdmin(a); await a.getByRole("link", { name: "Dodaj ogłoszenie" }).click();
    await a.getByLabel("Tytuł").fill(title); await a.getByLabel("Treść").fill("Treść testowa"); await a.getByLabel("Której klasy dotyczy").selectOption({ label: "Klasa 6A" });
    await a.getByLabel("Termin (trafia do kalendarza)").fill(inMinutes(60 * 24 * 2)); await a.getByLabel("Wygasa (puste = nie wygasa)").fill(inMinutes(60 * 24 * 3));
    await a.getByRole("button", { name: "Dodaj ogłoszenie" }).click(); await expect(a).toHaveURL(/\/admin$/); await expect(a.getByText(title)).toBeVisible();

    const pub = await (await browser.newContext()).newPage(); await pub.goto("/"); const card = pub.locator("article", { hasText: title });
    await expect(card).toBeVisible(); await expect(card.getByText("Klasa 6A")).toBeVisible(); await expect(card.getByText("Za 2 dni")).toBeVisible();

    await a.locator("li", { hasText: title }).getByRole("link", { name: "Edytuj" }).click(); await a.getByLabel("Tytuł").fill(`${title} (zmiana)`);
    await a.getByRole("button", { name: "Zapisz zmiany" }).click(); await expect(a.getByText(`${title} (zmiana)`)).toBeVisible();
    await a.locator("li", { hasText: title }).getByRole("button", { name: "Przypnij" }).click(); await expect(a.locator("li", { hasText: title }).getByText("📌 Przypięte")).toBeVisible();
    await pub.reload(); await expect(pub.getByRole("heading", { level: 2 }).first()).toContainText(title); // przypięte → pierwsze (nowsze niż seed)

    const row = a.locator("li", { hasText: title }); a.once("dialog", (d) => d.dismiss()); await row.getByRole("button", { name: "Usuń" }).click(); await expect(a.getByText(title).first()).toBeVisible();
    a.once("dialog", (d) => d.accept()); await row.getByRole("button", { name: "Usuń" }).click(); await expect(a.getByText(title)).toHaveCount(0);
    await pub.reload(); await expect(pub.getByText(title)).toHaveCount(0);
  });
  test("walidacja: krótki tytuł, wygaśnięcie w przeszłości i przed terminem", async ({ page }) => {
    await loginAdmin(page); await page.goto("/admin/nowe");
    await page.getByLabel("Tytuł").fill("ab"); await page.getByRole("button", { name: "Dodaj ogłoszenie" }).click(); // HTML5 minlength blokuje wysłanie
    await expect(page).toHaveURL(/\/admin\/nowe/);
    await page.getByLabel("Tytuł").fill("Poprawny tytuł"); await page.getByLabel("Wygasa (puste = nie wygasa)").fill("2020-01-01T10:00"); await page.getByRole("button", { name: "Dodaj ogłoszenie" }).click();
    await expect(page.getByText("Data wygaśnięcia musi być w przyszłości.")).toBeVisible();
    await page.getByLabel("Termin (trafia do kalendarza)").fill(inMinutes(3000)); await page.getByLabel("Wygasa (puste = nie wygasa)").fill(inMinutes(1000)); await page.getByRole("button", { name: "Dodaj ogłoszenie" }).click();
    await expect(page.getByText("Ogłoszenie nie może wygasnąć przed terminem")).toBeVisible();
  });
  test("ogłoszenie wygasa: po upływie czasu znika z listy publicznej, ale zostaje w panelu", async ({ browser }) => {
    test.setTimeout(120_000);
    const title = `Krótkie ${Date.now()}`;
    const a = await (await browser.newContext()).newPage(); await loginAdmin(a); await a.goto("/admin/nowe"); await a.getByLabel("Tytuł").fill(title);
    await a.getByLabel("Wygasa (puste = nie wygasa)").fill(inMinutes(1)); await a.getByRole("button", { name: "Dodaj ogłoszenie" }).click(); await expect(a.getByText(title)).toBeVisible();
    const pub = await (await browser.newContext()).newPage(); await pub.goto("/"); await expect(pub.getByText(title)).toBeVisible();
    await pub.waitForTimeout(62_000); await pub.reload(); await expect(pub.getByText(title)).toHaveCount(0);
    await a.reload(); await expect(a.locator("li", { hasText: title }).getByText("Wygasło")).toBeVisible();
  });
  test("klasy: dodanie, użycie w ogłoszeniu, brak usuwania klasy w użyciu", async ({ page }) => {
    await loginAdmin(page); const name = `Klasa ${Date.now() % 1000}Z`;
    await page.getByLabel("Nowa klasa").fill(name); await page.getByRole("button", { name: "Dodaj klasę" }).click(); await expect(page.getByText("Zapisano pomyślnie")).toBeVisible();
    await page.goto("/admin/nowe"); await expect(page.getByLabel("Której klasy dotyczy").locator("option", { hasText: name })).toHaveCount(1);
    await page.goto("/admin"); await expect(page.getByRole("listitem").filter({ hasText: "Klasa 7A" }).getByRole("button", { name: "✕" })).toHaveCount(0); // 7A ma ogłoszenie
  });
  test("tryb offline pokazuje komunikat po polsku", async ({ page, context }) => {
    await page.goto("/"); await page.evaluate(async () => { await navigator.serviceWorker.ready; }); await page.reload();
    await context.setOffline(true); await page.goto("/").catch(() => {});
    await expect(page.getByRole("heading", { name: "Brak połączenia z internetem" })).toBeVisible(); await context.setOffline(false);
  });
});
