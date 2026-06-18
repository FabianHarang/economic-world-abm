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
  readonly treatmentStartPeriod?: number;
  readonly treatmentDurationPeriods?: number;
  readonly initialUnemploymentRate?: number;
  readonly supplierEdgesPerFirm?: number;
  readonly firingFriction?: number;
  readonly costChannelStrength?: number;
  readonly inventoryBufferMonths?: number;
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
    readonly supplierEdges: number;
  };
  readonly generatedAt: string;
}

export interface SimulationPoint {
  readonly period: number;
  readonly policyRateAnnual: number;
  readonly loanRateAnnual: number;
  readonly cpi: number;
  readonly inflationAnnualized: number;
  readonly producerPriceInflationAnnualized: number;
  readonly outputIndex: number;
  readonly employedHouseholds: number;
  readonly unemploymentRate: number;
  readonly vacancyRate: number;
  readonly layoffRate: number;
  readonly hires: number;
  readonly layoffs: number;
  readonly bankruptcies: number;
  readonly creditGrowthAnnualized: number;
  readonly supplyChainStress: number;
  readonly averageFirmPrice: number;
  readonly sectorPriceDispersion: number;
}

export interface SimulationResult {
  readonly metadata: SimulationMetadata;
  readonly path: readonly SimulationPoint[];
  readonly diagnostics: {
    readonly employerWorkerConsistent: boolean;
    readonly payrollConsistent: boolean;
    readonly supplierNetworkConsistent: boolean;
    readonly priceIndexConsistent: boolean;
    readonly accountingChecksPassed: boolean;
  };
  readonly summary: {
    readonly firmsWithWorkers: number;
    readonly supplierEdges: number;
    readonly finalInflationAnnualized: number;
    readonly finalUnemploymentRate: number;
    readonly finalOutputIndex: number;
    readonly finalSupplyChainStress: number;
  };
}

export const firstStructuralDemoConfig: ScenarioConfig = {
  scenarioName: "milestone_1_browser_100k",
  modelVersion: "0.2.0",
  economyContext: "Norway",
  households: 100_000,
  firms: 1_000,
  banks: 25,
  sectors: 20,
  periods: 96,
  seed: 20_260_618,
  policyRateAnnual: 0.04,
  treatmentShockBps: 100,
  treatmentStartPeriod: 3,
  treatmentDurationPeriods: 12,
  initialUnemploymentRate: 0.06,
  supplierEdgesPerFirm: 5,
  firingFriction: 0.45,
  costChannelStrength: 0.35,
  inventoryBufferMonths: 1.5
};

export const researchScaleMilestoneConfig: ScenarioConfig = {
  ...firstStructuralDemoConfig,
  scenarioName: "research_scale_1m_target",
  households: 1_000_000,
  firms: 5_000,
  banks: 25,
  sectors: 25,
  supplierEdgesPerFirm: 6,
  seed: 12_345
};
