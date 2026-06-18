import {
  checkEmployerWorkerConsistency,
  checkPayrollConsistency,
  checkSupplierNetworkConsistency,
  computeFirmWorkerCounts
} from "../accounting/invariants";
import { createSeededRng } from "../random/seededRng";
import type { ScenarioConfig, SimulationPoint, SimulationResult } from "../schema/scenario";

interface SupplierNetwork {
  readonly supplierPtr: Int32Array;
  readonly supplierId: Int32Array;
  readonly buyerId: Int32Array;
  readonly contractWeight: Float32Array;
}

interface EconomyArrays {
  readonly employerId: Int32Array;
  readonly wage: Float64Array;
  readonly hours: Float64Array;
  readonly firmSector: Int16Array;
  readonly firmStage: Int8Array;
  readonly firmBank: Int16Array;
  readonly firmPrice: Float64Array;
  readonly firmProductivity: Float32Array;
  readonly firmCapital: Float64Array;
  readonly firmLabor: Int32Array;
  readonly firmBaseLabor: Int32Array;
  readonly firmWageBill: Float64Array;
  readonly firmOutput: Float64Array;
  readonly firmCash: Float64Array;
  readonly firmDebt: Float64Array;
  readonly firmInventory: Float64Array;
  readonly firmWorkingCapitalExposure: Float32Array;
  readonly firmPriceStickiness: Float32Array;
  readonly firmMarkup: Float32Array;
  readonly firmDefaulted: Uint8Array;
  readonly sectorWeights: Float64Array;
  readonly supplierNetwork: SupplierNetwork;
  readonly unemployedPool: number[];
  readonly layoffCursor: Int32Array;
}

export function runSimulation(config: ScenarioConfig): SimulationResult {
  validateScenarioConfig(config);

  const rng = createSeededRng(config.seed);
  const economy = initializeEconomy(config, rng);
  const path: SimulationPoint[] = [];

  let previousCpi = computeCpi(economy.firmPrice, economy.firmSector, economy.sectorWeights);
  let previousPpi = computeAverage(economy.firmPrice);
  let baseOutput = Math.max(1, computePotentialOutput(economy));
  let cumulativeBankruptcies = 0;

  for (let period = 0; period < config.periods; period += 1) {
    const policyRateAnnual = policyRateForPeriod(config, period);
    const loanRateAnnual = policyRateAnnual + 0.018 + 0.004 * Math.sin(period / 9);
    const policyShockAnnual = Math.max(0, policyRateAnnual - config.policyRateAnnual);
    const networkInputPressure = computeNetworkInputPressure(economy);
    const laborFlow = updateLaborMarket(config, economy, rng, policyShockAnnual);

    recomputePayroll(economy);

    const firmPeriod = updateFirms(config, economy, networkInputPressure, loanRateAnnual, policyShockAnnual);
    cumulativeBankruptcies += firmPeriod.bankruptcies;

    const cpi = computeCpi(economy.firmPrice, economy.firmSector, economy.sectorWeights);
    const ppi = computeAverage(economy.firmPrice);
    const inflationAnnualized = Math.log(cpi / previousCpi) * 12;
    const producerPriceInflationAnnualized = Math.log(ppi / previousPpi) * 12;
    previousCpi = cpi;
    previousPpi = ppi;

    const employedHouseholds = countEmployed(economy.employerId);
    const unemploymentRate = 1 - employedHouseholds / config.households;
    const totalLayoffs = laborFlow.layoffs + firmPeriod.forcedLayoffs;
    const outputIndex = (firmPeriod.totalOutput / baseOutput) * 100;
    const vacancyRate = laborFlow.vacancies / config.households;
    const layoffRate = totalLayoffs / config.households;
    const creditGrowthAnnualized = firmPeriod.creditGrowthAnnualized - policyShockAnnual * 0.55;
    const sectorPriceDispersion = computeSectorPriceDispersion(
      economy.firmPrice,
      economy.firmSector,
      config.sectors
    );

    path.push({
      period,
      policyRateAnnual,
      loanRateAnnual,
      cpi,
      inflationAnnualized,
      producerPriceInflationAnnualized,
      outputIndex,
      employedHouseholds,
      unemploymentRate,
      vacancyRate,
      layoffRate,
      hires: laborFlow.hires,
      layoffs: totalLayoffs,
      bankruptcies: cumulativeBankruptcies,
      creditGrowthAnnualized,
      supplyChainStress: firmPeriod.supplyChainStress,
      averageFirmPrice: ppi,
      sectorPriceDispersion
    });
  }

  recomputePayroll(economy);
  const firmWorkerCount = computeFirmWorkerCounts(economy.employerId, config.firms);
  const employerWorkerConsistent = checkEmployerWorkerConsistency({
    employerId: economy.employerId,
    firmWorkerCount
  });
  const payrollConsistent = checkPayrollConsistency({
    employerId: economy.employerId,
    wage: economy.wage,
    hours: economy.hours,
    firmWageBill: economy.firmWageBill
  });
  const supplierNetworkConsistent = checkSupplierNetworkConsistency({
    ...economy.supplierNetwork,
    firmCount: config.firms
  });
  const priceIndexConsistent = path.every(
    (point) => Number.isFinite(point.cpi) && point.cpi > 0 && Number.isFinite(point.inflationAnnualized)
  );
  const finalPoint = path[path.length - 1];
  const firmsWithWorkers = countPositive(economy.firmLabor);

  return {
    metadata: {
      modelVersion: config.modelVersion,
      scenarioName: config.scenarioName,
      economyContext: config.economyContext,
      parameterHash: stableParameterHash(config),
      seedPolicy: `master_seed:${config.seed};rng:xorshift32`,
      scale: {
        households: config.households,
        firms: config.firms,
        banks: config.banks,
        sectors: config.sectors,
        periods: config.periods,
        supplierEdges: economy.supplierNetwork.supplierId.length
      },
      generatedAt: "deterministic-milestone-1"
    },
    path,
    diagnostics: {
      employerWorkerConsistent,
      payrollConsistent,
      supplierNetworkConsistent,
      priceIndexConsistent,
      accountingChecksPassed:
        employerWorkerConsistent && payrollConsistent && supplierNetworkConsistent && priceIndexConsistent
    },
    summary: {
      firmsWithWorkers,
      supplierEdges: economy.supplierNetwork.supplierId.length,
      finalInflationAnnualized: finalPoint.inflationAnnualized,
      finalUnemploymentRate: finalPoint.unemploymentRate,
      finalOutputIndex: finalPoint.outputIndex,
      finalSupplyChainStress: finalPoint.supplyChainStress
    }
  };
}

