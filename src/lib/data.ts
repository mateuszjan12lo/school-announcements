import "server-only";
import { supabasePublic, supabaseUser } from "./supabase/server";
import type { Announcement, Klass } from "./types";

export const PAGE_SIZE = 20;
interface Row { id: string; title: string; body: string; class_id: string | null; pinned: boolean; deadline_at: string | null; expires_at: string | null; created_at: string }
const COLS = "id,title,body,class_id,pinned,deadline_at,expires_at,created_at";
const ms = (s: string | null) => (s ? new Date(s).getTime() : null);
const map = (r: Row): Announcement => ({ id: r.id, title: r.title, body: r.body, classId: r.class_id, pinned: r.pinned, deadlineAt: ms(r.deadline_at), expiresAt: ms(r.expires_at), createdAt: ms(r.created_at)! });

export async function listClasses(): Promise<Klass[]> {
  const { data } = await supabasePublic().from("classes").select("id,name").order("name"); return data ?? [];
}
/** Publiczna lista: RLS zwraca tylko niewygasłe. Stronicowanie (PAGE_SIZE) – jedno zapytanie na stronę (pobieramy o 1 więcej, by wiedzieć, czy jest następna). */
export async function listPublic(page: number, classId?: string): Promise<{ items: Announcement[]; hasNext: boolean }> {
  let q = supabasePublic().from("announcements").select(COLS).order("pinned", { ascending: false }).order("created_at", { ascending: false }).range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  if (classId) q = q.or(`class_id.is.null,class_id.eq.${classId}`);
  const { data } = await q; const rows = (data ?? []) as Row[];
  return { items: rows.slice(0, PAGE_SIZE).map(map), hasNext: rows.length > PAGE_SIZE };
}
/** Lista administratora (z sesją – RLS pokazuje także wygasłe). */
export async function listAll(): Promise<Announcement[]> {
  const sb = await supabaseUser(); const { data } = await sb.from("announcements").select(COLS).order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(500);
  return ((data ?? []) as Row[]).map(map);
}
export async function getOne(id: string, admin = false): Promise<Announcement | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const sb = admin ? await supabaseUser() : supabasePublic();
  const { data } = await sb.from("announcements").select(COLS).eq("id", id).maybeSingle(); return data ? map(data as Row) : null;
}
export const usedClassIds = async (): Promise<Set<string>> => {
  const sb = await supabaseUser(); const { data } = await sb.from("announcements").select("class_id").not("class_id", "is", null);
  return new Set((data ?? []).map((r: { class_id: string }) => r.class_id));
};
