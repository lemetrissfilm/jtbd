import { describe, expect, it } from "vitest";
import chapters from "./chapters_full.json";
import { BOOK_CASES } from "./cases";

describe("book cases", () => {
  it.each(BOOK_CASES)("$id ссылается на свою главу книги", (item) => {
    const chapter = chapters[item.chapter];
    expect(chapter, item.id).toBeDefined();
    expect(chapter.title.startsWith(`${item.chapterLabel}.`)).toBe(true);
  });
  it("имеет уникальные идентификаторы для якорей", () => {
    expect(new Set(BOOK_CASES.map((item) => item.id)).size).toBe(BOOK_CASES.length);
  });
});
