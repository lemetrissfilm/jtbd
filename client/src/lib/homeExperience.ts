type ChapterLike = { title: string };

export const HOME_HERO_HEADLINE = {
  prefix: "Начните разработку не с фичи, а с",
  emphasis: "понимания контекста",
} as const;

export function getBookStats(chapters: ChapterLike[]) {
  return {
    chapters: chapters.filter((chapter) => !chapter.title.includes("ЧАСТЬ")).length,
    parts: chapters.filter((chapter) => chapter.title.includes("ЧАСТЬ")).length,
  };
}

export function getReadingCtaLabel(hasStarted: boolean) {
  return hasStarted ? "Продолжить с места остановки" : "Открыть методологию";
}
