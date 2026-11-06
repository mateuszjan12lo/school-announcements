import { exactDate, relativeLabel } from "@/lib/dates";
import type { Announcement } from "@/lib/types";

export function AnnouncementCard({ a, now, classLabel, expired }: { a: Announcement; now: number; classLabel: string; expired?: boolean }) {
  const overdue = a.deadlineAt !== null && a.deadlineAt < now;
  return (
    <article className={`card p-4 ${a.pinned ? "ring-2 ring-indigo-400" : ""} ${expired ? "bg-slate-50 dark:bg-slate-900 border-dashed" : ""}`}>
      <div className="flex flex-wrap gap-2 items-center text-xs">
        {a.pinned && <span className="badge bg-indigo-100 text-indigo-900">📌 Przypięte</span>}
        <span className="badge bg-slate-100 text-slate-800">{classLabel}</span>
        {expired && <span className="badge bg-slate-200 text-slate-900">Wygasło</span>}
      </div>
      <h2 className="text-lg font-bold mt-2">{a.title}</h2>
      {a.body && <p className="mt-1 whitespace-pre-wrap">{a.body}</p>}
      <dl className="mt-3 grid gap-1 text-sm">
        {a.deadlineAt !== null && <div><dt className="inline text-muted">{overdue ? "Termin minął: " : "Termin: "}</dt><dd className="inline"><strong>{relativeLabel(a.deadlineAt, now)}</strong> · {exactDate(a.deadlineAt)}</dd></div>}
        {a.expiresAt !== null && <div><dt className="inline text-muted">Wygasa: </dt><dd className="inline">{exactDate(a.expiresAt)}</dd></div>}
      </dl>
      {a.deadlineAt !== null && !expired && <a className="btn mt-3" href={`/ogloszenia/${a.id}/kalendarz.ics`} download>📅 Dodaj do kalendarza</a>}
    </article>
  );
}
