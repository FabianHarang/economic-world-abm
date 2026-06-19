export type EconomyContext = "Norway" | "EU_Euro_area" | "Norway_EU_comparison" | "stylized";

export interface HouseholdRuleMix {
  readonly handToMouth: number;
  readonly liquidityBuffer: number;
  readonly habit: number;
  readonly debtStress: number;
}

export interface ExpectationRuleMix {
  readonly adaptive: number;
  readonly anchored: number;
  readonly extrapolative: number;
  readonly employerSector: number;
}

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
  readonly matchingFriction?: number;
  readonly wageIndexation?: number;
  readonly costChannelStrength?: number;
  readonly inventoryBufferMonths?: number;
  readonly inputInventoryTargetMonths?: number;
  readonly deliveryFailureSensitivity?: number;
  readonly supplierRewireRate?: number;
  readonly inputSubstitutionElasticity?: number;
  readonly householdRuleMix?: HouseholdRuleMix;
  readonly expectationRuleMix?: ExpectationRuleMix;
  readonly ruleSwitchingIntensity?: number;
  readonly centralBankCredibility?: number;
  readonly targetInflationAnnual?: number;
  readonly debtServiceSensitivity?: number;
  readonly variableMortgageShare?: number;
  readonly mortgageSpreadBps?: number;
  readonly fixedMortgageRepricingSpeed?: number;
  readonly housingSupplyElasticity?: number;
  readonly constructionDemandSensitivity?: number;
  readonly wealthEffectStrength?: number;
  readonly collateralEffectStrength?: number;
  readonly equityRiskPremium?: number;
  readonly portfolioRebalanceSpeed?: number;
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
  readonly mortgageCreditGrowthAnnualized: number;
  readonly mortgageRateAnnual: number;
  readonly variableMortgageShare: number;
  readonly housingPriceIndex: number;
  readonly housingPriceGrowthAnnualized: number;
  readonly constructionOutputIndex: number;
  readonly equityPriceIndex: number;
  readonly equityReturnAnnualized: number;
  readonly householdNetWorthIndex: number;
  readonly mortgageDebtServiceRatio: number;
  readonly collateralConstraintIndex: number;
  readonly riskyAssetShare: number;
  readonly bankCreditTightness: number;
  readonly supplyChainStress: number;
  readonly backlogIndex: number;
  readonly deliveryFailureRate: number;
  readonly supplierRewireShare: number;
  readonly inputInventoryIndex: number;
  readonly averageFirmPrice: number;
  readonly sectorPriceDispersion: number;
  readonly consumptionIndex: number;
  readonly averageInflationExpectation: number;
  readonly wageGrowthAnnualized: number;
  readonly householdDepositsIndex: number;
  readonly householdDebtServiceRatio: number;
  readonly handToMouthShare: number;
  readonly liquidityBufferShare: number;
  readonly habitShare: number;
  readonly debtStressShare: number;
}

export interface SectorSummary {
  readonly sectorId: number;
  readonly stageId: number;
  readonly firms: number;
  readonly priceIndex: number;
  readonly outputIndex: number;
  readonly inputCostIndex: number;
  readonly inputInventoryIndex: number;
  readonly backlogIndex: number;
  readonly deliveryFailureRate: number;
}

export interface NetworkSummary {
  readonly supplierEdges: number;
  readonly deliveryAttempts: number;
  readonly deliveryFailures: number;
  readonly rewiredEdges: number;
  readonly deliveryFailureRate: number;
  readonly supplierRewireShare: number;
  readonly backlogIndex: number;
  readonly inputInventoryIndex: number;
}

export interface AssetMarketSummary {
  readonly housingPriceIndex: number;
  readonly equityPriceIndex: number;
  readonly constructionOutputIndex: number;
  readonly mortgageRateAnnual: number;
  readonly mortgageDebtServiceRatio: number;
  readonly mortgageCreditGrowthAnnualized: number;
  readonly householdNetWorthIndex: number;
  readonly riskyAssetShare: number;
  readonly collateralConstraintIndex: number;
  readonly bankCreditTightness: number;
  readonly variableMortgageShare: number;
}

export interface CounterfactualDeltaPoint {
  readonly period: number;
  readonly inflationDeltaPp: number;
  readonly outputDeltaIndex: number;
  readonly unemploymentDeltaPp: number;
  readonly consumptionDeltaIndex: number;
  readonly mortgageRateDeltaPp: number;
  readonly housingPriceDeltaIndex: number;
  readonly equityPriceDeltaIndex: number;
  readonly bankCreditTightnessDeltaPp: number;
}

