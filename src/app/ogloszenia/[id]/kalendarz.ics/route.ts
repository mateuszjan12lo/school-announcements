import { getOne, listClasses } from "@/lib/data";
import { buildIcs, isExpired } from "@/lib/announcements";

export const dynamic = "force-dynamic";
/** Publiczny plik .ics – tylko dla niewygasłego ogłoszenia z terminem; w innym wypadku 404 (RLS i tak ukrywa wygasłe). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const a = await getOne(id);
  if (!a || a.deadlineAt === null || isExpired(a)) return new Response("Nie znaleziono", { status: 404 });
  const name = a.classId ? (await listClasses()).find((c) => c.id === a.classId)?.name ?? "" : "Cała szkoła";
  return new Response(buildIcs(a, name), { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'attachment; filename="ogloszenie.ics"', "Cache-Control": "no-store" } });
}
