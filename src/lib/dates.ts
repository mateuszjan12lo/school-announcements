export const TZ = "Europe/Warsaw";
export const nowMs = () => Date.now();

const parts = (ts: number) => {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" }).formatToParts(new Date(ts));
  const g = (k: string) => Number(p.find((x) => x.type === k)!.value);
  return { Y: g("year"), M: g("month"), D: g("day"), h: g("hour"), m: g("minute") };
};
const wallAsUtc = (ts: number) => { const { Y, M, D, h, m } = parts(ts); return Date.UTC(Y, M - 1, D, h, m); };

/** "2026-11-05T14:30" (czas ścienny w Polsce, z <input type=datetime-local>) → znacznik UTC. */
export function parseLocal(s: string): number {
  const [d, t = "00:00"] = s.split("T"); const [Y, M, D] = d.split("-").map(Number); const [h, m] = t.split(":").map(Number);
  const guess = Date.UTC(Y, M - 1, D, h, m);
  const t1 = guess - (wallAsUtc(guess) - guess);   // pierwsze przybliżenie (offset w punkcie guess)
  return guess - (wallAsUtc(t1) - t1);             // poprawka na granicy zmiany czasu
}
/** Znacznik UTC → wartość dla <input type=datetime-local> w czasie polskim. */
export function toInputValue(ts: number | null): string {
  if (ts === null) return ""; const { Y, M, D, h, m } = parts(ts); const z = (n: number) => String(n).padStart(2, "0");
  return `${Y}-${z(M)}-${z(D)}T${z(h)}:${z(m)}`;
}

const dayNo = (ts: number) => { const { Y, M, D } = parts(ts); return Date.UTC(Y, M - 1, D) / 86400000; };
export function relativeLabel(ts: number, now = Date.now()) {
  const d = dayNo(ts) - dayNo(now);
  if (d === 0) return "Dzisiaj";
  if (d === 1) return "Jutro";
  if (d > 1 && d <= 7) return `Za ${d} dni`;
  if (d === -1) return "Wczoraj";
  return new Date(ts).toLocaleDateString("pl-PL", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" });
}
export const exactDate = (ts: number) => new Date(ts).toLocaleString("pl-PL", { timeZone: TZ, dateStyle: "long", timeStyle: "short" });
