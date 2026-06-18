import { describe, expect, it } from "vitest";
import {
  checkEmployerWorkerConsistency,
  researchScaleMilestoneConfig,
  firstStructuralDemoConfig,
  runSimulation
} from "../src";

describe("runSimulation milestone 1", () => {
  it("is deterministic for a fixed seed", () => {
    const first = runSimulation(firstStructuralDemoConfig);
    const second = runSimulation(firstStructuralDemoConfig);

    expect(second).toEqual(first);
  });

  it("records required metadata and accounting diagnostics", () => {
    const result = runSimulation(firstStructuralDemoConfig);

    expect(result.metadata.scenarioName).toBe("milestone_1_browser_100k");
    expect(result.metadata.economyContext).toBe("Norway");
    expect(result.metadata.scale.households).toBe(100_000);
    expect(result.metadata.scale.supplierEdges).toBe(5_000);
    expect(result.diagnostics.employerWorkerConsistent).toBe(true);
    expect(result.diagnostics.payrollConsistent).toBe(true);
    expect(result.diagnostics.supplierNetworkConsistent).toBe(true);
    expect(result.diagnostics.priceIndexConsistent).toBe(true);
    expect(result.diagnostics.accountingChecksPassed).toBe(true);
    expect(result.path[0].cpi).toBeGreaterThan(0);
    expect(result.summary.firmsWithWorkers).toBeGreaterThan(0);
  });

  it("keeps a million-household research target available without running it in the browser app", () => {
    expect(researchScaleMilestoneConfig.households).toBe(1_000_000);
    expect(researchScaleMilestoneConfig.firms).toBe(5_000);
  });

  it("detects employer-worker inconsistency", () => {
    const employerId = new Int32Array([0, 0, 1, -1]);
    const firmWorkerCount = new Int32Array([1, 1]);

    expect(checkEmployerWorkerConsistency({ employerId, firmWorkerCount })).toBe(false);
  });
});
