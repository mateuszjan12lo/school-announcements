import Link from "next/link";
import { AnnouncementCard } from "@/components/AnnouncementCard";
import { listClasses, listPublic } from "@/lib/data";
import { nowMs } from "@/lib/dates";
import { SiteHeader } from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

export default async function Feed({ searchParams }: { searchParams: Promise<{ klasa?: string; strona?: string }> }) {
  const sp = await searchParams; const now = nowMs();
  const classes = await listClasses(); const active = classes.some((c) => c.id === sp.klasa) ? sp.klasa! : "";
  const page = Math.max(0, Math.min(500, Number.parseInt(sp.strona ?? "0", 10) || 0));
  const { items, hasNext } = await listPublic(page, active || undefined);
  const label = (id: string | null) => (id === null ? "Cała szkoła" : classes.find((c) => c.id === id)?.name ?? "—");
  const href = (p: number) => `/?${new URLSearchParams({ ...(active ? { klasa: active } : {}), ...(p ? { strona: String(p) } : {}) })}`;
  return (
    <>
      <SiteHeader />
      <main id="main" className="max-w-3xl mx-auto p-4 pb-10">
        <h1 className="text-3xl font-bold">Ogłoszenia</h1>
        <nav aria-label="Filtr klasy" className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <Link href="/" className="chip" aria-current={active === ""}>Wszystkie</Link>
          {classes.map((c) => <Link key={c.id} href={`/?klasa=${c.id}`} className="chip" aria-current={active === c.id}>{c.name}</Link>)}
        </nav>
        <section aria-label="Lista ogłoszeń" className="mt-4 grid gap-3">
          {items.length ? items.map((a) => <AnnouncementCard key={a.id} a={a} now={now} classLabel={label(a.classId)} />) : <p className="card p-6 text-muted">Brak aktualnych ogłoszeń. Nowe pojawią się właśnie tutaj.</p>}
        </section>
        {(page > 0 || hasNext) && (
          <nav aria-label="Strony" className="mt-4 flex justify-between">
            {page > 0 ? <Link className="btn" href={href(page - 1)}>← Nowsze</Link> : <span />}
            {hasNext && <Link className="btn" href={href(page + 1)}>Starsze →</Link>}
          </nav>)}
        <p className="mt-8 text-center"><Link href="/instalacja" className="underline min-h-11 inline-flex items-center">📲 Zainstaluj aplikację na telefonie</Link></p>
      </main>
    </>
  );
}
