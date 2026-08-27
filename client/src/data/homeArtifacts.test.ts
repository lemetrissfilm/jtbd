import { describe, expect, it } from "vitest";
import { HOME_CONTEXT_CANVAS, HOME_JOB_CHAIN } from "./homeArtifacts";

describe("Home methodology artifacts", () => {
  it("contains a complete five-field Context Canvas", () => {
    expect(HOME_CONTEXT_CANVAS.map((item) => item.label)).toEqual([
      "Кто",
      "Когда",
      "Где",
      "Зачем",
      "Как сейчас",
    ]);
  });

  it("shows both core and tax jobs in the Job Chain example", () => {
    expect(HOME_JOB_CHAIN).toHaveLength(5);
    expect(HOME_JOB_CHAIN.some((item) => item.type === "Основная")).toBe(true);
    expect(HOME_JOB_CHAIN.some((item) => item.type === "Налоговая")).toBe(true);
  });
});
