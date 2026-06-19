import { runSimulation } from "../engine/runSimulation";
import type {
  CounterfactualBandPoint,
  CounterfactualDeltaPoint,
  CounterfactualExperimentResult,
  ScenarioConfig,
  SimulationPoint,
  SimulationResult
} from "../schema/scenario";

interface RateHikeExperimentOptions {
  readonly experimentName?: string;
  readonly treatmentShockBps?: number;
  readonly treatmentStartPeriod?: number;
  readonly treatmentDurationPeriods?: number;
  readonly seeds?: readonly number[];
}

export function runRateHikeExperiment(
  baseConfig: ScenarioConfig,
  options: RateHikeExperimentOptions = {}
): CounterfactualExperimentResult {
  const treatmentShockBps = options.treatmentShockBps ?? baseConfig.treatmentShockBps ?? 100;
  const treatmentStartPeriod = options.treatmentStartPeriod ?? baseConfig.treatmentStartPeriod ?? 3;
  const treatmentDurationPeriods = options.treatmentDurationPeriods ?? baseConfig.treatmentDurationPeriods ?? 12;
  const seeds = normalizeSeeds(options.seeds ?? [baseConfig.seed]);
  const pairedDeltas: CounterfactualDeltaPoint[][] = [];
  let primaryBaseline: SimulationResult | undefined;
  let primaryTreatment: SimulationResult | undefined;

  for (const seed of seeds) {
    const baselineConfig = createExperimentScenario(
      baseConfig,
      seed,
      `${baseConfig.scenarioName}_baseline`,
      0,
      treatmentStartPeriod,
      treatmentDurationPeriods
    );
    const treatmentConfig = createExperimentScenario(
      baseConfig,
      seed,
      `${baseConfig.scenarioName}_plus_${treatmentShockBps}bps`,
      treatmentShockBps,
      treatmentStartPeriod,
      treatmentDurationPeriods
    );
    const baseline = runSimulation(baselineConfig);
    const treatment = runSimulation(treatmentConfig);
    if (!primaryBaseline || !primaryTreatment) {
      primaryBaseline = baseline;
      primaryTreatment = treatment;
    }
    pairedDeltas.push(computeDeltas(baseline.path, treatment.path));
  }

  const baseline = requireResult(primaryBaseline, "baseline");
  const treatment = requireResult(primaryTreatment, "treatment");
  const deltas = pairedDeltas[0] ?? [];
  const bands = computeBands(pairedDeltas);

  return {
    metadata: {
      experimentName: options.experimentName ?? `paired_${treatmentShockBps}bps_rate_hike`,
      modelVersion: baseConfig.modelVersion,
      economyContext: baseConfig.economyContext,
      treatmentShockBps,
      treatmentStartPeriod,
      treatmentDurationPeriods,
      seeds,
      pairedSeedPolicy: "baseline and treatment reuse identical seeds; only the policy-rate shock differs",
      baselineParameterHash: baseline.metadata.parameterHash,
      treatmentParameterHash: treatment.metadata.parameterHash
    },
    baseline,
    treatment,
    deltas,
    bands,
    summary: summarizeExperiment(deltas, bands, seeds.length)
  };
}

function createExperimentScenario(
  config: ScenarioConfig,
  seed: number,
  scenarioName: string,
  treatmentShockBps: number,
  treatmentStartPeriod: number,
  treatmentDurationPeriods: number
): ScenarioConfig {
  return {
    ...config,
    scenarioName,
    seed,
    treatmentShockBps,
    treatmentStartPeriod,
    treatmentDurationPeriods
  };
}

