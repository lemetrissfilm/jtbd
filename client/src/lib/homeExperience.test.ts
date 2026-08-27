import { describe, expect, it } from "vitest";
import { getBookStats, getReadingCtaLabel } from "./homeExperience";

describe("home experience", () => {
  it("counts only readable chapters separately from part headers", () => {
    const stats = getBookStats([
      { title: "ЧАСТЬ I. ОСНОВЫ" },
      { title: "Глава 1. Начало" },
      { title: "Глава 2. Контекст" },
      { title: "ЧАСТЬ II. ИНСТРУМЕНТЫ" },
    ]);

    expect(stats).toEqual({ chapters: 2, parts: 2 });
  });

  it("uses a clear start-or-resume CTA", () => {
    expect(getReadingCtaLabel(false)).toBe("Начать читать книгу");
    expect(getReadingCtaLabel(true)).toBe("Продолжить чтение");
  });
});
