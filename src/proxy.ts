import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Proxy dla /admin: odświeża sesję Supabase (ciasteczka) i wcześnie odsyła niezalogowanych na logowanie.
// Prawdziwa autoryzacja (rola administratora pod RLS) odbywa się w każdej stronie i akcji panelu (requireAdmin).
export async function proxy(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => { list.forEach(({ name, value }) => req.cookies.set(name, value)); res = NextResponse.next({ request: req }); list.forEach(({ name, value, options }) => res.cookies.set(name, value, options)); },
    },
  });
  const { data: { user } } = await sb.auth.getUser();
  if (!user && req.nextUrl.pathname !== "/admin/logowanie") return NextResponse.redirect(new URL("/admin/logowanie", req.url));
  res.headers.set("X-Robots-Tag", "noindex, nofollow"); res.headers.set("Cache-Control", "no-store");
  return res;
}
export const config = { matcher: ["/admin", "/admin/:path*"] };
