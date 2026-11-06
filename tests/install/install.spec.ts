import AxeBuilder from "@axe-core/playwright";
import { devices, expect, test } from "@playwright/test";
import jsQR from "jsqr";
import { PNG } from "pngjs";

// Z profili urządzeń bierzemy tylko UA/ekran/dotyk (bez wymuszania silnika WebKit); testy działają w Chromium.
const emu = ({ defaultBrowserType: _ignored, ...rest }: (typeof devices)[string]) => rest;
const IOS = emu(devices["iPhone 13"]), ANDROID = emu(devices["Pixel 5"]);
const serious = async (page: import("@playwright/test").Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations
  .filter((v) => ["serious", "critical"].includes(v.impact ?? "")).map((v) => `${v.id}: ${v.nodes[0]?.html.slice(0, 120)}`);

test.describe("strona /instalacja", () => {
  test("po polsku, z kodem QR prowadzącym do tej samej strony", async ({ page, baseURL }) => {
    await page.goto("/instalacja");
    await expect(page.locator("html")).toHaveAttribute("lang", "pl"); await expect(page.getByRole("heading", { name: "Zainstaluj SchoolPulse", level: 1 })).toBeVisible();
    const qr = page.getByRole("img", { name: /Kod QR/ }); await expect(qr).toBeVisible(); expect(await qr.locator("path").count()).toBeGreaterThan(0);
    await expect(page.getByText(`${baseURL}/instalacja`)).toBeVisible();
  });
  test("QR jest poprawnym kodem: zeskanowany (jsQR) daje adres strony instalacji", async ({ page, baseURL }) => {
    await page.goto("/instalacja");
    const png = PNG.sync.read(await page.getByRole("img", { name: /Kod QR/ }).screenshot());
    const res = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
    expect(res?.data).toBe(`${baseURL}/instalacja`);
  });
  test("pełna instrukcja na komputerze: komunikat o telefonie, brak przycisku instalacji", async ({ page }) => {
    await page.goto("/instalacja"); await expect(page.getByText(/instaluje się na telefonie/)).toBeVisible(); await expect(page.getByRole("button", { name: /Zainstaluj aplikację/ })).toHaveCount(0);
  });
  test("a11y (komputer)", async ({ page }) => { await page.goto("/instalacja"); await expect(page.getByRole("img", { name: /Kod QR/ })).toBeVisible(); expect(await serious(page)).toEqual([]); });
  test("manifest ma ikony PNG 192/512 i maskable, a pliki istnieją i mają właściwy rozmiar", async ({ request }) => {
    const m = await (await request.get("/manifest.webmanifest")).json();
    expect(m.lang).toBe("pl"); expect(m.display).toBe("standalone"); expect(m.start_url).toBe("/");
    const want: [string, string][] = [["192x192", "any"], ["512x512", "any"], ["512x512", "maskable"]];
    for (const [sizes, purpose] of want) {
      const icon = m.icons.find((i: { sizes: string; purpose: string }) => i.sizes === sizes && i.purpose === purpose); expect(icon, `${sizes} ${purpose}`).toBeTruthy();
      const r = await request.get(icon.src); expect(r.status()).toBe(200); expect(r.headers()["content-type"]).toContain("image/png");
      const b = await r.body(); expect(b.readUInt32BE(16)).toBe(Number(sizes.split("x")[0])); // szerokość z nagłówka IHDR
    }
    expect((await request.get("/apple-touch-icon.png")).status()).toBe(200);
  });
  test("strona główna ma link do instalacji", async ({ page }) => { await page.goto("/"); await expect(page.getByRole("link", { name: /Zainstaluj aplikację na telefonie/ })).toBeVisible(); });
});

test.describe("iPhone (Safari)", () => {
  test.use({ ...IOS });
  test("instrukcja krok po kroku: Udostępnij → Dodaj do ekranu początkowego; bez przycisku instalacji", async ({ page }) => {
    await page.goto("/instalacja");
    await expect(page.getByRole("heading", { name: "Instalacja na iPhonie / iPadzie" })).toBeVisible();
    for (const t of [/Safari/, /Udostępnij/, /Dodaj do ekranu początkowego/, /„Dodaj”/]) await expect(page.locator("ol").getByText(t).first()).toBeVisible();
    await expect(page.locator("ol li")).toHaveCount(4); await expect(page.getByRole("button", { name: /Zainstaluj aplikację/ })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
  test("a11y (iPhone)", async ({ page }) => { await page.goto("/instalacja"); await expect(page.locator("ol li").first()).toBeVisible(); expect(await serious(page)).toEqual([]); });
  test("uruchomiona z ekranu głównego (standalone) → komunikat „już zainstalowana”", async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, "standalone", { value: true }));
    await page.goto("/instalacja"); await expect(page.getByRole("status").getByText(/już zainstalowana/)).toBeVisible(); await expect(page.locator("ol li")).toHaveCount(0);
  });
});

test.describe("Android (Chrome)", () => {
  test.use({ ...ANDROID });
  test("bez zdarzenia instalacji: instrukcja ręczna z menu ⋮", async ({ page }) => {
    await page.goto("/instalacja"); await expect(page.getByRole("heading", { name: "Instalacja na telefonie z Androidem" })).toBeVisible();
    await expect(page.getByText(/Zainstaluj aplikację”/)).toBeVisible(); await expect(page.getByRole("button", { name: /Zainstaluj aplikację/ })).toHaveCount(0);
  });
  test("po beforeinstallprompt pojawia się przycisk „Zainstaluj aplikację”; klik wywołuje natywny prompt", async ({ page }) => {
    await page.goto("/instalacja"); await expect(page.getByRole("heading", { name: "Instalacja na telefonie z Androidem" })).toBeVisible();
    const ok = await page.evaluate(() => {
      const e = new Event("beforeinstallprompt", { cancelable: true }) as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
      e.prompt = () => { (window as unknown as { __prompted: boolean }).__prompted = true; return Promise.resolve(); }; e.userChoice = Promise.resolve({ outcome: "accepted" });
      window.dispatchEvent(e); return e.defaultPrevented; // natywny mini-pasek jest wstrzymany, własny przycisk przejmuje kontrolę
    });
    expect(ok).toBe(true);
    const btn = page.getByRole("button", { name: /Zainstaluj aplikację/ }); await expect(btn).toBeVisible(); expect((await btn.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await btn.click(); await expect(page.getByText(/Instalacja rozpoczęta/)).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { __prompted?: boolean }).__prompted)).toBe(true); await expect(btn).toHaveCount(0);
  });
  test("anulowanie instalacji pokazuje komunikat po polsku", async ({ page }) => {
    await page.goto("/instalacja"); await expect(page.getByRole("heading", { name: "Instalacja na telefonie z Androidem" })).toBeVisible();
    await page.evaluate(() => { const e = new Event("beforeinstallprompt", { cancelable: true }) as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }; e.prompt = () => Promise.resolve(); e.userChoice = Promise.resolve({ outcome: "dismissed" }); window.dispatchEvent(e); });
    await page.getByRole("button", { name: /Zainstaluj aplikację/ }).click(); await expect(page.getByText(/Instalacja anulowana/)).toBeVisible();
  });
  test("zdarzenie appinstalled → komunikat „już zainstalowana”", async ({ page }) => {
    await page.goto("/instalacja"); await expect(page.getByRole("heading", { name: "Instalacja na telefonie z Androidem" })).toBeVisible();
    await page.evaluate(() => window.dispatchEvent(new Event("appinstalled"))); await expect(page.getByText(/już zainstalowana/)).toBeVisible();
  });
  test("a11y (Android) z widocznym przyciskiem", async ({ page }) => {
    await page.goto("/instalacja"); await expect(page.getByRole("heading", { name: "Instalacja na telefonie z Androidem" })).toBeVisible();
    await page.evaluate(() => { const e = new Event("beforeinstallprompt", { cancelable: true }) as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }; e.prompt = () => Promise.resolve(); e.userChoice = Promise.resolve({ outcome: "accepted" }); window.dispatchEvent(e); });
    await expect(page.getByRole("button", { name: /Zainstaluj aplikację/ })).toBeVisible(); expect(await serious(page)).toEqual([]);
  });
});
