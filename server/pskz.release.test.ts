import { describe, expect, it } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
// Standalone builder is an intentionally separate Node ESM artifact.
// @ts-expect-error The build helper has no TypeScript declaration file.
import { cleanStandaloneHtml, localizeIllustration, SOURCE_ILLUSTRATION, LOCAL_ILLUSTRATION, APACHE_RULES, safeOutputPath } from "../scripts/build-pskz.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("PS.kz standalone release helpers", () => {
  it("removes Manus analytics placeholders but preserves the React entry and actual fonts", () => {
    const html = `<html lang="en"><head><link href="https://fonts.googleapis.com/example"/><!-- THIS IS THE START OF A COMMENT BLOCK ignored --></head><body><script type="module" src="/src/main.tsx"></script><script defer src="%VITE_ANALYTICS_ENDPOINT%/umami" data-website-id="%VITE_ANALYTICS_WEBSITE_ID%"></script></body></html>`;
    const clean = cleanStandaloneHtml(html);
    expect(clean).toContain('lang="ru"');
    expect(clean).toContain("/src/main.tsx");
    expect(clean).toContain("https://fonts.googleapis.com/example");
    expect(clean).not.toContain("VITE_ANALYTICS");
    expect(clean).not.toContain("COMMENT BLOCK");
  });
  it("localizes every occurrence without modifying unrelated storage references", () => {
    expect(localizeIllustration(`${SOURCE_ILLUSTRATION} ${SOURCE_ILLUSTRATION} /manus-storage/other.png`)).toBe(`${LOCAL_ILLUSTRATION} ${LOCAL_ILLUSTRATION} /manus-storage/other.png`);
  });
  it("answers unknown API paths with 404 before the SPA fallback and blocks source files", () => {
    expect(APACHE_RULES.indexOf("^api(?:/|$)")).toBeLessThan(APACHE_RULES.indexOf("^ index.html"));
    expect(APACHE_RULES).not.toContain("gateway");
    expect(APACHE_RULES).toContain("Options -Indexes -MultiViews");
    expect(APACHE_RULES).toContain("^(?:assets|media)");
    expect(APACHE_RULES).not.toContain("cname.manus.space");
  });
  it.each([
    ".", "/", path.dirname(ROOT), ROOT, path.join(ROOT, "dist"),
    path.join(path.dirname(ROOT), "hosting-migration", "..", path.basename(ROOT)),
  ])("will never erase project or parent path %s", output => {
    expect(() => safeOutputPath(output)).toThrow();
  });
  it("accepts a fresh isolated sibling output directory", () => {
    expect(safeOutputPath("/home/ubuntu/hosting-migration/releases/jtbd-test")).toBe("/home/ubuntu/hosting-migration/releases/jtbd-test");
  });
});
