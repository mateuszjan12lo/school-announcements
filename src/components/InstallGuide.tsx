"use client";
import { useEffect, useState, useSyncExternalStore } from "react";

type Platform = "ios" | "android" | "other";
interface InstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }

function detect(): Platform {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios"; // iPadOS udaje Maca
  return /Android/i.test(ua) ? "android" : "other";
}

const noopSubscribe = () => () => {};
/** Odczyt cech przeglądarki bez setState w efekcie: po stronie serwera "", w przeglądarce np. "android|0" (platforma|czy uruchomiona jako zainstalowana). */
const deviceSnapshot = () => {
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return `${detect()}|${standalone ? 1 : 0}`;
};

const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <li className="flex gap-3"><span aria-hidden className="shrink-0 w-8 h-8 rounded-full bg-brand text-brandfg grid place-items-center font-bold">{n}</span><span className="pt-1">{children}</span></li>
);
const ShareIcon = () => (
  <svg aria-hidden viewBox="0 0 24 24" className="inline w-5 h-5 align-text-bottom" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
);

export function InstallGuide() {
  const device = useSyncExternalStore(noopSubscribe, deviceSnapshot, () => "");
  const platform: Platform | null = device ? (device.split("|")[0] as Platform) : null;
  const [justInstalled, setJustInstalled] = useState(false);
  const installed = justInstalled || device.endsWith("|1");
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e as InstallPromptEvent); }; // zatrzymujemy natywny mini-pasek i pokazujemy własny przycisk
    const onInstalled = () => { setJustInstalled(true); setDeferred(null); };
    window.addEventListener("beforeinstallprompt", onPrompt); window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt(); const { outcome } = await deferred.userChoice; setDeferred(null);
    setMsg(outcome === "accepted" ? "Instalacja rozpoczęta – ikona SchoolPulse pojawi się na ekranie głównym." : "Instalacja anulowana. Możesz spróbować ponownie, odświeżając stronę.");
  }

  if (platform === null) return <div className="card p-6 min-h-40" aria-busy="true" aria-label="Sprawdzanie urządzenia" />;
  if (installed) return (<div className="card p-6" role="status"><h2 className="text-xl font-bold">✅ Aplikacja jest już zainstalowana</h2><p className="mt-2 text-muted">Otwierasz ją z ikony na ekranie głównym. Nic więcej nie trzeba robić.</p></div>);

  const InstallButton = deferred && (
    <button onClick={install} className="btn btn-primary w-full sm:w-auto text-lg">📲 Zainstaluj aplikację</button>
  );
  const Msg = msg && <p role="status" className="mt-3 font-medium">{msg}</p>;

  if (platform === "ios") return (
    <section className="card p-6" aria-labelledby="ios">
      <h2 id="ios" className="text-xl font-bold">Instalacja na iPhonie / iPadzie</h2>
      <p className="mt-1 text-muted">Apple nie pozwala zainstalować aplikacji jednym przyciskiem – zajmie to pół minuty:</p>
      <ol className="mt-4 grid gap-4">
        <Step n={1}>Otwórz tę stronę w przeglądarce <strong>Safari</strong>. (Kod QR zeskanowany aparatem otwiera Safari automatycznie.)</Step>
        <Step n={2}>Dotknij przycisku <strong>Udostępnij</strong> <ShareIcon /> – na iPhonie na dolnym pasku, na iPadzie u góry ekranu.</Step>
        <Step n={3}>Przewiń listę i wybierz <strong>„Dodaj do ekranu początkowego”</strong>.</Step>
        <Step n={4}>Dotknij <strong>„Dodaj”</strong> w prawym górnym rogu. Ikona SchoolPulse pojawi się na ekranie głównym.</Step>
      </ol>
      <p className="mt-4 text-sm text-muted">Nie widzisz opcji „Dodaj do ekranu początkowego”? Otwórz stronę w Safari (w innych przeglądarkach na iPhonie ta opcja bywa niedostępna).</p>
    </section>
  );

  return (
    <section className="card p-6" aria-labelledby="inst">
      <h2 id="inst" className="text-xl font-bold">{platform === "android" ? "Instalacja na telefonie z Androidem" : "Instalacja aplikacji"}</h2>
      {InstallButton ? (<><p className="mt-1 mb-4 text-muted">Jedno kliknięcie – przeglądarka zapyta o potwierdzenie.</p>{InstallButton}</>) : platform === "android" ? (
        <>
          <p className="mt-1 text-muted">Użyj menu przeglądarki Chrome:</p>
          <ol className="mt-4 grid gap-4">
            <Step n={1}>Dotknij menu <strong>⋮</strong> (trzy kropki) w prawym górnym rogu.</Step>
            <Step n={2}>Wybierz <strong>„Zainstaluj aplikację”</strong> (albo <strong>„Dodaj do ekranu głównego”</strong>).</Step>
            <Step n={3}>Potwierdź. Ikona SchoolPulse pojawi się na ekranie głównym.</Step>
          </ol>
          <p className="mt-4 text-sm text-muted">Nie ma takiej opcji? Otwórz stronę w Chrome (nie w przeglądarce wbudowanej w aplikację, np. Messengera) i odśwież ją.</p>
        </>
      ) : (<p className="mt-2">Tę aplikację instaluje się na <strong>telefonie</strong>. Zeskanuj kod QR poniżej aparatem telefonu. W Chrome na komputerze możesz też użyć ikony instalacji w pasku adresu.</p>)}
      {Msg}
    </section>
  );
}
