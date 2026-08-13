import { describe, expect, it } from "vitest";
import {
  DOMAIN_PROFILES,
  getConfidenceLabel,
  getReadinessScore,
  isReadyToSimulate,
} from "./researchWorkflow";

describe("research workflow guardrails", () => {
  const completeInput = {
    decision: "Понять, почему команда не завершает онбординг",
    hasEvidence: true,
    hasContext: true,
    hasValidationPlan: true,
    hasRoleCoverage: true,
  };

  it("requires role coverage for B2B and high-stakes simulations", () => {
    expect(isReadyToSimulate("b2b", { ...completeInput, hasRoleCoverage: false })).toBe(false);
    expect(isReadyToSimulate("high-stakes", { ...completeInput, hasRoleCoverage: false })).toBe(false);
    expect(isReadyToSimulate("consumer", { ...completeInput, hasRoleCoverage: false })).toBe(true);
  });

  it("calculates readiness from the five mandatory foundations", () => {
    expect(getReadinessScore(completeInput)).toBe(5);
    expect(getReadinessScore({ ...completeInput, decision: "", hasEvidence: false })).toBe(3);
    expect(getConfidenceLabel(5)).toBe("Готово к полевой проверке");
    expect(getConfidenceLabel(2)).toBe("Сначала соберите опору");
  });

  it("defines stronger safeguards for high-stakes research", () => {
    expect(DOMAIN_PROFILES["high-stakes"].safeguards.length).toBeGreaterThan(3);
    expect(DOMAIN_PROFILES.b2b.requiredRoles).toContain("Admin");
  });
});