function initializeEconomy(config: ScenarioConfig, rng: ReturnType<typeof createSeededRng>): EconomyArrays {
  const firmSector = new Int16Array(config.firms);
  const firmStage = new Int8Array(config.firms);
  const firmBank = new Int16Array(config.firms);
  const firmPrice = new Float64Array(config.firms);
  const firmProductivity = new Float32Array(config.firms);
  const firmCapital = new Float64Array(config.firms);
  const firmLabor = new Int32Array(config.firms);
  const firmBaseLabor = new Int32Array(config.firms);
  const firmWageBill = new Float64Array(config.firms);
  const firmOutput = new Float64Array(config.firms);
  const firmCash = new Float64Array(config.firms);
  const firmDebt = new Float64Array(config.firms);
  const firmInventory = new Float64Array(config.firms);
  const firmWorkingCapitalExposure = new Float32Array(config.firms);
  const firmPriceStickiness = new Float32Array(config.firms);
  const firmMarkup = new Float32Array(config.firms);
  const firmDefaulted = new Uint8Array(config.firms);

  for (let f = 0; f < config.firms; f += 1) {
    const sector = f % config.sectors;
    firmSector[f] = sector;
    firmStage[f] = stageForSector(sector, config.sectors);
    firmBank[f] = f % config.banks;
    firmPrice[f] = 0.92 + sector * 0.006 + rng.nextFloat() * 0.22;
    firmProductivity[f] = 0.85 + rng.nextFloat() * 0.45;
    firmCapital[f] = 70 + rng.nextFloat() * 260;
    firmCash[f] = 2_000 + rng.nextFloat() * 18_000;
    firmDebt[f] = firmCash[f] * (0.25 + rng.nextFloat() * 1.3);
    firmInventory[f] = 20 + rng.nextFloat() * 80;
    firmWorkingCapitalExposure[f] = 0.12 + rng.nextFloat() * 0.72;
    firmPriceStickiness[f] = 0.18 + rng.nextFloat() * 0.58;
    firmMarkup[f] = 0.08 + rng.nextFloat() * 0.22;
  }

  const employerId = new Int32Array(config.households);
  const wage = new Float64Array(config.households);
  const hours = new Float64Array(config.households);
  const unemployedPool: number[] = [];
  const initialUnemploymentRate = config.initialUnemploymentRate ?? 0.06;

  for (let h = 0; h < config.households; h += 1) {
    const employed = rng.nextFloat() > initialUnemploymentRate;
    if (employed) {
      const employer = drawFirmId(config.firms, rng);
      const sector = firmSector[employer];
      employerId[h] = employer;
      wage[h] = sectorBaseWage(sector, config.sectors) * (0.82 + rng.nextFloat() * 0.42);
      hours[h] = 1;
      firmLabor[employer] += 1;
    } else {
      employerId[h] = -1;
      wage[h] = 0;
      hours[h] = 0;
      unemployedPool.push(h);
    }
  }

  for (let f = 0; f < config.firms; f += 1) {
    firmBaseLabor[f] = Math.max(1, firmLabor[f]);
  }

  const sectorWeights = createSectorWeights(config.sectors);
  const supplierNetwork = generateSupplierNetwork(config, firmSector, rng);
  const layoffCursor = new Int32Array(config.firms);
  recomputePayroll({
    employerId,
    wage,
    hours,
    firmWageBill
  });

  return {
    employerId,
    wage,
    hours,
    firmSector,
    firmStage,
    firmBank,
    firmPrice,
    firmProductivity,
    firmCapital,
    firmLabor,
    firmBaseLabor,
    firmWageBill,
    firmOutput,
    firmCash,
    firmDebt,
    firmInventory,
    firmWorkingCapitalExposure,
    firmPriceStickiness,
    firmMarkup,
    firmDefaulted,
    sectorWeights,
    supplierNetwork,
    unemployedPool,
    layoffCursor
  };
}

