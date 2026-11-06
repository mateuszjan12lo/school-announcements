import QRCode from "qrcode";

/** Kod QR jako SVG renderowany przez React (bez innerHTML). Stałe kolory – czytelny także w trybie ciemnym i na wydruku. */
export function QrCode({ text, label }: { text: string; label: string }) {
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const n = qr.modules.size, data = qr.modules.data, quiet = 4, total = n + quiet * 2;
  const cells: string[] = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (data[y * n + x]) cells.push(`M${x + quiet} ${y + quiet}h1v1h-1z`);
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${total} ${total}`} className="w-64 h-64 max-w-full rounded-lg" shapeRendering="crispEdges">
      <rect width={total} height={total} fill="#ffffff" /><path d={cells.join("")} fill="#14213d" />
    </svg>
  );
}