export interface CounterfactualBandPoint {
  readonly period: number;
  readonly inflationDeltaPpMean: number;
  readonly inflationDeltaPpLow: number;
  readonly inflationDeltaPpHigh: number;
  readonly outputDeltaIndexMean: number;
  readonly outputDeltaIndexLow: number;
  readonly outputDeltaIndexHigh: number;
  readonly unemploymentDeltaPpMean: number;
  readonly unemploymentDeltaPpLow: number;
  readonly unemploymentDeltaPpHigh: number;
  readonly housingPriceDeltaIndexMean: number;
  readonly housingPriceDeltaIndexLow: number;
  readonly housingPriceDeltaIndexHigh: number;
}

export interface CounterfactualExperimentResult {
  readonly metadata: {
    readonly experimentName: string;
    readonly modelVersion: string;
    readonly economyContext: EconomyContext;
    readonly treatmentShockBps: number;
    readonly treatmentStartPeriod: number;
    readonly treatmentDurationPeriods: number;
    readonly seeds: readonly number[];
    readonly pairedSeedPolicy: string;
    readonly baselineParameterHash: string;
    readonly treatmentParameterHash: string;
  };
  readonly baseline: SimulationResult;
  readonly treatment: SimulationResult;
  readonly deltas: readonly CounterfactualDeltaPoint[];
  readonly bands: readonly CounterfactualBandPoint[];
  readonly summary: {
    readonly seedCount: number;
    readonly peakInflationDeltaPp: number;
    readonly troughOutputDeltaIndex: number;
    readonly peakUnemploymentDeltaPp: number;
    readonly finalConsumptionDeltaIndex: number;
    readonly finalHousingPriceDeltaIndex: number;
    readonly finalEquityPriceDeltaIndex: number;
    readonly finalBankCreditTightnessDeltaPp: number;
  };
}

export interface SimulationResult {
  readonly metadata: SimulationMetadata;
  readonly path: readonly SimulationPoint[];
  readonly sectors: readonly SectorSummary[];
  readonly network: NetworkSummary;
  readonly assets: AssetMarketSummary;
  readonly diagnostics: {
    readonly employerWorkerConsistent: boolean;
    readonly payrollConsistent: boolean;
    readonly supplierNetworkConsistent: boolean;
    readonly priceIndexConsistent: boolean;
    readonly householdBudgetConsistent: boolean;
    readonly accountingChecksPassed: boolean;
  };
  readonly summary: {
    readonly firmsWithWorkers: number;
    readonly supplierEdges: number;
    readonly finalInflationAnnualized: number;
    readonly finalUnemploymentRate: number;
    readonly finalOutputIndex: number;
    readonly finalSupplyChainStress: number;
    readonly finalBacklogIndex: number;
    readonly finalDeliveryFailureRate: number;
    readonly finalInputInventoryIndex: number;
    readonly finalHousingPriceIndex: number;
    readonly finalEquityPriceIndex: number;
    readonly finalConstructionOutputIndex: number;
    readonly finalMortgageDebtServiceRatio: number;
    readonly finalHouseholdNetWorthIndex: number;
    readonly finalBankCreditTightness: number;
    readonly finalConsumptionIndex: number;
    readonly finalAverageInflationExpectation: number;
    readonly finalRuleMix: HouseholdRuleMix;
  };
}

export const firstStructuralDemoConfig: ScenarioConfig = {
  scenarioName: "milestone_5_browser_100k",
  modelVersion: "0.6.0",
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
  matchingFriction: 0.35,
  wageIndexation: 0.28,
  costChannelStrength: 0.35,
  inventoryBufferMonths: 1.5,
  inputInventoryTargetMonths: 1.6,
  deliveryFailureSensitivity: 0.42,
  supplierRewireRate: 0.16,
  inputSubstitutionElasticity: 0.22,
  householdRuleMix: {
    handToMouth: 0.35,
    liquidityBuffer: 0.3,
    habit: 0.2,
    debtStress: 0.15
  },
  expectationRuleMix: {
    adaptive: 0.48,
    anchored: 0.32,
    extrapolative: 0.1,
    employerSector: 0.1
  },
  ruleSwitchingIntensity: 0.18,
  centralBankCredibility: 0.55,
  targetInflationAnnual: 0.02,
  debtServiceSensitivity: 0.42,
  variableMortgageShare: 0.9,
  mortgageSpreadBps: 185,
  fixedMortgageRepricingSpeed: 0.08,
  housingSupplyElasticity: 0.28,
  constructionDemandSensitivity: 0.38,
  wealthEffectStrength: 0.16,
  collateralEffectStrength: 0.24,
  equityRiskPremium: 0.045,
  portfolioRebalanceSpeed: 0.18
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
