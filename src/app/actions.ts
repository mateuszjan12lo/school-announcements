"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseUser } from "@/lib/supabase/server";
import { login, logout, requireAdmin } from "@/lib/session";
import { announcementSchema, loginSchema } from "@/lib/validation";

export type FormState = { error?: string; ok?: boolean; values?: Record<string, string> } | undefined;
const fd = (f: FormData) => Object.fromEntries(f.entries());
const DB_ERR = "Nie udało się zapisać zmian. Spróbuj ponownie.";

export async function loginAction(_: FormState, f: FormData): Promise<FormState> {
  const p = loginSchema.safeParse(fd(f));
  if (!p.success) return { error: "Nieprawidłowy adres e-mail lub hasło." };
  const r = await login(p.data.email, p.data.password);
  if (!r.ok) return { error: r.error };
  redirect("/admin");
}
export async function logoutAction() { await logout(); redirect("/admin/logowanie"); }

/** Tworzenie (id = null) i edycja ogłoszenia. Zapis idzie przez klienta użytkownika, więc RLS i tak wpuści tylko administratora. */
export async function saveAnnouncement(id: string | null, _: FormState, f: FormData): Promise<FormState> {
  await requireAdmin();
  const raw = fd(f); const values = Object.fromEntries(Object.entries(raw).filter(([, x]) => typeof x === "string")) as Record<string, string>;
  const err = (error: string): FormState => ({ error, values }); // zachowujemy wpisane wartości po błędzie
  const p = announcementSchema.safeParse(raw);
  if (!p.success) return err(p.error.issues[0]?.message ?? "Nieprawidłowe dane");
  const v = p.data;
  if (v.expiresAt !== null && v.expiresAt <= Date.now()) return err("Data wygaśnięcia musi być w przyszłości.");
  const sb = await supabaseUser();
  if (v.classId) { const { data } = await sb.from("classes").select("id").eq("id", v.classId).maybeSingle(); if (!data) return err("Wybrana klasa nie istnieje."); }
  const row = { title: v.title, body: v.body, class_id: v.classId, pinned: v.pinned, deadline_at: v.deadlineAt ? new Date(v.deadlineAt).toISOString() : null, expires_at: v.expiresAt ? new Date(v.expiresAt).toISOString() : null };
  const { error } = id ? await sb.from("announcements").update(row).eq("id", id) : await sb.from("announcements").insert(row);
  if (error) return err(DB_ERR);
  revalidatePath("/"); redirect("/admin");
}
export async function togglePin(id: string, pinned: boolean) {
  await requireAdmin(); const sb = await supabaseUser(); await sb.from("announcements").update({ pinned: !pinned }).eq("id", id); revalidatePath("/"); revalidatePath("/admin");
}
export async function deleteAnnouncement(id: string) {
  await requireAdmin(); const sb = await supabaseUser(); await sb.from("announcements").delete().eq("id", id); revalidatePath("/"); revalidatePath("/admin");
}
export async function addClass(_: FormState, f: FormData): Promise<FormState> {
  await requireAdmin(); const name = String(f.get("name") ?? "").trim();
  if (name.length < 1 || name.length > 40) return { error: "Nazwa klasy musi mieć od 1 do 40 znaków." };
  const sb = await supabaseUser(); const { error } = await sb.from("classes").insert({ name });
  if (error) return { error: error.code === "23505" ? "Taka klasa już istnieje." : DB_ERR };
  revalidatePath("/"); revalidatePath("/admin"); return { ok: true };
}
export async function deleteClass(id: string) {
  await requireAdmin(); const sb = await supabaseUser(); await sb.from("classes").delete().eq("id", id); // klasa w użyciu → baza odrzuci (ON DELETE RESTRICT)
  revalidatePath("/"); revalidatePath("/admin");
}
