import { describe, expect, it } from "vitest";
import {
  checkEmployerWorkerConsistency,
  researchScaleMilestoneConfig,
  firstStructuralDemoConfig,
  runSimulation
} from "../src";

describe("runSimulation milestone 3", () => {
  it("is deterministic for a fixed seed", () => {
    const first = runSimulation(firstStructuralDemoConfig);
    const second = runSimulation(firstStructuralDemoConfig);

    expect(second).toEqual(first);
  });

  it("records required metadata and accounting diagnostics", () => {
    const result = runSimulation(firstStructuralDemoConfig);

    expect(result.metadata.scenarioName).toBe("milestone_3_browser_100k");
    expect(result.metadata.economyContext).toBe("Norway");
    expect(result.metadata.scale.households).toBe(100_000);
    expect(result.metadata.scale.supplierEdges).toBe(5_000);
    expect(result.sectors).toHaveLength(firstStructuralDemoConfig.sectors);
    expect(result.network.supplierEdges).toBe(5_000);
    expect(result.network.deliveryAttempts).toBeGreaterThan(0);
    expect(result.network.deliveryFailureRate).toBeGreaterThanOrEqual(0);
    expect(result.network.supplierRewireShare).toBeGreaterThanOrEqual(0);
    expect(result.diagnostics.employerWorkerConsistent).toBe(true);
    expect(result.diagnostics.payrollConsistent).toBe(true);
    expect(result.diagnostics.supplierNetworkConsistent).toBe(true);
    expect(result.diagnostics.priceIndexConsistent).toBe(true);
    expect(result.diagnostics.householdBudgetConsistent).toBe(true);
    expect(result.diagnostics.accountingChecksPassed).toBe(true);
    expect(result.path[0].cpi).toBeGreaterThan(0);
    expect(result.path[0].consumptionIndex).toBeGreaterThan(0);
    expect(result.path[0].averageInflationExpectation).toBeGreaterThan(-0.05);
    expect(result.path[0].wageGrowthAnnualized).toEqual(expect.any(Number));
    expect(result.path[0].backlogIndex).toBeGreaterThanOrEqual(0);
    expect(result.path[0].deliveryFailureRate).toBeGreaterThanOrEqual(0);
    expect(result.path[0].inputInventoryIndex).toBeGreaterThan(0);
    expect(result.summary.firmsWithWorkers).toBeGreaterThan(0);
    expect(result.summary.finalBacklogIndex).toBeGreaterThanOrEqual(0);
    expect(result.summary.finalInputInventoryIndex).toBeGreaterThan(0);
    expect(result.summary.finalRuleMix.handToMouth).toBeGreaterThanOrEqual(0);
    expect(result.summary.finalRuleMix.debtStress).toBeGreaterThanOrEqual(0);
    expect(result.sectors.some((sector) => sector.deliveryFailureRate > 0)).toBe(true);
    expect(result.sectors.every((sector) => Number.isFinite(sector.outputIndex))).toBe(true);
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
