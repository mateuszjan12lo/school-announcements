import { headers } from "next/headers";
import Link from "next/link";
import { InstallGuide } from "@/components/InstallGuide";
import { QrCode } from "@/components/QrCode";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = { title: "Instalacja aplikacji – SchoolPulse", description: "Zainstaluj SchoolPulse na ekranie głównym telefonu." };
export const dynamic = "force-dynamic";

/** Adres w kodzie QR: stały NEXT_PUBLIC_APP_URL (zalecany w produkcji), a bez niego adres bieżącego żądania. */
async function pageUrl() {
  const fixed = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  if (fixed && /^https?:\/\//.test(fixed)) return `${fixed}/instalacja`;
  const h = await headers(); const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (/^localhost|^127\./.test(host) ? "http" : "https");
  return `${proto}://${host}/instalacja`;
}

export default async function Install() {
  const url = await pageUrl();
  return (
    <>
      <SiteHeader subtitle="Instalacja aplikacji" />
      <main id="main" className="max-w-3xl mx-auto p-4 pb-10 grid gap-6">
        <div className="print:hidden"><h1 className="text-3xl font-bold">Zainstaluj SchoolPulse</h1>
          <p className="mt-1 text-muted">Ogłoszenia szkolne zawsze pod ręką – ikona na ekranie głównego, jak zwykła aplikacja. Nic nie trzeba pobierać ze sklepu.</p></div>
        <div className="print:hidden"><InstallGuide /></div>
        <section className="card p-6 grid justify-items-center gap-3 text-center" aria-labelledby="qr">
          <h2 id="qr" className="text-xl font-bold">Kod QR do instalacji</h2>
          <p className="text-muted">Zeskanuj aparatem telefonu – otworzy się ta strona z instrukcją instalacji. Można wydrukować (Ctrl/Cmd + P).</p>
          <QrCode text={url} label="Kod QR prowadzący do strony instalacji aplikacji SchoolPulse" />
          <p className="text-sm break-all"><span className="sr-only">Adres: </span>{url}</p>
        </section>
        <p className="print:hidden"><Link href="/" className="underline min-h-11 inline-flex items-center">← Wróć do ogłoszeń</Link></p>
      </main>
    </>
  );
}
