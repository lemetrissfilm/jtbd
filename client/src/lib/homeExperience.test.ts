import { describe, expect, it } from "vitest";
import { getBookStats, getReadingCtaLabel, HOME_HERO_HEADLINE } from "./homeExperience";

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

  it("uses a clear methodology-first start-or-resume CTA", () => {
    expect(getReadingCtaLabel(false)).toBe("Открыть методологию");
    expect(getReadingCtaLabel(true)).toBe("Продолжить с места остановки");
  });

  it("keeps the hero promise focused on understanding context before features", () => {
    expect(`${HOME_HERO_HEADLINE.prefix} ${HOME_HERO_HEADLINE.emphasis}`).toBe(
      "Начните разработку не с фичи, а с понимания контекста",
    );
  });
});