function updateLaborMarket(
  config: ScenarioConfig,
  economy: EconomyArrays,
  rng: ReturnType<typeof createSeededRng>,
  policyShockAnnual: number
): { hires: number; layoffs: number; vacancies: number } {
  let hires = 0;
  let layoffs = 0;
  let vacancies = 0;
  const firingFriction = clamp(config.firingFriction ?? 0.45, 0, 1);

  for (let f = 0; f < config.firms; f += 1) {
    if (economy.firmDefaulted[f] === 1) {
      continue;
    }

    const stage = economy.firmStage[f];
    const baseLabor = economy.firmBaseLabor[f];
    const demandSensitivity = 0.25 + stage * 0.08 + economy.firmWorkingCapitalExposure[f] * 0.18;
    const idiosyncraticDemand = (rng.nextFloat() - 0.5) * 0.035;
    const desiredLabor = Math.max(
      1,
      Math.round(baseLabor * (1 - policyShockAnnual * 2.8 * demandSensitivity + idiosyncraticDemand))
    );
    const currentLabor = economy.firmLabor[f];

    if (desiredLabor > currentLabor) {
      const firmVacancies = desiredLabor - currentLabor;
      vacancies += firmVacancies;
      const actualHires = hireWorkers(config, economy, f, firmVacancies, rng);
      hires += actualHires;
    } else if (desiredLabor < currentLabor) {
      const rawLayoffs = currentLabor - desiredLabor;
      const plannedLayoffs = Math.ceil(rawLayoffs * (1 - firingFriction));
      const actualLayoffs = layoffWorkers(config, economy, f, plannedLayoffs);
      layoffs += actualLayoffs;
    }
  }

  return { hires, layoffs, vacancies };
}

