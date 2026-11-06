"use client";
import { useActionState } from "react";
import * as A from "@/app/actions";

const Msg = ({ s }: { s: A.FormState }) => (<>{s?.error && <p role="alert" className="text-sm font-medium text-amber-800 dark:text-amber-300">{s.error}</p>}{s?.ok && <p role="status" className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Zapisano pomyślnie</p>}</>);

export function LoginForm() {
  const [s, act, pending] = useActionState(A.loginAction, undefined);
  return (
    <form action={act} className="card p-6 grid gap-4">
      <div><label className="label" htmlFor="email">Adres e-mail</label><input id="email" name="email" type="email" autoComplete="username" required className="input" /></div>
      <div><label className="label" htmlFor="password">Hasło</label><input id="password" name="password" type="password" autoComplete="current-password" required className="input" /></div>
      <Msg s={s} /><button className="btn btn-primary" disabled={pending}>{pending ? "Logowanie…" : "Zaloguj się"}</button>
    </form>
  );
}

export interface AnnouncementValues { title: string; body: string; classId: string | null; pinned: boolean; deadline: string; expires: string }
export function AnnouncementForm({ id, classes, v }: { id: string | null; classes: { id: string; name: string }[]; v: AnnouncementValues }) {
  const [s, act, pending] = useActionState(A.saveAnnouncement.bind(null, id), undefined);
  const val = (k: string, fallback: string) => s?.values?.[k] ?? fallback; // po błędzie walidacji pola zachowują wpisane wartości
  return (
    <form action={act} className="card p-5 grid gap-4">
      <div><label className="label" htmlFor="title">Tytuł</label><input id="title" name="title" defaultValue={val("title", v.title)} required minLength={3} maxLength={120} className="input" /></div>
      <div><label className="label" htmlFor="body">Treść</label><textarea id="body" name="body" defaultValue={val("body", v.body)} rows={5} maxLength={2000} className="input" /></div>
      <div><label className="label" htmlFor="classId">Której klasy dotyczy</label>
        <select id="classId" name="classId" defaultValue={val("classId", v.classId ?? "")} className="input"><option value="">Cała szkoła</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="deadlineAt">Termin (trafia do kalendarza)</label><input id="deadlineAt" name="deadlineAt" type="datetime-local" defaultValue={val("deadlineAt", v.deadline)} className="input" /></div>
        <div><label className="label" htmlFor="expiresAt">Wygasa (puste = nie wygasa)</label><input id="expiresAt" name="expiresAt" type="datetime-local" defaultValue={val("expiresAt", v.expires)} className="input" /></div>
      </div>
      <label className="flex gap-2 items-center min-h-11"><input type="checkbox" name="pinned" defaultChecked={s?.values ? s.values.pinned === "on" : v.pinned} /> Przypnij na górze</label>
      <Msg s={s} />
      <div><button className="btn btn-primary" disabled={pending}>{id ? "Zapisz zmiany" : "Dodaj ogłoszenie"}</button></div>
    </form>
  );
}

export function ClassForm() {
  const [s, act, pending] = useActionState(A.addClass, undefined);
  return (
    <form action={act} className="flex flex-wrap items-end gap-2">
      <div><label className="label" htmlFor="cname">Nowa klasa</label><input id="cname" name="name" maxLength={40} required className="input" /></div>
      <button className="btn btn-primary" disabled={pending}>Dodaj klasę</button><div className="w-full"><Msg s={s} /></div>
    </form>
  );
}
