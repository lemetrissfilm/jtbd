import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Streamdown } from "streamdown";
import { createBookMarkdownPlugins } from "./bookMarkdown";

const origin = "https://jtbd.mikh.kz";
function render(markdown: string) {
  return renderToStaticMarkup(createElement(Streamdown, { rehypePlugins: createBookMarkdownPlugins(origin), children: markdown }));
}

describe("Book Markdown trusted illustrations", () => {
  it.each(["/media/job_chain_diagram_a891f841.png", "/manus-storage/job_chain_diagram_a891f841.png"])("renders same-origin illustration %s without blocked placeholder", image => {
    const html = render(`![Job Chain диаграмма](${image})`);
    expect(html).toContain("<img");
    expect(html).toContain(`src="${image}"`);
    expect(html).not.toContain("Image blocked");
  });
  it.each(["https://untrusted.example/image.png", "https://jtbd.mikh.kz.attacker.example/media/image.png", "data:image/png;base64,AAAA", "javascript:alert(1)"])("does not allow image %s", image => {
    expect(render(`![Untrusted image](${image})`)).not.toContain("<img");
  });
  it("retains safe external book links and Cyrillic text", () => {
    const html = render("Контекст: [источник](https://example.com/research)");
    expect(html).toContain("Контекст");
    expect(html).toContain('href="https://example.com/research"');
  });
  it("rejects non-HTTP origins", () => {
    expect(() => createBookMarkdownPlugins("file:///book")).toThrow();
  });
});
