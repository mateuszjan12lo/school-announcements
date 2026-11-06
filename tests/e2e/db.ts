import { createClient } from "@supabase/supabase-js";
/** Pomocnik testowy: id ogłoszenia po tytule (klucz service_role używany WYŁĄCZNIE w testach, nigdy w aplikacji klienckiej). */
export async function idByTitle(title: string): Promise<string> {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { data } = await sb.from("announcements").select("id").eq("title", title).limit(1).single(); return data!.id;
}
