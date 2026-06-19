export interface StaticSiteArtifact {
  readonly schemaVersion: string;
  readonly artifactKind: string;
  readonly source: string;
  readonly scenarioName: string;
  readonly economyContext: string;
  readonly calibrationStatus: string;
  readonly parameterHash: string;
  readonly seedPolicy: string;
  readonly generatedAt: string;
  readonly diagnosticsPassed: boolean;
  readonly scale: {
    readonly households: number;
    readonly firms: number;
    readonly banks: number;
    readonly sectors: number;
    readonly periods: number;
    readonly supplierEdges: number;
  };
  readonly summary: {
    readonly cumulativeHires: number;
    readonly cumulativeLayoffs: number;
    readonly finalBankCreditTightness: number;
    readonly finalConsumptionIndex: number;
    readonly finalEquityPriceIndex: number;
    readonly finalHousingPriceIndex: number;
    readonly finalInflationAnnualized: number;
    readonly finalOutputIndex: number;
    readonly finalUnemploymentRate: number;
    readonly outputArtifactPolicy: string;
    readonly supplierEdges: number;
    readonly workerRepresentation: string;
  };
  readonly finalPeriod: {
    readonly period: number;
    readonly policyRateAnnual: number;
    readonly mortgageRateAnnual: number;
    readonly inflationAnnualized: number;
    readonly outputIndex: number;
    readonly unemploymentRate: number;
    readonly hires: number;
    readonly layoffs: number;
    readonly consumptionIndex: number;
    readonly housingPriceIndex: number;
    readonly equityPriceIndex: number;
    readonly bankCreditTightness: number;
    readonly supplyChainStress: number;
    readonly deliveryFailureRate: number;
    readonly backlogIndex: number;
    readonly inputInventoryIndex: number;
    readonly wageGrowthAnnualized: number;
  };
  readonly network: {
    readonly representation: string;
    readonly supplier_edges: number;
    readonly average_in_degree: number;
    readonly max_in_degree: number;
    readonly delivery_failure_rate: number;
    readonly supplier_rewire_share: number;
    readonly rewired_edges: number;
  };
  readonly sectorStressTop: readonly {
    readonly period: number;
    readonly sectorId: number;
    readonly firms: number;
    readonly stressScore: number;
    readonly outputIndex: number;
    readonly backlogIndex: number;
    readonly deliveryFailureRate: number;
  }[];
  readonly economyAssumptions: {
    readonly primary: string;
    readonly secondary: string;
    readonly mortgagePassThrough: string;
    readonly interpretation: string;
  };
  readonly artifactPolicy: {
    readonly rawMicrostateIncluded: boolean;
    readonly researchScaleRun: boolean;
    readonly committedPayload: string;
    readonly intendedUse: string;
    readonly limitations: readonly string[];
  };
}

export const milestone10StaticResults: StaticSiteArtifact = {
  artifactKind: "milestone_10_static_results",
  artifactPolicy: {
    committedPayload: "metadata_summary_final_period_network_and_ranked_sector_stress",
    intendedUse: "Static website display, reproducibility checks, and manuscript traceability.",
    limitations: [
      "This artifact is not a forecast and not policy advice.",
      "Smoke artifacts generated below one million households are computational checks, not final research results.",
      "Economic interpretation requires calibrated Norway-first moments, EU comparison runs, and paired-seed sensitivity analysis."
    ],
    rawMicrostateIncluded: false,
    researchScaleRun: false
  },
  calibrationStatus: "staged",
  diagnosticsPassed: true,
  economyAssumptions: {
    interpretation: "The artifact supports model-debugging and presentation until Norway/EU calibration and sensitivity runs are complete.",
    mortgagePassThrough: "Norway-first stylized assumption; variable-rate mortgage share is high and must be calibrated against official sources.",
    primary: "Norway",
    secondary: "EU / Euro area"
  },
  economyContext: "Norway",
  finalPeriod: {
    backlogIndex: 0,
    bankCreditTightness: 0.141695,
    consumptionIndex: 90.108167,
    deliveryFailureRate: 0.08510422,
    equityPriceIndex: 102.343532,
    hires: 0,
    housingPriceIndex: 97.397029,
    inflationAnnualized: 0.01972802,
    inputInventoryIndex: 230.219742,
    layoffs: 19,
    mortgageRateAnnual: 0.0585,
    outputIndex: 110.055097,
    period: 4,
    policyRateAnnual: 0.04,
    supplyChainStress: 0.07528668,
    unemploymentRate: 0.0585,
    wageGrowthAnnualized: 0.0271
  },
  generatedAt: "deterministic-milestone-10",
  network: {
    average_in_degree: 6,
    delivery_failure_rate: 0.08459749,
    max_in_degree: 6,
    representation: "compressed_sparse_row_by_buyer",
    rewired_edges: 0,
    supplier_edges: 360,
    supplier_rewire_share: 0
  },
  parameterHash: "4fd9c78eacb9a3dc",
  scale: {
    banks: 5,
    firms: 60,
    households: 2000,
    periods: 5,
    sectors: 6,
    supplierEdges: 360
  },
  scenarioName: "research_scale_baseline",
  schemaVersion: "0.11.0",
  sectorStressTop: [
    {
      backlogIndex: 0,
      deliveryFailureRate: 0.08510422,
      firms: 10,
      outputIndex: 92.000413,
      period: 4,
      sectorId: 1,
      stressScore: 0.16510009
    },
    {
      backlogIndex: 0,
      deliveryFailureRate: 0.08510422,
      firms: 10,
      outputIndex: 99.093275,
      period: 4,
      sectorId: 0,
      stressScore: 0.09417147
    },
    {
      backlogIndex: 0,
      deliveryFailureRate: 0.08510422,
      firms: 10,
      outputIndex: 111.343486,
      period: 4,
      sectorId: 2,
      stressScore: 0.08510422
    },
    {
      backlogIndex: 0,
      deliveryFailureRate: 0.08510422,
      firms: 10,
      outputIndex: 110.842326,
      period: 4,
      sectorId: 3,
      stressScore: 0.08510422
    },
    {
      backlogIndex: 0,
      deliveryFailureRate: 0.08510422,
      firms: 10,
      outputIndex: 118.363938,
      period: 4,
      sectorId: 4,
      stressScore: 0.08510422
    },
    {
      backlogIndex: 0,
      deliveryFailureRate: 0.08510422,
      firms: 10,
      outputIndex: 128.687143,
      period: 4,
      sectorId: 5,
      stressScore: 0.08510422
    }
  ],
  seedPolicy: "splitmix64_master_seed",
  source: "offline_research_engine",
  summary: {
    cumulativeHires: 82,
    cumulativeLayoffs: 79,
    finalBankCreditTightness: 0.141695,
    finalConsumptionIndex: 90.108167,
    finalEquityPriceIndex: 102.343532,
    finalHousingPriceIndex: 97.397029,
    finalInflationAnnualized: 0.01972802,
    finalOutputIndex: 110.055097,
    finalUnemploymentRate: 0.0585,
    outputArtifactPolicy: "aggregate_and_sector_jsonl_gzip_no_raw_microstate",
    supplierEdges: 360,
    workerRepresentation: "firm_counts_with_initial_household_assignment"
  }
};
