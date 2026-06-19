import { describe, expect, it } from "vitest";
import {
  checkEmployerWorkerConsistency,
  researchScaleMilestoneConfig,
  firstStructuralDemoConfig,
  runRateHikeExperiment,
  runSimulation
} from "../src";

describe("runSimulation milestone 5", () => {
  it("is deterministic for a fixed seed", () => {
    const first = runSimulation(firstStructuralDemoConfig);
    const second = runSimulation(firstStructuralDemoConfig);

    expect(second).toEqual(first);
  });

  it("records required metadata and accounting diagnostics", () => {
    const result = runSimulation(firstStructuralDemoConfig);

    expect(result.metadata.scenarioName).toBe("milestone_5_browser_100k");
    expect(result.metadata.economyContext).toBe("Norway");
    expect(result.metadata.scale.households).toBe(100_000);
    expect(result.metadata.scale.supplierEdges).toBe(5_000);
    expect(result.sectors).toHaveLength(firstStructuralDemoConfig.sectors);
    expect(result.network.supplierEdges).toBe(5_000);
    expect(result.network.deliveryAttempts).toBeGreaterThan(0);
    expect(result.network.deliveryFailureRate).toBeGreaterThanOrEqual(0);
    expect(result.network.supplierRewireShare).toBeGreaterThanOrEqual(0);
    expect(result.assets.housingPriceIndex).toBeGreaterThan(0);
    expect(result.assets.equityPriceIndex).toBeGreaterThan(0);
    expect(result.assets.constructionOutputIndex).toBeGreaterThan(0);
    expect(result.assets.variableMortgageShare).toBeGreaterThan(0.84);
    expect(result.assets.variableMortgageShare).toBeLessThan(0.93);
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
    expect(result.path[0].mortgageRateAnnual).toBeGreaterThan(result.path[0].policyRateAnnual);
    expect(result.path[0].housingPriceIndex).toBeGreaterThan(0);
    expect(result.path[0].equityPriceIndex).toBeGreaterThan(0);
    expect(result.path[0].constructionOutputIndex).toBeGreaterThan(0);
    expect(result.path[0].householdNetWorthIndex).toBeGreaterThan(0);
    expect(result.path[0].riskyAssetShare).toBeGreaterThanOrEqual(0);
    expect(result.path[0].bankCreditTightness).toBeGreaterThanOrEqual(0);
    expect(result.path[0].backlogIndex).toBeGreaterThanOrEqual(0);
    expect(result.path[0].deliveryFailureRate).toBeGreaterThanOrEqual(0);
    expect(result.path[0].inputInventoryIndex).toBeGreaterThan(0);
    expect(result.summary.firmsWithWorkers).toBeGreaterThan(0);
    expect(result.summary.finalBacklogIndex).toBeGreaterThanOrEqual(0);
    expect(result.summary.finalInputInventoryIndex).toBeGreaterThan(0);
    expect(result.summary.finalHousingPriceIndex).toBeGreaterThan(0);
    expect(result.summary.finalEquityPriceIndex).toBeGreaterThan(0);
    expect(result.summary.finalConstructionOutputIndex).toBeGreaterThan(0);
    expect(result.summary.finalMortgageDebtServiceRatio).toBeGreaterThanOrEqual(0);
    expect(result.summary.finalHouseholdNetWorthIndex).toBeGreaterThan(0);
    expect(result.summary.finalBankCreditTightness).toBeGreaterThanOrEqual(0);
    expect(result.summary.finalRuleMix.handToMouth).toBeGreaterThanOrEqual(0);
    expect(result.summary.finalRuleMix.debtStress).toBeGreaterThanOrEqual(0);
    expect(result.sectors.some((sector) => sector.deliveryFailureRate > 0)).toBe(true);
    expect(result.sectors.every((sector) => Number.isFinite(sector.outputIndex))).toBe(true);
  });

  it("runs a paired-seed rate-hike counterfactual with uncertainty bands", () => {
    const smallConfig = {
      ...firstStructuralDemoConfig,
      scenarioName: "test_counterfactual_small",
      households: 5_000,
      firms: 100,
      banks: 5,
      sectors: 10,
      periods: 24,
      supplierEdgesPerFirm: 3,
      seed: 42
    };
    const experiment = runRateHikeExperiment(smallConfig, {
      treatmentShockBps: 100,
      seeds: [42, 43]
    });

    expect(experiment.metadata.treatmentShockBps).toBe(100);
    expect(experiment.metadata.seeds).toEqual([42, 43]);
    expect(experiment.baseline.path).toHaveLength(24);
    expect(experiment.treatment.path).toHaveLength(24);
    expect(experiment.deltas).toHaveLength(24);
    expect(experiment.bands).toHaveLength(24);
    expect(experiment.summary.seedCount).toBe(2);
    expect(experiment.bands[0].inflationDeltaPpMean).toEqual(expect.any(Number));
    expect(experiment.summary.peakUnemploymentDeltaPp).toEqual(expect.any(Number));
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
