#!/usr/bin/env node
// Generuje ikony PNG aplikacji (PWA) z public/icon.svg. Uruchom: node scripts/make-icons.mjs
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";

const svg = readFileSync("public/icon.svg", "utf8");
const OUT = [["public/icon-192.png", 192], ["public/icon-512.png", 512], ["public/icon-maskable-512.png", 512], ["public/apple-touch-icon.png", 180]];
const browser = await chromium.launch(); const page = await browser.newPage();
for (const [file, size] of OUT) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:#4f46e5}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  writeFileSync(file, await page.screenshot({ clip: { x: 0, y: 0, width: size, height: size } })); console.log("✔", file);
}
await browser.close();
