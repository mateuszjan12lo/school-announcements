import { describe, expect, it } from "vitest";
import { buildIcs, isExpired } from "@/lib/announcements";
import { announcementSchema } from "@/lib/validation";
import { parseLocal, relativeLabel, toInputValue } from "@/lib/dates";
import type { Announcement } from "@/lib/types";

const ann = (o: Partial<Announcement> = {}): Announcement => ({ id: "11111111-1111-4111-8111-111111111111", title: "Projekt z matematyki", body: "Oddajcie projekt.", classId: null, pinned: false, deadlineAt: Date.UTC(2030, 4, 2, 10, 0), expiresAt: null, createdAt: 0, ...o });

describe("wygasanie", () => {
  it("wygasa dokładnie o czasie wygaśnięcia; null = nigdy", () => {
    const a = ann({ expiresAt: 1000 }); expect(isExpired(a, 999)).toBe(false); expect(isExpired(a, 1000)).toBe(true); expect(isExpired(ann(), 9e15)).toBe(false);
  });
});

describe("kalendarz (.ics)", () => {
  it("zawiera termin, tytuł, klasę i przypomnienie", () => {
    const ics = buildIcs(ann(), "Klasa 7A", 0);
    expect(ics).toContain("BEGIN:VEVENT"); expect(ics).toContain("SUMMARY:Projekt z matematyki"); expect(ics).toContain("Klasa 7A"); expect(ics).toContain("TRIGGER:-P1D");
    expect(ics).toContain("DTSTART:20300502T100000Z"); expect(ics).toContain("DTEND:20300502T103000Z"); expect(ics.endsWith("\r\n")).toBe(true);
  });
  it("escapuje znaki specjalne (brak wstrzykiwania pól ICS)", () => {
    const ics = buildIcs(ann({ title: "A, B; C\\D\nEND:VEVENT", body: "linia1\nlinia2" }), "X", 0);
    expect(ics).toContain("SUMMARY:A\\, B\; C\\\\D\\nEND:VEVENT"); expect(ics.split("\r\n").filter((l) => l === "END:VEVENT")).toHaveLength(1); // wstrzyknięty tekst nie tworzy nowej linii
  });
});

describe("walidacja", () => {
  const base = { title: "Tytuł ogłoszenia", body: "x", classId: "" };
  it("pusta klasa = cała szkoła", () => { const r = announcementSchema.parse(base); expect(r.classId).toBeNull(); expect(r.pinned).toBe(false); });
  it("krótki tytuł → komunikat po polsku", () => { const r = announcementSchema.safeParse({ ...base, title: "x" }); expect(r.success).toBe(false); expect(r.error?.issues[0].message).toMatch(/za krótki/); });
  it("za długa treść", () => { expect(announcementSchema.safeParse({ ...base, body: "a".repeat(2001) }).success).toBe(false); });
  it("wygaśnięcie nie może być przed terminem", () => {
    expect(announcementSchema.safeParse({ ...base, deadlineAt: "2030-05-02T10:00", expiresAt: "2030-05-01T10:00" }).success).toBe(false);
    expect(announcementSchema.safeParse({ ...base, deadlineAt: "2030-05-02T10:00", expiresAt: "2030-05-02T10:00" }).success).toBe(true);
  });
  it("checkbox przypięcia", () => { expect(announcementSchema.parse({ ...base, pinned: "on" }).pinned).toBe(true); });
});

describe("czas polski", () => {
  it("parseLocal ↔ toInputValue (zima, lato, zmiana czasu)", () => {
    for (const s of ["2026-01-15T09:30", "2026-07-15T09:30", "2026-03-29T12:00", "2026-10-25T12:00", "2026-12-31T23:59"]) expect(toInputValue(parseLocal(s))).toBe(s);
  });
  it("lato = UTC+2, zima = UTC+1", () => {
    expect(new Date(parseLocal("2026-07-15T12:00")).toISOString()).toBe("2026-07-15T10:00:00.000Z");
    expect(new Date(parseLocal("2026-01-15T12:00")).toISOString()).toBe("2026-01-15T11:00:00.000Z");
  });
  it("etykiety względne", () => {
    const now = parseLocal("2026-11-05T10:00");
    expect(relativeLabel(parseLocal("2026-11-05T23:00"), now)).toBe("Dzisiaj"); expect(relativeLabel(parseLocal("2026-11-06T00:30"), now)).toBe("Jutro");
    expect(relativeLabel(parseLocal("2026-11-08T08:00"), now)).toBe("Za 3 dni");
  });
});