function updateFirms(
  config: ScenarioConfig,
  economy: EconomyArrays,
  networkInputPressure: Float64Array,
  loanRateAnnual: number,
  policyShockAnnual: number
): {
  totalOutput: number;
  bankruptcies: number;
  forcedLayoffs: number;
  creditGrowthAnnualized: number;
  supplyChainStress: number;
} {
  let totalOutput = 0;
  let bankruptcies = 0;
  let forcedLayoffs = 0;
  let totalDebtBefore = 0;
  let totalDebtAfter = 0;
  let stressSum = 0;
  const costChannelStrength = config.costChannelStrength ?? 0.35;
  const inventoryBuffer = config.inventoryBufferMonths ?? 1.5;

  for (let f = 0; f < config.firms; f += 1) {
    const labor = economy.firmLabor[f];
    const laborCapacity = Math.pow(labor + 1, 0.62);
    const capitalCapacity = Math.pow(economy.firmCapital[f], 0.28);
    const inputStress = clamp(networkInputPressure[f] - 1, -0.35, 0.6);
    const supplyPenalty = Math.max(0.62, 1 - Math.max(0, inputStress) * 0.18);
    const output = economy.firmProductivity[f] * laborCapacity * capitalCapacity * supplyPenalty;
    economy.firmOutput[f] = output;
    totalOutput += output;

    const bankSpread = (economy.firmBank[f] % 7) * 0.0005;
    const effectiveLoanRateAnnual = loanRateAnnual + bankSpread;
    const wageBill = economy.firmWageBill[f];
    const inputCost = output * networkInputPressure[f] * 0.34;
    const workingCapitalNeed = Math.max(0, wageBill + inputCost - economy.firmCash[f] * 0.18);
    const workingCapitalCost =
      workingCapitalNeed * (effectiveLoanRateAnnual / 12) * economy.firmWorkingCapitalExposure[f];
    const unitLaborCost = wageBill / Math.max(1, output * 100);
    const markupPressure = (economy.firmMarkup[f] - 0.15) * 0.003;
    const marginalCostPressure =
      unitLaborCost * 0.02 + inputStress * 0.03 + workingCapitalCost / Math.max(10_000, wageBill + inputCost);
    const demandPressure = clamp((labor - economy.firmBaseLabor[f]) / Math.max(1, economy.firmBaseLabor[f]), -0.4, 0.4);
    const desiredMonthlyPriceChange =
      0.0011 +
      markupPressure +
      marginalCostPressure * (0.8 + costChannelStrength) +
      demandPressure * 0.012 +
      policyShockAnnual * costChannelStrength * economy.firmWorkingCapitalExposure[f] * 0.055;
    const adjustmentShare = 1 - economy.firmPriceStickiness[f];
    economy.firmPrice[f] *= clamp(1 + desiredMonthlyPriceChange * adjustmentShare, 0.965, 1.055);

    const revenue = output * economy.firmPrice[f] * 100;
    totalDebtBefore += economy.firmDebt[f];
    const newDebt = Math.max(0, workingCapitalNeed * 0.12 - economy.firmCash[f] * 0.05);
    economy.firmDebt[f] += newDebt;
    economy.firmCash[f] += revenue - wageBill - inputCost - workingCapitalCost;
    economy.firmInventory[f] = clamp(economy.firmInventory[f] + output - labor * inventoryBuffer * 0.08, 0, 1_000_000);
    totalDebtAfter += economy.firmDebt[f];

    const distress = economy.firmDebt[f] / Math.max(1, economy.firmCash[f] + revenue);
    if (economy.firmDefaulted[f] === 0 && (economy.firmCash[f] < -25_000 || distress > 14)) {
      economy.firmDefaulted[f] = 1;
      bankruptcies += 1;
      forcedLayoffs += layoffWorkers(config, economy, f, economy.firmLabor[f]);
      economy.firmDebt[f] *= 0.55;
      economy.firmCash[f] = 0;
    }

    stressSum += Math.max(0, inputStress) + (economy.firmDefaulted[f] ? 0.08 : 0);
  }

  const debtBase = Math.max(1, totalDebtBefore);
  const creditGrowthAnnualized = ((totalDebtAfter - totalDebtBefore) / debtBase) * 12 - policyShockAnnual * 0.4;
  return {
    totalOutput,
    bankruptcies,
    forcedLayoffs,
    creditGrowthAnnualized,
    supplyChainStress: clamp(stressSum / config.firms, 0, 1)
  };
}