function computeDeltas(
  baselinePath: readonly SimulationPoint[],
  treatmentPath: readonly SimulationPoint[]
): CounterfactualDeltaPoint[] {
  const length = Math.min(baselinePath.length, treatmentPath.length);
  const deltas: CounterfactualDeltaPoint[] = [];
  for (let index = 0; index < length; index += 1) {
    const baseline = baselinePath[index];
    const treatment = treatmentPath[index];
    deltas.push({
      period: treatment.period,
      inflationDeltaPp: (treatment.inflationAnnualized - baseline.inflationAnnualized) * 100,
      outputDeltaIndex: treatment.outputIndex - baseline.outputIndex,
      unemploymentDeltaPp: (treatment.unemploymentRate - baseline.unemploymentRate) * 100,
      consumptionDeltaIndex: treatment.consumptionIndex - baseline.consumptionIndex,
      mortgageRateDeltaPp: (treatment.mortgageRateAnnual - baseline.mortgageRateAnnual) * 100,
      housingPriceDeltaIndex: treatment.housingPriceIndex - baseline.housingPriceIndex,
      equityPriceDeltaIndex: treatment.equityPriceIndex - baseline.equityPriceIndex,
      bankCreditTightnessDeltaPp: (treatment.bankCreditTightness - baseline.bankCreditTightness) * 100
    });
  }
  return deltas;
}

function computeBands(pairedDeltas: readonly CounterfactualDeltaPoint[][]): CounterfactualBandPoint[] {
  const length = Math.min(...pairedDeltas.map((path) => path.length));
  const bands: CounterfactualBandPoint[] = [];
  for (let period = 0; period < length; period += 1) {
    const periodDeltas = pairedDeltas.map((path) => path[period]);
    const inflation = summarizeValues(periodDeltas.map((point) => point.inflationDeltaPp));
    const output = summarizeValues(periodDeltas.map((point) => point.outputDeltaIndex));
    const unemployment = summarizeValues(periodDeltas.map((point) => point.unemploymentDeltaPp));
    const housing = summarizeValues(periodDeltas.map((point) => point.housingPriceDeltaIndex));
    bands.push({
      period: periodDeltas[0].period,
      inflationDeltaPpMean: inflation.mean,
      inflationDeltaPpLow: inflation.low,
      inflationDeltaPpHigh: inflation.high,
      outputDeltaIndexMean: output.mean,
      outputDeltaIndexLow: output.low,
      outputDeltaIndexHigh: output.high,
      unemploymentDeltaPpMean: unemployment.mean,
      unemploymentDeltaPpLow: unemployment.low,
      unemploymentDeltaPpHigh: unemployment.high,
      housingPriceDeltaIndexMean: housing.mean,
      housingPriceDeltaIndexLow: housing.low,
      housingPriceDeltaIndexHigh: housing.high
    });
  }
  return bands;
}

function summarizeExperiment(
  deltas: readonly CounterfactualDeltaPoint[],
  bands: readonly CounterfactualBandPoint[],
  seedCount: number
): CounterfactualExperimentResult["summary"] {
  const finalPoint = bands[bands.length - 1];
  const finalDelta = deltas[deltas.length - 1];
  return {
    seedCount,
    peakInflationDeltaPp: Math.max(...bands.map((point) => point.inflationDeltaPpMean)),
    troughOutputDeltaIndex: Math.min(...bands.map((point) => point.outputDeltaIndexMean)),
    peakUnemploymentDeltaPp: Math.max(...bands.map((point) => point.unemploymentDeltaPpMean)),
    finalConsumptionDeltaIndex: finalDelta?.consumptionDeltaIndex ?? 0,
    finalHousingPriceDeltaIndex: finalPoint?.housingPriceDeltaIndexMean ?? 0,
    finalEquityPriceDeltaIndex: finalDelta?.equityPriceDeltaIndex ?? 0,
    finalBankCreditTightnessDeltaPp: finalDelta?.bankCreditTightnessDeltaPp ?? 0
  };
}

function summarizeValues(values: readonly number[]): { mean: number; low: number; high: number } {
  const mean = values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
  return {
    mean,
    low: Math.min(...values),
    high: Math.max(...values)
  };
}

function normalizeSeeds(seeds: readonly number[]): readonly number[] {
  const unique = [...new Set(seeds.map((seed) => Math.trunc(seed)).filter((seed) => Number.isFinite(seed)))];
  return unique.length > 0 ? unique : [1];
}

function requireResult(result: SimulationResult | undefined, label: string): SimulationResult {
  if (!result) {
    throw new Error(`Counterfactual experiment did not produce a ${label} result.`);
  }
  return result;
}
