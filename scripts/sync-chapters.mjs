#!/usr/bin/env node
/**
 * sync-chapters.mjs
 * Syncs new chapters from server/book_content.md into client/src/data/chapters_full.json.
 *
 * Strategy:
 *   1. Parse only explicit part headers and numbered chapter headings from book_content.md.
 *   2. Rebuild chapters_full.json in the same reading order as the source.
 *   3. Exclude appendices and incidental Markdown headings from sidebar navigation.
 *
 * Usage: pnpm sync-chapters
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const BOOK_PATH = resolve(ROOT, "server/book_content.md");
const OUTPUT_PATH = resolve(ROOT, "client/src/data/chapters_full.json");

// 1. Parse explicit reading units from book_content.md.
const content = readFileSync(BOOK_PATH, "utf-8");
const headingPattern = /^(# ЧАСТЬ [^\n]+|## Глава \d+\.[^\n]+)$/gm;
const headings = [...content.matchAll(headingPattern)];

const parsed = headings.map((match, index) => {
  const title = match[1]
    .replace(/^#{1,2}\s+/, "")
    .replace(/^Часть\s+/i, "ЧАСТЬ ")
    .trim();
  const bodyStart = (match.index ?? 0) + match[0].length;
  const bodyEnd = index < headings.length - 1 ? (headings[index + 1].index ?? content.length) : content.length;
  const body = content.slice(bodyStart, bodyEnd).trim();
  return { title, content: title.includes("ЧАСТЬ") ? body : body };
});

if (parsed.length === 0) {
  throw new Error("Не найдены заголовки частей или нумерованных глав для синхронизации.");
}

// 2. Rebuild in source order. This removes stale, duplicated and incidental headings.
writeFileSync(OUTPUT_PATH, JSON.stringify(parsed, null, 2), "utf-8");

console.log(`✅ Rebuilt ${parsed.length} reading units → ${OUTPUT_PATH}`);
