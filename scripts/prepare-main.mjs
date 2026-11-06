#!/usr/bin/env node
// Przygotowuje drzewo plików do gałęzi `main`: usuwa wszystko, co deweloperskie (seed, konta, Docker, testy e2e, dokumentację testową)
// i czyści odpowiadające im skrypty z package.json. Użycie: node scripts/prepare-main.mjs [katalog]. Po nim: npm run check:main
import { rmSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2] ?? ".";
const REMOVE = ["DEMO_ACCOUNTS.md", "TESTING.md", "TEST_CHECKLIST.md", "docker-compose.yml", ".env.development", ".env.development.example",
  "scripts/seed-dev.mjs", "tests/e2e", "playwright.config.ts"];
const DROP_SCRIPTS = ["db:seed", "db:reset", "test:e2e", "test:all", "supabase:start"];
for (const f of REMOVE) if (existsSync(join(root, f))) rmSync(join(root, f), { recursive: true, force: true });
const pkgPath = join(root, "package.json"); const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
for (const k of DROP_SCRIPTS) delete pkg.scripts[k];
pkg.scripts["test:security"] = "vitest run tests/unit/production-safety.test.ts && node --test tests/check-script.test.mjs";
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log("✔ Drzewo przygotowane pod `main` (bez danych i kont deweloperskich).");
