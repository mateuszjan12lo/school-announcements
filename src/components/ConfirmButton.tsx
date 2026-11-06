"use client";
/** Przycisk z potwierdzeniem – używany przy czynnościach destrukcyjnych (np. usuwanie). */
export function ConfirmButton({ action, label, message, danger }: { action: () => void | Promise<void>; label: string; message: string; danger?: boolean }) {
  return (
    <form action={action} onSubmit={(e) => { if (!window.confirm(message)) e.preventDefault(); }}>
      <button className={`btn ${danger ? "btn-danger" : ""}`}>{label}</button>
    </form>
  );
}
