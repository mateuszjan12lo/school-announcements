// Testy integracyjne autoryzacji na PRAWDZIWEJ bazie (lokalny Supabase): `supabase start`, potem `npm run test:rls`.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!, ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const mk = (key: string) => createClient(URL, key, opts);
const H = 3600_000, iso = (t: number) => new Date(t).toISOString();

let svc: SupabaseClient, anon: SupabaseClient, admin: SupabaseClient, user: SupabaseClient;
let liveId = "", expiredId = "", classId = "", usedClassId = "";
const createdUsers: string[] = [];

async function signedIn(email: string, password: string, makeAdmin: boolean) {
  const { data, error } = await svc.auth.admin.createUser({ email, password, email_confirm: true }); if (error) throw error;
  createdUsers.push(data.user.id); if (makeAdmin) await svc.from("admins").insert({ user_id: data.user.id });
  const c = mk(ANON); const r = await c.auth.signInWithPassword({ email, password }); if (r.error) throw r.error; return c;
}

beforeAll(async () => {
  expect(URL && ANON && SERVICE, "ustaw zmienne Supabase (npm run test:rls)").toBeTruthy();
  svc = mk(SERVICE); anon = mk(ANON); const tag = Date.now();
  admin = await signedIn(`rls-admin-${tag}@example.test`, "rls-admin-pass", true);
  user = await signedIn(`rls-user-${tag}@example.test`, "rls-user-pass", false);
  classId = (await svc.from("classes").insert({ name: `RLS-${tag}` }).select().single()).data!.id;
  usedClassId = (await svc.from("classes").insert({ name: `RLS-użyta-${tag}` }).select().single()).data!.id;
  liveId = (await svc.from("announcements").insert({ title: `RLS żywe ${tag}`, expires_at: iso(Date.now() + H) }).select().single()).data!.id;
  expiredId = (await svc.from("announcements").insert({ title: `RLS wygasłe ${tag}`, expires_at: iso(Date.now() - H) }).select().single()).data!.id;
  await svc.from("announcements").insert({ title: `RLS z klasą ${tag}`, class_id: usedClassId });
});
afterAll(async () => {
  await svc.from("announcements").delete().like("title", "RLS %"); await svc.from("classes").delete().like("name", "RLS-%");
  for (const id of createdUsers) await svc.auth.admin.deleteUser(id);
});

describe("odczyt publiczny (anon)", () => {
  it("widzi niewygasłe, NIE widzi wygasłych", async () => {
    const { data } = await anon.from("announcements").select("id"); const ids = (data ?? []).map((r) => r.id);
    expect(ids).toContain(liveId); expect(ids).not.toContain(expiredId);
  });
  it("nie pobierze wygasłego nawet po znanym id", async () => { expect((await anon.from("announcements").select("id").eq("id", expiredId)).data).toEqual([]); });
  it("widzi klasy", async () => { expect((await anon.from("classes").select("id")).data!.length).toBeGreaterThan(0); });
  it("nie widzi listy administratorów, a is_admin() = false", async () => {
    expect((await anon.from("admins").select("*")).data ?? []).toEqual([]); expect((await anon.rpc("is_admin")).data).toBe(false);
  });
});

describe("zapis zabroniony dla anon i zwykłego zalogowanego użytkownika", () => {
  for (const [name, client] of [["anon", () => anon], ["zwykły użytkownik", () => user]] as const) {
    it(`${name}: INSERT/UPDATE/DELETE ogłoszeń odrzucone, dane nietknięte`, async () => {
      const c = client();
      expect((await c.from("announcements").insert({ title: "RLS włam" })).error).toBeTruthy();
      await c.from("announcements").update({ title: "RLS zmieniony" }).eq("id", liveId); await c.from("announcements").delete().eq("id", liveId);
      const { data } = await svc.from("announcements").select("title").eq("id", liveId).single(); expect(data!.title).toMatch(/^RLS żywe/);
    });
    it(`${name}: klasy i admins – zapis odrzucony`, async () => {
      const c = client(); expect((await c.from("classes").insert({ name: "RLS-włam" })).error).toBeTruthy();
      expect((await c.from("admins").insert({ user_id: "00000000-0000-4000-8000-000000000000" })).error).toBeTruthy();
    });
  }
  it("zwykły użytkownik nie może nadać sobie roli administratora", async () => {
    const { data: { user: u } } = await user.auth.getUser(); expect((await user.from("admins").insert({ user_id: u!.id })).error).toBeTruthy();
    expect((await user.rpc("is_admin")).data).toBe(false);
  });
  it("zwykły użytkownik nie widzi wygasłych", async () => { expect((await user.from("announcements").select("id").eq("id", expiredId)).data).toEqual([]); });
});

describe("administrator", () => {
  it("is_admin() = true; widzi wygasłe", async () => {
    expect((await admin.rpc("is_admin")).data).toBe(true); expect((await admin.from("announcements").select("id").eq("id", expiredId)).data!.length).toBe(1);
  });
  it("tworzy, edytuje, przypina i usuwa ogłoszenie", async () => {
    const { data, error } = await admin.from("announcements").insert({ title: "RLS admin nowe", class_id: classId, deadline_at: iso(Date.now() + H) }).select().single(); expect(error).toBeNull();
    expect((await admin.from("announcements").update({ pinned: true, title: "RLS admin edycja" }).eq("id", data!.id).select().single()).data!.pinned).toBe(true);
    expect((await admin.from("announcements").delete().eq("id", data!.id)).error).toBeNull(); expect((await svc.from("announcements").select("id").eq("id", data!.id)).data).toEqual([]);
  });
  it("zarządza klasami", async () => { const r = await admin.from("classes").insert({ name: `RLS-adm-${Date.now()}` }); expect(r.error).toBeNull(); });
  it("nie może zapisać do admins (tylko service_role/SQL)", async () => { expect((await admin.from("admins").insert({ user_id: "00000000-0000-4000-8000-000000000000" })).error).toBeTruthy(); });
});

describe("ograniczenia bazy", () => {
  it("wygaśnięcie przed terminem odrzucone przez CHECK", async () => {
    const r = await admin.from("announcements").insert({ title: "RLS check", deadline_at: iso(Date.now() + 2 * H), expires_at: iso(Date.now() + H) }); expect(r.error?.code).toBe("23514");
  });
  it("za krótki tytuł odrzucony", async () => { expect((await admin.from("announcements").insert({ title: "ab" })).error?.code).toBe("23514"); });
  it("klasy w użyciu nie da się usunąć (ON DELETE RESTRICT)", async () => {
    await admin.from("classes").delete().eq("id", usedClassId); expect((await svc.from("classes").select("id").eq("id", usedClassId)).data!.length).toBe(1);
  });
  it("nazwa klasy jest unikalna bez względu na wielkość liter", async () => {
    const n = `RLS-uniq-${Date.now()}`; await admin.from("classes").insert({ name: n }); expect((await admin.from("classes").insert({ name: n.toUpperCase() })).error?.code).toBe("23505");
  });
});
