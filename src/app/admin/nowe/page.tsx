import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { AnnouncementForm } from "@/components/Forms";
import { listClasses } from "@/lib/data";

export const dynamic = "force-dynamic";
export default async function New() {
  await requireAdmin();
  return (<main id="main" className="max-w-2xl mx-auto p-4 pb-10"><p><Link href="/admin" className="underline min-h-11 inline-flex items-center">← Wróć do panelu</Link></p>
    <h1 className="text-3xl font-bold mb-4">Dodaj ogłoszenie</h1>
    <AnnouncementForm id={null} classes={await listClasses()} v={{ title: "", body: "", classId: null, pinned: false, deadline: "", expires: "" }} /></main>);
}