function hireWorkers(
  config: ScenarioConfig,
  economy: EconomyArrays,
  firm: number,
  vacancies: number,
  rng: ReturnType<typeof createSeededRng>
): number {
  let hires = 0;
  const sector = economy.firmSector[firm];
  while (hires < vacancies && economy.unemployedPool.length > 0) {
    const worker = economy.unemployedPool.pop();
    if (worker === undefined || economy.employerId[worker] !== -1) {
      continue;
    }
    economy.employerId[worker] = firm;
    economy.hours[worker] = 1;
    economy.wage[worker] = sectorBaseWage(sector, config.sectors) * (0.86 + rng.nextFloat() * 0.34);
    economy.firmLabor[firm] += 1;
    hires += 1;
  }
  return hires;
}

function layoffWorkers(config: ScenarioConfig, economy: EconomyArrays, firm: number, requested: number): number {
  if (requested <= 0) {
    return 0;
  }
  let actual = 0;
  let scanned = 0;
  let index = economy.layoffCursor[firm] % config.households;

  while (actual < requested && scanned < config.households) {
    if (economy.employerId[index] === firm) {
      economy.employerId[index] = -1;
      economy.hours[index] = 0;
      economy.wage[index] = 0;
      economy.unemployedPool.push(index);
      economy.firmLabor[firm] -= 1;
      actual += 1;
    }
    index = (index + 1) % config.households;
    scanned += 1;
  }

  economy.layoffCursor[firm] = index;
  return actual;
}

function recomputePayroll(economy: Pick<EconomyArrays, "employerId" | "wage" | "hours" | "firmWageBill">): void {
  economy.firmWageBill.fill(0);
  for (let h = 0; h < economy.employerId.length; h += 1) {
    const employer = economy.employerId[h];
    if (employer >= 0) {
      economy.firmWageBill[employer] += economy.wage[h] * economy.hours[h];
    }
  }
}

function generateSupplierNetwork(
  config: ScenarioConfig,
  firmSector: Int16Array,
  rng: ReturnType<typeof createSeededRng>
): SupplierNetwork {
  const edgesPerFirm = Math.max(1, config.supplierEdgesPerFirm ?? 4);
  const edgeCount = config.firms * edgesPerFirm;
  const supplierPtr = new Int32Array(config.firms + 1);
  const supplierId = new Int32Array(edgeCount);
  const buyerId = new Int32Array(edgeCount);
  const contractWeight = new Float32Array(edgeCount);
  let edge = 0;

  for (let buyer = 0; buyer < config.firms; buyer += 1) {
    supplierPtr[buyer] = edge;
    const buyerSector = firmSector[buyer];
    for (let k = 0; k < edgesPerFirm; k += 1) {
      const upstreamOffset = 1 + Math.floor(rng.nextFloat() * Math.min(4, config.sectors));
      const supplierSector = (buyerSector - upstreamOffset + config.sectors) % config.sectors;
      let supplier = firmIdForSector(config.firms, config.sectors, supplierSector, rng);
      if (supplier === buyer) {
        supplier = (supplier + config.sectors) % config.firms;
      }
      supplierId[edge] = supplier;
      buyerId[edge] = buyer;
      contractWeight[edge] = 1 / edgesPerFirm;
      edge += 1;
    }
  }

  supplierPtr[config.firms] = edge;
  return { supplierPtr, supplierId, buyerId, contractWeight };
}

function computeNetworkInputPressure(economy: EconomyArrays): Float64Array {
  const pressure = new Float64Array(economy.firmPrice.length);
  for (let buyer = 0; buyer < economy.firmPrice.length; buyer += 1) {
    let weightedPrice = 0;
    for (let edge = economy.supplierNetwork.supplierPtr[buyer]; edge < economy.supplierNetwork.supplierPtr[buyer + 1]; edge += 1) {
      weightedPrice += economy.firmPrice[economy.supplierNetwork.supplierId[edge]] * economy.supplierNetwork.contractWeight[edge];
    }
    pressure[buyer] = weightedPrice > 0 ? weightedPrice : 1;
  }
  return pressure;
}

function computeCpi(firmPrice: Float64Array, firmSector: Int16Array, sectorWeights: Float64Array): number {
  const sectorPrice = new Float64Array(sectorWeights.length);
  const sectorCount = new Int32Array(sectorWeights.length);

  for (let f = 0; f < firmPrice.length; f += 1) {
    const sector = firmSector[f];
    sectorPrice[sector] += firmPrice[f];
    sectorCount[sector] += 1;
  }

  let index = 0;
  for (let s = 0; s < sectorWeights.length; s += 1) {
    const price = sectorCount[s] > 0 ? sectorPrice[s] / sectorCount[s] : 1;
    index += sectorWeights[s] * price;
  }

  return index;
}

