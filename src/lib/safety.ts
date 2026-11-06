/** Reguły bezpieczeństwa produkcji. Używane przez akcję logowania i (lustrzanie) przez scripts/check-prod-safety.mjs. */
export const DEV_EMAIL_SUFFIX = "@example.test";
export const isDevEmail = (email: string) => email.trim().toLowerCase().endsWith(DEV_EMAIL_SUFFIX);
/** Na Vercelu decyduje VERCEL_ENV (Preview ma NODE_ENV=production, ale NIE jest produkcją); poza Vercelem – APP_ENV, a bez niego NODE_ENV. */
export const isProduction = (env: Record<string, string | undefined> = process.env) =>
  env.VERCEL_ENV ? env.VERCEL_ENV === "production" : env.APP_ENV ? env.APP_ENV === "production" : env.NODE_ENV === "production";
/** Czy aplikacja ma odrzucić to logowanie jeszcze przed zapytaniem do Supabase (konto deweloperskie w produkcji). */
export const rejectDevLogin = (email: string, env: Record<string, string | undefined> = process.env) => isProduction(env) && isDevEmail(email);

export function productionViolations(env: Record<string, string | undefined>): string[] {
  const v: string[] = [];
  if (!isProduction(env)) return v;
  if (env.DEBUG === "1" || env.DEBUG === "true" || env.NEXT_PUBLIC_DEBUG === "true") v.push("Debug mode enabled in production");
  if (env.DEV_ADMIN_EMAIL || env.DEV_ADMIN_PASSWORD) v.push("Development credentials present in production environment");
  if (env.RUN_DEV_SEED === "1" || env.SEED_ENV) v.push("Dev seed configured in production");
  const url = `${env.NEXT_PUBLIC_SUPABASE_URL ?? ""} ${env.SUPABASE_URL ?? ""}`;
  if (/(127\.0\.0\.1|localhost|host\.docker\.internal|\.dev\.|-dev\.|example\.test)/i.test(url)) v.push("Development Supabase URL configured in production");
  if (isDevEmail(env.ADMIN_EMAIL ?? "")) v.push("Development-style (.test) account configured in production");
  if (/^NEXT_PUBLIC_/.test(Object.keys(env).find((k) => /SERVICE_ROLE/i.test(k) && k.startsWith("NEXT_PUBLIC_")) ?? "")) v.push("Service-role key exposed with NEXT_PUBLIC_ prefix");
  return v;
}
