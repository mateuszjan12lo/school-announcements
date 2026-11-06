import { test } from "node:test";
import { existsSync } from "node:fs";
import assert from "node:assert/strict";
import { violations, scanMain } from "../scripts/check-prod-safety.mjs";

test("clean production env passes", () => assert.deepEqual(violations({ NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co" }), []));
test("dev settings are ignored outside production", () => assert.deepEqual(violations({ NODE_ENV: "development", DEBUG: "1", ADMIN_EMAIL: "admin@example.test" }), []));
test("production rejects dev admin, debug, dev URLs, seed", () => {
  const v = violations({ APP_ENV: "production", DEBUG: "true", DEV_ADMIN_PASSWORD: "x", RUN_DEV_SEED: "1", SUPABASE_URL: "http://localhost:54321", ADMIN_EMAIL: "admin@example.test", NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: "x" });
  assert.equal(v.length, 6);
});
test("Vercel Preview nie jest produkcją mimo NODE_ENV=production", () => assert.deepEqual(violations({ NODE_ENV: "production", VERCEL_ENV: "preview", DEBUG: "1" }), []));
test("Vercel production counts as production", () => assert.equal(violations({ VERCEL_ENV: "production", DEBUG: "1" }).length, 1));
test("main-branch scan flags dev-only files and credentials on develop (expected here)", { skip: !existsSync("scripts/seed-dev.mjs") }, () => {
  const v = scanMain(".");
  assert.ok(v.some((x) => x.includes("seed-dev.mjs")));
  assert.ok(v.some((x) => /Admin123|example/.test(x)));
});
