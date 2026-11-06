#!/usr/bin/env node
// Fails (exit 1) when a production-like environment contains development settings, or — with --branch main —
// when demo credentials/seed data exist in the source tree. Mirrors src/lib/safety.ts.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

export function violations(env) {
  const v = [];
  const prod = env.VERCEL_ENV ? env.VERCEL_ENV === "production" : env.APP_ENV ? env.APP_ENV === "production" : env.NODE_ENV === "production"; // Vercel Preview ma NODE_ENV=production, ale nie jest produkcją
  if (!prod) return v;
  if (["1", "true"].includes(env.DEBUG) || env.NEXT_PUBLIC_DEBUG === "true") v.push("Debug mode enabled in production");
  if (env.DEV_ADMIN_EMAIL || env.DEV_ADMIN_PASSWORD) v.push("Development credentials present in production environment");
  if (env.RUN_DEV_SEED === "1" || env.SEED_ENV) v.push("Dev seed configured in production");
  if (Object.keys(env).some((k) => k.startsWith("NEXT_PUBLIC_") && /SERVICE_ROLE/i.test(k))) v.push("Service-role key exposed with NEXT_PUBLIC_ prefix");
  const url = `${env.NEXT_PUBLIC_SUPABASE_URL ?? ""} ${env.SUPABASE_URL ?? ""}`;
  if (/(127\.0\.0\.1|localhost|host\.docker\.internal|\.dev\.|-dev\.|example\.test)/i.test(url)) v.push("Development Supabase URL configured in production");
  if ((env.ADMIN_EMAIL ?? "").toLowerCase().endsWith("@example.test")) v.push("Development-style (.test) account configured in production");
  return v;
}

const FORBIDDEN = [/(admin|teacher|student2?|parent|otheradmin)@example\.test/i, /Admin123!/, /Teacher123!/, /Student123!/, /Parent123!/, /Other123!/, /DEV_ADMIN_PASSWORD\s*[:=]\s*\S/];
const DEV_ONLY_FILES = ["DEMO_ACCOUNTS.md", "TESTING.md", "TEST_CHECKLIST.md", "docker-compose.yml", ".env.development", ".env.development.example", "scripts/seed-dev.mjs"];
function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    if (["node_modules", ".next", ".git", "tests"].includes(n)) continue;
    const p = join(dir, n); statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
}
export function scanMain(root = ".") {
  const v = [];
  for (const f of DEV_ONLY_FILES) if (existsSync(join(root, f))) v.push(`Dev-only file must not exist on main: ${f}`);
  for (const d of ["src", "public", "supabase"]) {
    if (!existsSync(join(root, d))) continue;
    for (const f of walk(join(root, d))) {
      const t = readFileSync(f, "utf8");
      for (const re of FORBIDDEN) if (re.test(t)) { v.push(`Demo credential pattern ${re} in ${f}`); break; }
    }
  }
  return v;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const main = process.argv.includes("--branch") && process.argv[process.argv.indexOf("--branch") + 1] === "main";
  const found = [...violations(process.env), ...(main ? scanMain() : [])];
  if (found.length) { console.error("✖ Production safety check FAILED:\n" + found.map((x) => "  - " + x).join("\n")); process.exit(1); }
  console.log(`✔ Production safety check passed${main ? " (main-branch scan included)" : ""}`);
}
