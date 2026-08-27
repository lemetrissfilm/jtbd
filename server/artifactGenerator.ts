import { z } from "zod";

const CanvasItemSchema = z.object({
  label: z.enum(["Кто", "Когда", "Где", "Зачем", "Как сейчас"]),
  value: z.string().min(3).max(300),
  basis: z.enum(["Из описания пользователя", "Гипотеза"]),
});

const JobStepSchema = z.object({
  step: z.string().regex(/^0?[1-9]$/),
  type: z.enum(["Основная", "Налоговая", "Лишняя"]),
  label: z.string().min(3).max(160),
  outcome: z.string().min(3).max(240),
  basis: z.literal("Гипотеза"),
});

export const GeneratedArtifactsSchema = z.object({
  title: z.string().min(3).max(160),
  contextCanvas: z.array(CanvasItemSchema).length(5),
  jobChain: z.array(JobStepSchema).min(4).max(7),
  hypotheses: z.array(z.string().min(5).max(280)).min(2).max(4),
  validationSteps: z.array(z.string().min(5).max(280)).min(2).max(4),
});

export type GeneratedArtifacts = z.infer<typeof GeneratedArtifactsSchema>;

export const GENERATED_ARTIFACTS_JSON_SCHEMA = {
  name: "synthetic_jtbd_artifacts",
  strict: true,
  schema: {
    type: "object",
    properties: {
      title: { type: "string" },
      contextCanvas: {
        type: "array",
        minItems: 5,
        maxItems: 5,
        items: {
          type: "object",
          properties: {
            label: { type: "string", enum: ["Кто", "Когда", "Где", "Зачем", "Как сейчас"] },
            value: { type: "string" },
            basis: { type: "string", enum: ["Из описания пользователя", "Гипотеза"] },
          },
          required: ["label", "value", "basis"],
          additionalProperties: false,
        },
      },
      jobChain: {
        type: "array",
        minItems: 4,
        maxItems: 7,
        items: {
          type: "object",
          properties: {
            step: { type: "string" },
            type: { type: "string", enum: ["Основная", "Налоговая", "Лишняя"] },
            label: { type: "string" },
            outcome: { type: "string" },
            basis: { type: "string", enum: ["Гипотеза"] },
          },
          required: ["step", "type", "label", "outcome", "basis"],
          additionalProperties: false,
        },
      },
      hypotheses: { type: "array", minItems: 2, maxItems: 4, items: { type: "string" } },
      validationSteps: { type: "array", minItems: 2, maxItems: 4, items: { type: "string" } },
    },
    required: ["title", "contextCanvas", "jobChain", "hypotheses", "validationSteps"],
    additionalProperties: false,
  },
} as const;

const asRecord = (value: unknown): Record<string, unknown> => (
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
);

const asString = (value: unknown) => typeof value === "string" ? value : "";

const asStringArray = (value: unknown) => (
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
);

function normalizeGeneratedArtifacts(value: unknown) {
  const draft = asRecord(value);
  const rawCanvas = Array.isArray(draft.contextCanvas) ? draft.contextCanvas : draft.context_canvas;
  const rawChain = Array.isArray(draft.jobChain) ? draft.jobChain : draft.job_chain;

  return {
    title: asString(draft.title) || "Черновик Synthetic JTBD",
    contextCanvas: Array.isArray(rawCanvas)
      ? rawCanvas.map((item) => {
          const field = asRecord(item);
          return {
            label: asString(field.label) || asString(field.field),
            value: asString(field.value),
            basis: asString(field.basis) || "Гипотеза",
          };
        })
      : [],
    jobChain: Array.isArray(rawChain)
      ? rawChain.map((item, index) => {
          const step = asRecord(item);
          const rawStep = step.step ?? step.step_number ?? index + 1;
          const stepNumber = typeof rawStep === "number" ? rawStep : Number(rawStep);
          return {
            step: Number.isFinite(stepNumber) ? String(stepNumber).padStart(2, "0") : String(index + 1).padStart(2, "0"),
            type: asString(step.type) || asString(step.step_type),
            label: asString(step.label) || asString(step.description),
            outcome: asString(step.outcome),
            basis: "Гипотеза",
          };
        })
      : [],
    hypotheses: asStringArray(draft.hypotheses).length > 0
      ? asStringArray(draft.hypotheses)
      : asStringArray(draft.key_hypotheses),
    validationSteps: asStringArray(draft.validationSteps).length > 0
      ? asStringArray(draft.validationSteps)
      : asStringArray(draft.validation_actions),
  };
}

export function parseGeneratedArtifacts(content: unknown): GeneratedArtifacts {
  const rawContent = typeof content === "string"
    ? content
    : Array.isArray(content)
      ? content
          .filter((part): part is { text: string } => (
            typeof part === "object" && part !== null &&
            "text" in part && typeof part.text === "string"
          ))
          .map((part) => part.text)
          .join("")
      : "";

  if (!rawContent) {
    throw new Error("Генератор не вернул текстовый ответ");
  }

  try {
    const normalizedContent = rawContent
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");
    return GeneratedArtifactsSchema.parse(normalizeGeneratedArtifacts(JSON.parse(normalizedContent)));
  } catch {
    throw new Error("Не удалось сформировать структурированный черновик. Попробуйте уточнить контекст.");
  }
}
