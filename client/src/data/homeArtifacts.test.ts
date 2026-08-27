import { describe, expect, it } from "vitest";
import { HOME_ARTIFACT_CASES } from "./homeArtifacts";

describe("Home methodology artifacts", () => {
  it("contains a complete five-field Context Canvas for each scenario", () => {
    Object.values(HOME_ARTIFACT_CASES).forEach((artifactCase) => {
      expect(artifactCase.canvas.map((item) => item.label)).toEqual([
        "Кто",
        "Когда",
        "Где",
        "Зачем",
        "Как сейчас",
      ]);
    });
  });

  it("shows B2C and B2B examples with both core and tax jobs", () => {
    expect(HOME_ARTIFACT_CASES.b2c.title).toContain("кассе");
    expect(HOME_ARTIFACT_CASES.b2b.label).toContain("B2B SaaS");

    Object.values(HOME_ARTIFACT_CASES).forEach((artifactCase) => {
      expect(artifactCase.jobChain).toHaveLength(5);
      expect(artifactCase.jobChain.some((item) => item.type === "Основная")).toBe(true);
      expect(artifactCase.jobChain.some((item) => item.type === "Налоговая")).toBe(true);
    });
  });
});
