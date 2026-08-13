export type ResearchDomain = "consumer" | "b2b" | "emotional" | "high-stakes";

export type DomainProfile = {
  id: ResearchDomain;
  label: string;
  shortLabel: string;
  description: string;
  validation: string;
  safeguards: string[];
  requiredRoles: string[];
  evidenceRule: string;
};

export const DOMAIN_PROFILES: Record<ResearchDomain, DomainProfile> = {
  consumer: {
    id: "consumer",
    label: "Обычный B2C-сценарий",
    shortLabel: "B2C",
    description: "Одиночное решение пользователя с умеренной ценой ошибки.",
    validation: "Проверьте топ-гипотезы на 3–5 людях из целевого контекста.",
    safeguards: [
      "Отделяйте прямые цитаты и наблюдения от гипотез нейроперсоны.",
      "Не переносите оценку важности из симуляции в бэклог без маркировки уверенности.",
    ],
    requiredRoles: ["Пользователь в целевой ситуации"],
    evidenceRule: "Минимум два независимых типа источников до симуляции.",
  },
  b2b: {
    id: "b2b",
    label: "Многоролевой B2B",
    shortLabel: "B2B",
    description: "Решение затрагивает разные роли, доступы, стимулы и действующие процессы.",
    validation: "Соберите кворум: Buyer, Admin, Team Lead и End User — хотя бы по одному представителю каждой критичной роли.",
    safeguards: [
      "Не усредняйте конфликтующие мотивы в одну нейроперсону.",
      "Фиксируйте права доступа, интеграции и существующие обходные процессы.",
      "Учитывайте вес влияния роли отдельно от частоты её работы.",
    ],
    requiredRoles: ["Buyer", "Admin", "Team Lead", "End User"],
    evidenceRule: "Добавьте внутренние ретроспективы, регламенты и тикеты прошлых внедрений.",
  },
  emotional: {
    id: "emotional",
    label: "Высокая эмоция и социальное давление",
    shortLabel: "Эмоция",
    description: "Сценарий с дефицитом времени, стыдом, тревогой, потерей лица или импульсивным действием.",
    validation: "Проверьте ситуацию на реальных людях до финализации Pain–Gain Map и не оценивайте её только через рациональные ответы.",
    safeguards: [
      "Добавьте в Canvas уровень стресса, давление среды и цену публичной ошибки.",
      "Ищите «молчаливый» уход и неформальные обсуждения, а не только тикеты.",
      "Проверяйте, не слишком ли рационально звучит нейроперсона.",
    ],
    requiredRoles: ["Пользователь в остром контексте", "Пользователь после неудачи"],
    evidenceRule: "Нужны источники, где пользователи описывают переживание своими словами.",
  },
  "high-stakes": {
    id: "high-stakes",
    label: "Высокая цена ошибки",
    shortLabel: "Риск",
    description: "Финансы, здоровье, безопасность или другой домен, где неверное решение может заметно навредить человеку.",
    validation: "Не переходите к решению до экспертной проверки и расширенной валидации на реальных участниках.",
    safeguards: [
      "Нейроперсона здесь — только инструмент для вопросов и гипотез, а не источник рекомендаций.",
      "Добавьте в Canvas цену ошибки, ограничения и обязательные правила безопасности.",
      "Не используйте синтетические оценки для Opportunity Score как единственное основание решения.",
      "Зафиксируйте эксперта, который отвечает за safety gate.",
    ],
    requiredRoles: ["Пользователь", "Профильный эксперт", "Владелец риска"],
    evidenceRule: "Требуются первичные данные, экспертная проверка и явный safety gate.",
  },
};

export type ReadinessInput = {
  decision: string;
  hasEvidence: boolean;
  hasContext: boolean;
  hasValidationPlan: boolean;
  hasRoleCoverage: boolean;
};

export function getReadinessScore(input: ReadinessInput) {
  const flags = [
    Boolean(input.decision.trim()),
    input.hasEvidence,
    input.hasContext,
    input.hasValidationPlan,
    input.hasRoleCoverage,
  ];
  return flags.filter(Boolean).length;
}

export function isReadyToSimulate(domain: ResearchDomain, input: ReadinessInput) {
  const baseReady = Boolean(input.decision.trim()) && input.hasEvidence && input.hasContext;
  if (domain === "b2b" || domain === "high-stakes") return baseReady && input.hasRoleCoverage;
  return baseReady;
}

export function getConfidenceLabel(score: number) {
  if (score >= 5) return "Готово к полевой проверке";
  if (score >= 3) return "Есть основа — заполните пробелы";
  return "Сначала соберите опору";
}
