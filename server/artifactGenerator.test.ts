import { describe, expect, it } from "vitest";
import { parseGeneratedArtifacts } from "./artifactGenerator";

const validDraft = {
  title: "Разбор SLA перед еженедельным review",
  contextCanvas: [
    { label: "Кто", value: "Руководитель поддержки", basis: "Из описания пользователя" },
    { label: "Когда", value: "Перед еженедельным разбором", basis: "Из описания пользователя" },
    { label: "Где", value: "В дашборде и Slack", basis: "Из описания пользователя" },
    { label: "Зачем", value: "Объяснить отклонение и договориться о действии", basis: "Из описания пользователя" },
    { label: "Как сейчас", value: "Сверяет отчёты и уточняет детали у команды", basis: "Гипотеза" },
  ],
  jobChain: [
    { step: "01", type: "Основная", label: "Увидеть отклонение SLA", outcome: "Понять масштаб сбоя", basis: "Гипотеза" },
    { step: "02", type: "Налоговая", label: "Сверить источники", outcome: "Не спорить о цифрах на встрече", basis: "Гипотеза" },
    { step: "03", type: "Основная", label: "Локализовать причину", outcome: "Назвать фактор отклонения", basis: "Гипотеза" },
    { step: "04", type: "Основная", label: "Зафиксировать действие", outcome: "Выйти со сроком и владельцем", basis: "Гипотеза" },
  ],
  hypotheses: ["Команда тратит время на сверку метрик", "Контекст инцидента теряется между системами"],
  validationSteps: ["Провести интервью с руководителями поддержки", "Сопоставить путь с логами использования"],
};

describe("parseGeneratedArtifacts", () => {
  it("accepts a complete hypothesis-marked Canvas and Job Chain draft", () => {
    const result = parseGeneratedArtifacts(JSON.stringify(validDraft));

    expect(result.contextCanvas).toHaveLength(5);
    expect(result.jobChain).toHaveLength(4);
    expect(result.jobChain.every((step) => step.basis === "Гипотеза")).toBe(true);
  });

  it("accepts the text-content array format returned by the model gateway", () => {
    const result = parseGeneratedArtifacts([
      { type: "output_text", text: JSON.stringify(validDraft) },
    ]);

    expect(result.title).toBe(validDraft.title);
  });

  it("normalizes the model's snake_case artifact format into the application contract", () => {
    const result = parseGeneratedArtifacts(JSON.stringify({
      context_canvas: validDraft.contextCanvas.map((item) => ({ field: item.label, value: item.value, basis: item.basis })),
      job_chain: validDraft.jobChain.map((item, index) => ({ step_number: index + 1, step_type: item.type, description: item.label, outcome: item.outcome })),
      key_hypotheses: validDraft.hypotheses,
      validation_actions: validDraft.validationSteps,
    }));

    expect(result.contextCanvas[0]).toMatchObject({ label: "Кто", basis: "Из описания пользователя" });
    expect(result.jobChain[0]).toMatchObject({ step: "01", label: "Увидеть отклонение SLA", basis: "Гипотеза" });
    expect(result.validationSteps).toEqual(validDraft.validationSteps);
  });

  it("rejects unstructured output rather than presenting it as research evidence", () => {
    expect(() => parseGeneratedArtifacts("Черновик без структуры")).toThrow("Не удалось сформировать структурированный черновик");
  });
});
