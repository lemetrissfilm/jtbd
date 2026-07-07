#!/usr/bin/env node
/**
 * sync-chapters.mjs
 * Syncs new chapters from server/book_content.md into client/src/data/chapters_full.json.
 *
 * Strategy:
 *   1. Read the current chapters_full.json (source of truth for parts I-XI structure)
 *   2. Parse book_content.md to find all ## sections
 *   3. Find sections in markdown that are NOT yet in chapters_full.json (by title match)
 *   4. Normalize their ЧАСТЬ headers to uppercase
 *   5. Append new sections to chapters_full.json
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

// 1. Load current chapters
const existing = JSON.parse(readFileSync(OUTPUT_PATH, "utf-8"));
const existingTitles = new Set(existing.map((ch) => normalizeTitle(ch.title)));

// 2. Parse book_content.md
const content = readFileSync(BOOK_PATH, "utf-8");
const rawSections = content.split(/\n(?=## )/);

const parsed = [];
for (const section of rawSections) {
  const trimmed = section.trim();
  if (!trimmed) continue;
  const lines = trimmed.split("\n");
  let title = lines[0].replace(/^##\s+/, "").trim();
  const body = lines.slice(1).join("\n").trim();
  // Normalize ЧАСТЬ to uppercase
  title = title.replace(/^Часть\s+/i, "ЧАСТЬ ");
  parsed.push({ title, content: body });
}

// 3. Find new sections not in existing
const newChapters = parsed.filter(
  (ch) => !existingTitles.has(normalizeTitle(ch.title))
);

if (newChapters.length === 0) {
  console.log("✅ No new chapters found. chapters_full.json is up to date.");
  process.exit(0);
}

// 4. Append new chapters
const updated = [...existing, ...newChapters];
writeFileSync(OUTPUT_PATH, JSON.stringify(updated, null, 2), "utf-8");

console.log(`✅ Added ${newChapters.length} new chapter(s) → ${OUTPUT_PATH}`);
console.log(`   Total chapters: ${updated.length}`);
console.log("\nNew chapters added:");
newChapters.forEach((ch) => console.log(`  + ${ch.title}`));

// Helper: normalize title for comparison (lowercase, trim)
function normalizeTitle(title) {
  return title.toLowerCase().trim().replace(/\s+/g, " ");
}