function computePotentialOutput(economy: EconomyArrays): number {
  let total = 0;
  for (let f = 0; f < economy.firmOutput.length; f += 1) {
    const laborCapacity = Math.pow(economy.firmLabor[f] + 1, 0.62);
    const capitalCapacity = Math.pow(economy.firmCapital[f], 0.28);
    total += economy.firmProductivity[f] * laborCapacity * capitalCapacity;
  }
  return total;
}

function createSectorWeights(sectors: number): Float64Array {
  const weights = new Float64Array(sectors);
  let sum = 0;
  for (let s = 0; s < sectors; s += 1) {
    const stage = stageForSector(s, sectors);
    const value = 0.7 + stage * 0.18 + (s % 5 === 0 ? 0.25 : 0);
    weights[s] = value;
    sum += value;
  }
  for (let s = 0; s < sectors; s += 1) {
    weights[s] /= sum;
  }
  return weights;
}

function computeSectorPriceDispersion(firmPrice: Float64Array, firmSector: Int16Array, sectors: number): number {
  const sectorPrice = new Float64Array(sectors);
  const sectorCount = new Int32Array(sectors);
  for (let f = 0; f < firmPrice.length; f += 1) {
    sectorPrice[firmSector[f]] += firmPrice[f];
    sectorCount[firmSector[f]] += 1;
  }

  const averages = new Float64Array(sectors);
  let mean = 0;
  for (let s = 0; s < sectors; s += 1) {
    averages[s] = sectorCount[s] > 0 ? sectorPrice[s] / sectorCount[s] : 0;
    mean += averages[s];
  }
  mean /= sectors;

  let variance = 0;
  for (const value of averages) {
    variance += (value - mean) ** 2;
  }
  return Math.sqrt(variance / sectors);
}

function computeAverage(values: Float64Array): number {
  let sum = 0;
  for (const value of values) {
    sum += value;
  }
  return sum / values.length;
}

function countEmployed(employerId: Int32Array): number {
  let employed = 0;
  for (const employer of employerId) {
    if (employer >= 0) {
      employed += 1;
    }
  }
  return employed;
}

function countPositive(values: Int32Array): number {
  let count = 0;
  for (const value of values) {
    if (value > 0) {
      count += 1;
    }
  }
  return count;
}

function policyRateForPeriod(config: ScenarioConfig, period: number): number {
  const start = config.treatmentStartPeriod ?? 3;
  const duration = config.treatmentDurationPeriods ?? 12;
  const shock = (config.treatmentShockBps ?? 0) / 10_000;
  return config.policyRateAnnual + (period >= start && period < start + duration ? shock : 0);
}

function firmIdForSector(
  firmCount: number,
  sectorCount: number,
  sector: number,
  rng: ReturnType<typeof createSeededRng>
): number {
  const candidates = Math.max(1, Math.floor((firmCount - 1 - sector) / sectorCount) + 1);
  const stride = Math.floor(rng.nextFloat() * candidates);
  return Math.min(firmCount - 1, sector + stride * sectorCount);
}

function drawFirmId(firms: number, rng: ReturnType<typeof createSeededRng>): number {
  const draw = rng.nextFloat();
  const sizeTilt = draw ** 1.35;
  return Math.min(firms - 1, Math.floor(sizeTilt * firms));
}

function stageForSector(sector: number, sectors: number): number {
  return Math.min(5, Math.floor((sector / Math.max(1, sectors)) * 6));
}

function sectorBaseWage(sector: number, sectors: number): number {
  const stage = stageForSector(sector, sectors);
  return 48 + stage * 7 + (sector % 4) * 2.5;
}

function validateScenarioConfig(config: ScenarioConfig): void {
  if (config.households <= 0 || config.firms <= 0 || config.banks <= 0 || config.sectors <= 0) {
    throw new Error("Scenario scale must be positive.");
  }
  if (config.periods <= 0) {
    throw new Error("Scenario periods must be positive.");
  }
  if (config.households < config.firms) {
    throw new Error("Scenario must have at least as many households as firms for the Milestone 1 labor market.");
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
