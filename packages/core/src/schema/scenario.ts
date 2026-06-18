export type EconomyContext = "Norway" | "EU_Euro_area" | "Norway_EU_comparison" | "stylized";

export interface ScenarioConfig {
  readonly scenarioName: string;
  readonly modelVersion: string;
  readonly economyContext: EconomyContext;
  readonly households: number;
  readonly firms: number;
  readonly banks: number;
  readonly sectors: number;
  readonly periods: number;
  readonly seed: number;
  readonly policyRateAnnual: number;
  readonly treatmentShockBps?: number;
}

export interface SimulationMetadata {
  readonly modelVersion: string;
  readonly scenarioName: string;
  readonly economyContext: EconomyContext;
  readonly parameterHash: string;
  readonly seedPolicy: string;
  readonly scale: {
    readonly households: number;
    readonly firms: number;
    readonly banks: number;
    readonly sectors: number;
    readonly periods: number;
  };
  readonly generatedAt: string;
}

export interface SimulationPoint {
  readonly period: number;
  readonly inflationAnnualized: number;
  readonly outputIndex: number;
  readonly unemploymentRate: number;
  readonly vacancyRate: number;
  readonly layoffRate: number;
  readonly bankruptcies: number;
  readonly creditGrowthAnnualized: number;
  readonly supplyChainStress: number;
}

export interface SimulationResult {
  readonly metadata: SimulationMetadata;
  readonly path: readonly SimulationPoint[];
  readonly diagnostics: {
    readonly employerWorkerConsistent: boolean;
    readonly payrollConsistent: boolean;
    readonly accountingChecksPassed: boolean;
  };
}

export const firstStructuralDemoConfig: ScenarioConfig = {
  scenarioName: "first_structural_demo",
  modelVersion: "0.1.0",
  economyContext: "Norway",
  households: 10_000,
  firms: 300,
  banks: 10,
  sectors: 12,
  periods: 96,
  seed: 20_260_618,
  policyRateAnnual: 0.04,
  treatmentShockBps: 100
};

