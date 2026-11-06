import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { AnnouncementForm } from "@/components/Forms";
import { getOne, listClasses } from "@/lib/data";
import { toInputValue } from "@/lib/dates";

export const dynamic = "force-dynamic";
export default async function Edit({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin(); const { id } = await params; const a = await getOne(id, true); if (!a) notFound();
  return (<main id="main" className="max-w-2xl mx-auto p-4 pb-10"><p><Link href="/admin" className="underline min-h-11 inline-flex items-center">← Wróć do panelu</Link></p>
    <h1 className="text-3xl font-bold mb-4">Edytuj ogłoszenie</h1>
    <AnnouncementForm id={a.id} classes={await listClasses()} v={{ title: a.title, body: a.body, classId: a.classId, pinned: a.pinned, deadline: toInputValue(a.deadlineAt), expires: toInputValue(a.expiresAt) }} /></main>);
}
