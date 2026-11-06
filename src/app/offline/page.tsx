import Link from "next/link";

export default function Offline() {
  return (
    <main id="main" className="min-h-screen grid place-items-center p-6 text-center">
      <div><div className="text-5xl" aria-hidden>📡</div><h1 className="text-2xl font-bold mt-3">Brak połączenia z internetem</h1>
        <p className="text-muted mt-2 max-w-sm">SchoolPulse potrzebuje połączenia, aby wyświetlić ogłoszenia. Ze względów prywatności nie zapisujemy ich na tym urządzeniu. Połącz się z siecią i spróbuj ponownie.</p>
        <Link href="/" prefetch={false} className="btn btn-primary mt-4">Spróbuj ponownie</Link></div>
    </main>
  );
}
