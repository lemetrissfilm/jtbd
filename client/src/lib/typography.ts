/**
 * Русская типографика для текста книги: неразрывные пробелы, тире, кавычки-ёлочки.
 * Работает над одним текстовым узлом, не трогает код и формулы (см. rehypeRussianTypography).
 */

const NBSP = " ";

// Предлоги и союзы до трёх букв, которые не должны оставаться в конце строки.
const SHORT_WORDS =
  "в|во|к|ко|с|со|у|о|об|обо|на|по|за|из|от|до|и|а|но|да|ни|не|без|при|про|для|над|под|или|как|что|это";
const SHORT_WORD_RE = new RegExp(`(?<![\\p{L}\\p{N}])(${SHORT_WORDS})[ \\t]+(?=[^\\s])`, "giu");
const PARTICLE_RE = /[ \t]+(бы|ли|же|ж)(?![\p{L}\p{N}])/giu;
const NUMBER_UNIT_RE = /(\d)[ \t]+(?=(?:(?:%|₸|\$|€|тг|ч|м|см|км|кг|кб|мб|гб|шт)(?![\p{L}])|(?:тенге|руб|мин|сек|час|лет|год|дн|недел|месяц|человек|раз|тыс|млн|млрд)\p{L}{0,6}(?![\p{L}])))/giu;
const OPENING_BEFORE_QUOTE = /[\s(\[{—–\-«„"]/u;

export function typografy(text: string): string {
  if (!text) return text;
  let result = text;

  // Многоточие.
  result = result.replace(/\.{3}/g, "…");

  // Дефис с пробелами вокруг — это тире; перед тире неразрывный пробел.
  result = result.replace(/[ \t]+[-–][ \t]+/g, `${NBSP}— `);
  result = result.replace(/[ \t]+—[ \t]+/g, `${NBSP}— `);

  // Диапазоны чисел: 3-5 → 3–5 (не трогаем даты вида 2026-11-26).
  result = result.replace(/(?<![\d-])(\d{1,3})-(\d{1,3})(?![\d-])/g, "$1–$2");

  // Кавычки: открывающая после пробела, скобки, тире или в начале узла; иначе закрывающая.
  result = result.replace(/"/g, (_match, offset: number, whole: string) => {
    const previous = offset === 0 ? "" : whole[offset - 1];
    return previous === "" || OPENING_BEFORE_QUOTE.test(previous) ? "«" : "»";
  });

  // Короткие слова и частицы не отрываются от соседнего слова.
  result = result.replace(SHORT_WORD_RE, `$1${NBSP}`);
  result = result.replace(PARTICLE_RE, `${NBSP}$1`);
  result = result.replace(NUMBER_UNIT_RE, `$1${NBSP}`);

  return result;
}

type HastNode = {
  type: string;
  value?: string;
  tagName?: string;
  properties?: { className?: unknown };
  children?: HastNode[];
};

const SKIPPED_TAGS = new Set(["code", "pre", "script", "style", "kbd", "samp"]);

function hasClass(node: HastNode, name: string): boolean {
  const value = node.properties?.className;
  const list = Array.isArray(value) ? value : typeof value === "string" ? value.split(/\s+/) : [];
  return list.some((item) => typeof item === "string" && (item === name || item.startsWith(name)));
}

function walk(node: HastNode): void {
  if (node.type === "element") {
    if (node.tagName && SKIPPED_TAGS.has(node.tagName)) return;
    if (hasClass(node, "katex") || hasClass(node, "math")) return;
  }
  if (node.type === "text" && typeof node.value === "string") {
    node.value = typografy(node.value);
  }
  node.children?.forEach(walk);
}

/** rehype-плагин: применяет typografy ко всем текстовым узлам, кроме кода и формул. */
export function rehypeRussianTypography() {
  return (tree: HastNode) => {
    walk(tree);
  };
}
