import Link from "next/link";

export function SiteHeader({ subtitle = "Ogłoszenia szkolne" }: { subtitle?: string }) {
  return (
    <header className="bg-brand text-brandfg print:hidden"><div className="max-w-3xl mx-auto px-4 py-4">
      <Link href="/" className="text-2xl font-bold">🎒 SchoolPulse</Link><p className="text-sm opacity-90">{subtitle}</p>
    </div></header>
  );
}
