import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { AnnouncementCard } from "@/components/AnnouncementCard";
import { ClassForm } from "@/components/Forms";
import { ConfirmButton } from "@/components/ConfirmButton";
import { isExpired } from "@/lib/announcements";
import { listAll, listClasses, usedClassIds } from "@/lib/data";
import { nowMs } from "@/lib/dates";
import { deleteAnnouncement, deleteClass, logoutAction, togglePin } from "@/app/actions";

export const dynamic = "force-dynamic";
export default async function Panel() {
  const admin = await requireAdmin(); const now = nowMs();
  const [list, classes, used] = await Promise.all([listAll(), listClasses(), usedClassIds()]);
  const label = (id: string | null) => (id === null ? "Cała szkoła" : classes.find((c) => c.id === id)?.name ?? "—");
  return (
    <>
      <header className="bg-card border-b border-line"><div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <p className="font-bold">Panel administratora</p>
        <div className="flex items-center gap-2"><Link href="/" className="underline min-h-11 inline-flex items-center">Zobacz ogłoszenia</Link>
          <form action={logoutAction}><button className="btn" aria-label={`Wyloguj (${admin.email})`}>Wyloguj</button></form></div>
      </div></header>
      <main id="main" className="max-w-3xl mx-auto p-4 pb-10">
        <div className="flex items-center justify-between gap-2"><h1 className="text-3xl font-bold">Ogłoszenia</h1><Link href="/admin/nowe" className="btn btn-primary">Dodaj ogłoszenie</Link></div>
        <ul className="mt-4 grid gap-4">
          {list.length === 0 && <li className="card p-6 text-muted">Nie ma jeszcze żadnych ogłoszeń. Dodaj pierwsze!</li>}
          {list.map((a) => (
            <li key={a.id}>
              <AnnouncementCard a={a} now={now} classLabel={label(a.classId)} expired={isExpired(a, now)} />
              <div className="flex flex-wrap gap-2 mt-2">
                <Link href={`/admin/${a.id}`} className="btn">Edytuj</Link>
                <form action={togglePin.bind(null, a.id, a.pinned)}><button className="btn">{a.pinned ? "Odepnij" : "Przypnij"}</button></form>
                <ConfirmButton action={deleteAnnouncement.bind(null, a.id)} label="Usuń" message={`Czy na pewno usunąć ogłoszenie „${a.title}”? Tej operacji nie można cofnąć.`} danger />
              </div>
            </li>))}
        </ul>
        <section className="mt-10" aria-labelledby="kl"><h2 id="kl" className="text-xl font-bold">Klasy</h2>
          <ul className="mt-2 flex flex-wrap gap-2">{classes.map((c) => (
            <li key={c.id} className="card px-3 py-1 flex items-center gap-2">{c.name}{!used.has(c.id) && <ConfirmButton action={deleteClass.bind(null, c.id)} label="✕" message={`Usunąć klasę „${c.name}”?`} danger />}</li>))}</ul>
          <div className="mt-3"><ClassForm /></div></section>
      </main>
    </>
  );
}
