import {
  checkEmployerWorkerConsistency,
  checkPayrollConsistency,
  computeFirmWorkerCounts
} from "../accounting/invariants";
import { createSeededRng } from "../random/seededRng";
import type { ScenarioConfig, SimulationPoint, SimulationResult } from "../schema/scenario";

export function runSimulation(config: ScenarioConfig): SimulationResult {
  validateScenarioConfig(config);

  const rng = createSeededRng(config.seed);
  const employerId = new Int32Array(config.households);
  const wage = new Float64Array(config.households);
  const hours = new Float64Array(config.households);

  for (let h = 0; h < config.households; h += 1) {
    const employed = rng.nextFloat() > 0.06;
    employerId[h] = employed ? Math.floor(rng.nextFloat() * config.firms) : -1;
    wage[h] = 45 + 35 * rng.nextFloat();
    hours[h] = employed ? 1 : 0;
  }

  const firmWorkerCount = computeFirmWorkerCounts(employerId, config.firms);
  const firmWageBill = new Float64Array(config.firms);
  for (let h = 0; h < config.households; h += 1) {
    const employer = employerId[h];
    if (employer >= 0) {
      firmWageBill[employer] += wage[h] * hours[h];
    }
  }

  const monthlyShock = (config.treatmentShockBps ?? 0) / 10_000 / 12;
  const baseMonthlyRate = config.policyRateAnnual / 12;
  const path: SimulationPoint[] = [];

  let outputIndex = 100;
  let unemploymentRate = 0.06;
  let supplyChainStress = 0.12;

  for (let period = 0; period < config.periods; period += 1) {
    const policyPulse = period >= 3 && period < 15 ? monthlyShock : 0;
    const demandDrag = policyPulse * 18;
    const costPassThrough = policyPulse * 7;
    const noise = (rng.nextFloat() - 0.5) * 0.002;

    outputIndex *= 1 - demandDrag + noise;
    unemploymentRate = clamp(unemploymentRate + demandDrag * 0.45 + Math.abs(noise) * 0.2, 0, 0.35);
    supplyChainStress = clamp(supplyChainStress + costPassThrough * 1.6 - demandDrag * 0.5 + noise, 0, 1);

    path.push({
      period,
      inflationAnnualized: 0.025 + costPassThrough * 12 - demandDrag * 8 + noise * 4,
      outputIndex,
      unemploymentRate,
      vacancyRate: clamp(0.025 - demandDrag * 0.5 + noise, 0, 0.2),
      layoffRate: clamp(0.01 + demandDrag * 0.8, 0, 0.2),
      bankruptcies: Math.round(config.firms * clamp(0.002 + supplyChainStress * 0.01, 0, 0.08)),
      creditGrowthAnnualized: (baseMonthlyRate + policyPulse) * -1.8 + noise,
      supplyChainStress
    });
  }

  const employerWorkerConsistent = checkEmployerWorkerConsistency({ employerId, firmWorkerCount });
  const payrollConsistent = checkPayrollConsistency({ employerId, wage, hours, firmWageBill });

  return {
    metadata: {
      modelVersion: config.modelVersion,
      scenarioName: config.scenarioName,
      economyContext: config.economyContext,
      parameterHash: stableParameterHash(config),
      seedPolicy: `master_seed:${config.seed};rng:xorshift32_placeholder`,
      scale: {
        households: config.households,
        firms: config.firms,
        banks: config.banks,
        sectors: config.sectors,
        periods: config.periods
      },
      generatedAt: "deterministic-scaffold"
    },
    path,
    diagnostics: {
      employerWorkerConsistent,
      payrollConsistent,
      accountingChecksPassed: employerWorkerConsistent && payrollConsistent
    }
  };
}

function validateScenarioConfig(config: ScenarioConfig): void {
  if (config.households <= 0 || config.firms <= 0 || config.banks <= 0 || config.sectors <= 0) {
    throw new Error("Scenario scale must be positive.");
  }
  if (config.periods <= 0) {
    throw new Error("Scenario periods must be positive.");
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function stableParameterHash(config: ScenarioConfig): string {
  const serialized = JSON.stringify(config, Object.keys(config).sort());
  let hash = 0x811c9dc5;
  for (let i = 0; i < serialized.length; i += 1) {
    hash ^= serialized.charCodeAt(i);
    hash = Math.imul(hash, 16_777_619) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

