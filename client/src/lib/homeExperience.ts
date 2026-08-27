type ChapterLike = { title: string };

export function getBookStats(chapters: ChapterLike[]) {
  return {
    chapters: chapters.filter((chapter) => !chapter.title.includes("ЧАСТЬ")).length,
    parts: chapters.filter((chapter) => chapter.title.includes("ЧАСТЬ")).length,
  };
}

export function getReadingCtaLabel(hasStarted: boolean) {
  return hasStarted ? "Продолжить чтение" : "Начать читать книгу";
}
