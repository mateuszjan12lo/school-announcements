import type { Announcement } from "./types";

export const isExpired = (a: Announcement, now = Date.now()) => a.expiresAt !== null && a.expiresAt <= now;

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const stamp = (t: number) => new Date(t).toISOString().replace(/[-:]|\.\d{3}/g, "");
/** Plik .ics z terminem ogłoszenia (30 min) i przypomnieniem 1 dzień wcześniej. */
export function buildIcs(a: Announcement, className: string, now = Date.now()): string {
  const start = a.deadlineAt!;
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SchoolPulse//PL", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:${a.id}@schoolpulse`, `DTSTAMP:${stamp(now)}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(start + 30 * 60_000)}`,
    `SUMMARY:${esc(a.title)}`, `DESCRIPTION:${esc(`${className}. ${a.body}`.trim())}`,
    "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(a.title)}`, "TRIGGER:-P1D", "END:VALARM", "END:VEVENT", "END:VCALENDAR", ""].join("\r\n");
}
