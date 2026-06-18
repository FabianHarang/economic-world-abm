import { describe, expect, it } from "vitest";
import {
  checkEmployerWorkerConsistency,
  firstStructuralDemoConfig,
  runSimulation
} from "../src";

describe("runSimulation scaffold", () => {
  it("is deterministic for a fixed seed", () => {
    const first = runSimulation(firstStructuralDemoConfig);
    const second = runSimulation(firstStructuralDemoConfig);

    expect(second).toEqual(first);
  });

  it("records required metadata and accounting diagnostics", () => {
    const result = runSimulation(firstStructuralDemoConfig);

    expect(result.metadata.scenarioName).toBe("first_structural_demo");
    expect(result.metadata.economyContext).toBe("Norway");
    expect(result.metadata.scale.households).toBe(10_000);
    expect(result.diagnostics.accountingChecksPassed).toBe(true);
  });

  it("detects employer-worker inconsistency", () => {
    const employerId = new Int32Array([0, 0, 1, -1]);
    const firmWorkerCount = new Int32Array([1, 1]);

    expect(checkEmployerWorkerConsistency({ employerId, firmWorkerCount })).toBe(false);
  });
});

