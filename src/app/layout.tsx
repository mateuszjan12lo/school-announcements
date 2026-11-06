import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RegisterSW } from "@/components/RegisterSW";

export const metadata: Metadata = {
  title: "SchoolPulse – ogłoszenia szkolne",
  description: "Proste ogłoszenia szkolne z terminami i dodawaniem do kalendarza.",
  manifest: "/manifest.webmanifest",
  icons: { icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }], apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "SchoolPulse", statusBarStyle: "default" },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: "#4f46e5", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:p-3 focus:bg-card">Przejdź do treści</a>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
