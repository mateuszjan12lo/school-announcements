import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/Forms";
import { currentAdmin } from "@/lib/session";
import { isProduction } from "@/lib/safety";

export const dynamic = "force-dynamic";
export default async function AdminLogin() {
  if (await currentAdmin()) redirect("/admin");
  return (
    <main id="main" className="min-h-screen grid place-items-center p-4">
      <div className="w-full max-w-sm grid gap-4">
        <h1 className="text-3xl font-bold">Panel administratora</h1>
        <p className="text-muted">Dostęp tylko dla administratora szkoły.</p>
        <LoginForm />
        {!isProduction() && <p className="text-sm card p-3" data-testid="dev-banner"><strong>Środowisko deweloperskie.</strong> Konto testowe: DEMO_ACCOUNTS.md. W produkcji nie istnieje.</p>}
        <Link href="/" className="underline min-h-11 inline-flex items-center">← Wróć do ogłoszeń</Link>
      </div>
    </main>
  );
}
