import {
  checkEmployerWorkerConsistency,
  checkPayrollConsistency,
  checkSupplierNetworkConsistency,
  computeFirmWorkerCounts
} from "../accounting/invariants";
import { createSeededRng } from "../random/seededRng";
import type {
  AssetMarketSummary,
  ExpectationRuleMix,
  HouseholdRuleMix,
  NetworkSummary,
  ScenarioConfig,
  SectorSummary,
  SimulationPoint,
  SimulationResult
} from "../schema/scenario";

const Behavior = {
  HandToMouth: 0,
  LiquidityBuffer: 1,
  Habit: 2,
  DebtStress: 3
} as const;

const Expectation = {
  Adaptive: 0,
  Anchored: 1,
  Extrapolative: 2,
  EmployerSector: 3
} as const;

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
  readonly householdBehavior: Int8Array;
  readonly expectationRule: Int8Array;
  readonly deposits: Float64Array;
  readonly debt: Float64Array;
  readonly householdBank: Int16Array;
  readonly mortgageDebt: Float64Array;
  readonly homeValue: Float64Array;
  readonly variableMortgageShare: Float32Array;
  readonly equityHoldings: Float64Array;
  readonly consumptionHabit: Float64Array;
  readonly inflationExpectation: Float32Array;
  readonly firmSector: Int16Array;
  readonly firmStage: Int8Array;
  readonly firmBank: Int16Array;
  readonly firmPrice: Float64Array;
  readonly firmProductivity: Float32Array;
  readonly firmCapital: Float64Array;
  readonly firmLabor: Int32Array;
  readonly firmBaseLabor: Int32Array;
  readonly firmWageBill: Float64Array;
  readonly firmWageOffer: Float64Array;
  readonly firmQuality: Float32Array;
  readonly firmOutput: Float64Array;
  readonly firmCash: Float64Array;
  readonly firmDebt: Float64Array;
  readonly firmEquityValue: Float64Array;
  readonly firmInventory: Float64Array;
  readonly firmInputRequirement: Float32Array;
  readonly firmInputInventory: Float64Array;
  readonly firmInputTarget: Float64Array;
  readonly firmInputCostIndex: Float64Array;
  readonly firmBacklog: Float64Array;
  readonly firmReliability: Float32Array;
  readonly firmDeliveryAttempts: Int32Array;
  readonly firmDeliveryFailures: Int32Array;
  readonly firmWorkingCapitalExposure: Float32Array;
  readonly firmPriceStickiness: Float32Array;
  readonly firmMarkup: Float32Array;
  readonly firmDefaulted: Uint8Array;
  readonly sectorWeights: Float64Array;
  readonly sectorOutputBaseline: Float64Array;
  readonly bankCapital: Float64Array;
  readonly bankMortgageBook: Float64Array;
  readonly bankFirmLoanBook: Float64Array;
  readonly bankCreditTightness: Float32Array;
  readonly assetState: AssetMarketState;
  readonly supplierNetwork: SupplierNetwork;
  readonly unemployedPool: number[];
  readonly layoffCursor: Int32Array;
  readonly baselineConsumption: number;
  readonly baselineDeposits: number;
  readonly baselineInputInventory: number;
  readonly baselineHomeValue: number;
  readonly baselineMortgageDebt: number;
  readonly baselineEquityHoldings: number;
  readonly baselineFirmEquityValue: number;
  readonly baselineNetWorth: number;
  readonly baselineConstructionOutput: number;
}

interface HouseholdPeriod {
  readonly consumptionIndex: number;
  readonly averageInflationExpectation: number;
  readonly householdDepositsIndex: number;
  readonly ruleMix: HouseholdRuleMix;
  readonly budgetConsistent: boolean;
}

interface SupplyChainPeriod {
  readonly inputAvailability: Float64Array;
  readonly deliveryAttempts: number;
  readonly deliveryFailures: number;
  readonly rewiredEdges: number;
  readonly deliveryFailureRate: number;
  readonly supplierRewireShare: number;
  readonly backlogIndex: number;
  readonly inputInventoryIndex: number;
}

interface MortgageRatePeriod {
  readonly variableMortgageRateAnnual: number;
  readonly fixedMortgageRateAnnual: number;
  readonly averageMortgageRateAnnual: number;
  readonly variableMortgageShare: number;
}

interface AssetMarketState {
  housingPriceIndex: number;
  previousHousingPriceIndex: number;
  equityPriceIndex: number;
  previousEquityPriceIndex: number;
  fixedMortgageRateAnnual: number;
  constructionDemandIndex: number;
  averageCreditTightness: number;
  previousMortgageDebt: number;
}

interface AssetMarketPeriod {
  readonly housingPriceIndex: number;
  readonly housingPriceGrowthAnnualized: number;
  readonly equityPriceIndex: number;
  readonly equityReturnAnnualized: number;
  readonly constructionOutputIndex: number;
}

interface HouseholdAssetSummary {
  readonly householdNetWorthIndex: number;
  readonly mortgageDebtServiceRatio: number;
  readonly householdDebtServiceRatio: number;
  readonly collateralConstraintIndex: number;
  readonly riskyAssetShare: number;
  readonly mortgageCreditGrowthAnnualized: number;
}

interface BankCreditPeriod {
  readonly averageCreditTightness: number;
}

export function runSimulation(config: ScenarioConfig): SimulationResult {
  validateScenarioConfig(config);

  const rng = createSeededRng(config.seed);
  const economy = initializeEconomy(config, rng);
  const path: SimulationPoint[] = [];

  let previousCpi = computeCpi(economy.firmPrice, economy.firmSector, economy.sectorWeights);
  let previousPpi = computeAverage(economy.firmPrice);
  let previousInflationAnnualized = config.targetInflationAnnual ?? 0.02;
  let previousConsumptionIndex = 1;
  let previousAverageWage = computeAveragePositive(economy.wage);
  let baseOutput = Math.max(1, computePotentialOutput(economy, 1));
  let cumulativeBankruptcies = 0;
  let cumulativeDeliveryAttempts = 0;
  let cumulativeDeliveryFailures = 0;
  let cumulativeRewiredEdges = 0;
  let householdBudgetConsistent = true;
  let lastSupplyChainPeriod: SupplyChainPeriod | undefined;
  updateBankCredit(config, economy);

  for (let period = 0; period < config.periods; period += 1) {
    const policyRateAnnual = policyRateForPeriod(config, period);
    const loanRateAnnual = policyRateAnnual + 0.018 + 0.004 * Math.sin(period / 9);
    const policyShockAnnual = Math.max(0, policyRateAnnual - config.policyRateAnnual);
    const mortgageRates = updateMortgageRates(config, economy, policyRateAnnual);

    const householdPeriod = updateHouseholds(
      config,
      economy,
      previousInflationAnnualized,
      policyRateAnnual,
      loanRateAnnual,
      mortgageRates,
      previousConsumptionIndex,
      rng
    );
    householdBudgetConsistent = householdBudgetConsistent && householdPeriod.budgetConsistent;

    const supplyChainPeriod = updateSupplyChain(
      config,
      economy,
      policyShockAnnual,
      householdPeriod.consumptionIndex,
      rng
    );
    lastSupplyChainPeriod = supplyChainPeriod;
    cumulativeDeliveryAttempts += supplyChainPeriod.deliveryAttempts;
    cumulativeDeliveryFailures += supplyChainPeriod.deliveryFailures;
    cumulativeRewiredEdges += supplyChainPeriod.rewiredEdges;

    const laborFlow = updateLaborMarket(
      config,
      economy,
      rng,
      policyShockAnnual,
      householdPeriod.consumptionIndex,
      householdPeriod.averageInflationExpectation,
      economy.assetState.constructionDemandIndex
    );

    recomputePayroll(economy);

    const firmPeriod = updateFirms(
      config,
      economy,
      supplyChainPeriod,
      loanRateAnnual,
      policyShockAnnual,
      householdPeriod.consumptionIndex,
      economy.assetState.constructionDemandIndex
    );
    cumulativeBankruptcies += firmPeriod.bankruptcies;

    const assetPeriod = updateAssetMarkets(
      config,
      economy,
      policyShockAnnual,
      mortgageRates.averageMortgageRateAnnual,
      loanRateAnnual,
      householdPeriod.consumptionIndex,
      firmPeriod.supplyChainStress,
      firmPeriod.totalOutput,
      baseOutput
    );
    const bankPeriod = updateBankCredit(config, economy);
    const householdAssetSummary = summarizeHouseholdAssets(economy, mortgageRates);

    const cpi = computeCpi(economy.firmPrice, economy.firmSector, economy.sectorWeights);
    const ppi = computeAverage(economy.firmPrice);
    const inflationAnnualized = Math.log(cpi / previousCpi) * 12;
    const producerPriceInflationAnnualized = Math.log(ppi / previousPpi) * 12;
    previousCpi = cpi;
    previousPpi = ppi;
    previousInflationAnnualized = inflationAnnualized;
    previousConsumptionIndex = householdPeriod.consumptionIndex;

    const averageWage = computeAveragePositive(economy.wage);
    const wageGrowthAnnualized = Math.log(averageWage / Math.max(1, previousAverageWage)) * 12;
    previousAverageWage = averageWage;

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
      mortgageCreditGrowthAnnualized: householdAssetSummary.mortgageCreditGrowthAnnualized,
      mortgageRateAnnual: mortgageRates.averageMortgageRateAnnual,
      variableMortgageShare: mortgageRates.variableMortgageShare,
      housingPriceIndex: assetPeriod.housingPriceIndex,
      housingPriceGrowthAnnualized: assetPeriod.housingPriceGrowthAnnualized,
      constructionOutputIndex: assetPeriod.constructionOutputIndex,
      equityPriceIndex: assetPeriod.equityPriceIndex,
      equityReturnAnnualized: assetPeriod.equityReturnAnnualized,
      householdNetWorthIndex: householdAssetSummary.householdNetWorthIndex,
      mortgageDebtServiceRatio: householdAssetSummary.mortgageDebtServiceRatio,
      collateralConstraintIndex: householdAssetSummary.collateralConstraintIndex,
      riskyAssetShare: householdAssetSummary.riskyAssetShare,
      bankCreditTightness: bankPeriod.averageCreditTightness,
      supplyChainStress: firmPeriod.supplyChainStress,
      backlogIndex: supplyChainPeriod.backlogIndex,
      deliveryFailureRate: supplyChainPeriod.deliveryFailureRate,
      supplierRewireShare: supplyChainPeriod.supplierRewireShare,
      inputInventoryIndex: supplyChainPeriod.inputInventoryIndex,
      averageFirmPrice: ppi,
      sectorPriceDispersion,
      consumptionIndex: householdPeriod.consumptionIndex,
      averageInflationExpectation: householdPeriod.averageInflationExpectation,
      wageGrowthAnnualized,
      householdDepositsIndex: householdPeriod.householdDepositsIndex,
      householdDebtServiceRatio: householdAssetSummary.householdDebtServiceRatio,
      handToMouthShare: householdPeriod.ruleMix.handToMouth,
      liquidityBufferShare: householdPeriod.ruleMix.liquidityBuffer,
      habitShare: householdPeriod.ruleMix.habit,
      debtStressShare: householdPeriod.ruleMix.debtStress
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
  const sectorSummaries = summarizeSectors(config, economy);
  const networkSummary = summarizeNetwork(
    economy,
    cumulativeDeliveryAttempts,
    cumulativeDeliveryFailures,
    cumulativeRewiredEdges,
    lastSupplyChainPeriod
  );
  const assetSummary = summarizeAssetMarkets(finalPoint);

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
      generatedAt: "deterministic-milestone-4"
    },
    path,
    sectors: sectorSummaries,
    network: networkSummary,
    assets: assetSummary,
    diagnostics: {
      employerWorkerConsistent,
      payrollConsistent,
      supplierNetworkConsistent,
      priceIndexConsistent,
      householdBudgetConsistent,
      accountingChecksPassed:
        employerWorkerConsistent &&
        payrollConsistent &&
        supplierNetworkConsistent &&
        priceIndexConsistent &&
        householdBudgetConsistent
    },
    summary: {
      firmsWithWorkers,
      supplierEdges: economy.supplierNetwork.supplierId.length,
      finalInflationAnnualized: finalPoint.inflationAnnualized,
      finalUnemploymentRate: finalPoint.unemploymentRate,
      finalOutputIndex: finalPoint.outputIndex,
      finalSupplyChainStress: finalPoint.supplyChainStress,
      finalBacklogIndex: finalPoint.backlogIndex,
      finalDeliveryFailureRate: finalPoint.deliveryFailureRate,
      finalInputInventoryIndex: finalPoint.inputInventoryIndex,
      finalHousingPriceIndex: finalPoint.housingPriceIndex,
      finalEquityPriceIndex: finalPoint.equityPriceIndex,
      finalConstructionOutputIndex: finalPoint.constructionOutputIndex,
      finalMortgageDebtServiceRatio: finalPoint.mortgageDebtServiceRatio,
      finalHouseholdNetWorthIndex: finalPoint.householdNetWorthIndex,
      finalBankCreditTightness: finalPoint.bankCreditTightness,
      finalConsumptionIndex: finalPoint.consumptionIndex,
      finalAverageInflationExpectation: finalPoint.averageInflationExpectation,
      finalRuleMix: {
        handToMouth: finalPoint.handToMouthShare,
        liquidityBuffer: finalPoint.liquidityBufferShare,
        habit: finalPoint.habitShare,
        debtStress: finalPoint.debtStressShare
      }
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
  const firmWageOffer = new Float64Array(config.firms);
  const firmQuality = new Float32Array(config.firms);
  const firmOutput = new Float64Array(config.firms);
  const firmCash = new Float64Array(config.firms);
  const firmDebt = new Float64Array(config.firms);
  const firmEquityValue = new Float64Array(config.firms);
  const firmInventory = new Float64Array(config.firms);
  const firmInputRequirement = new Float32Array(config.firms);
  const firmInputInventory = new Float64Array(config.firms);
  const firmInputTarget = new Float64Array(config.firms);
  const firmInputCostIndex = new Float64Array(config.firms);
  const firmBacklog = new Float64Array(config.firms);
  const firmReliability = new Float32Array(config.firms);
  const firmDeliveryAttempts = new Int32Array(config.firms);
  const firmDeliveryFailures = new Int32Array(config.firms);
  const firmWorkingCapitalExposure = new Float32Array(config.firms);
  const firmPriceStickiness = new Float32Array(config.firms);
  const firmMarkup = new Float32Array(config.firms);
  const firmDefaulted = new Uint8Array(config.firms);
  const sectorOutputBaseline = new Float64Array(config.sectors);
  const bankCapital = new Float64Array(config.banks);
  const bankMortgageBook = new Float64Array(config.banks);
  const bankFirmLoanBook = new Float64Array(config.banks);
  const bankCreditTightness = new Float32Array(config.banks);
  const assetState: AssetMarketState = {
    housingPriceIndex: 1,
    previousHousingPriceIndex: 1,
    equityPriceIndex: 1,
    previousEquityPriceIndex: 1,
    fixedMortgageRateAnnual: config.policyRateAnnual + (config.mortgageSpreadBps ?? 185) / 10_000,
    constructionDemandIndex: 1,
    averageCreditTightness: 0.15,
    previousMortgageDebt: 1
  };
  let baselineInputInventory = 0;
  let baselineFirmEquityValue = 0;

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
    firmWageOffer[f] = sectorBaseWage(sector, config.sectors) * (0.96 + rng.nextFloat() * 0.12);
    firmQuality[f] = 0.65 + rng.nextFloat() * 0.35;
    firmInputCostIndex[f] = 1;
    firmReliability[f] = clamp(0.96 - firmStage[f] * 0.018 - rng.nextFloat() * 0.16, 0.68, 0.98);
    firmEquityValue[f] = Math.max(1, firmCash[f] + firmCapital[f] * firmPrice[f] * 28 - firmDebt[f] * 0.55);
    baselineFirmEquityValue += firmEquityValue[f];
  }

  const employerId = new Int32Array(config.households);
  const wage = new Float64Array(config.households);
  const hours = new Float64Array(config.households);
  const householdBehavior = new Int8Array(config.households);
  const expectationRule = new Int8Array(config.households);
  const deposits = new Float64Array(config.households);
  const debt = new Float64Array(config.households);
  const householdBank = new Int16Array(config.households);
  const mortgageDebt = new Float64Array(config.households);
  const homeValue = new Float64Array(config.households);
  const variableMortgageShare = new Float32Array(config.households);
  const equityHoldings = new Float64Array(config.households);
  const consumptionHabit = new Float64Array(config.households);
  const inflationExpectation = new Float32Array(config.households);
  const unemployedPool: number[] = [];
  const initialUnemploymentRate = config.initialUnemploymentRate ?? 0.06;
  const behaviorMix = normalizeHouseholdRuleMix(config.householdRuleMix);
  const expectationMix = normalizeExpectationRuleMix(config.expectationRuleMix);
  let baselineConsumption = 0;
  let baselineDeposits = 0;
  let baselineHomeValue = 0;
  let baselineMortgageDebt = 0;
  let baselineEquityHoldings = 0;
  let baselineNetWorth = 0;

  for (let h = 0; h < config.households; h += 1) {
    householdBehavior[h] = drawBehaviorType(behaviorMix, rng.nextFloat());
    expectationRule[h] = drawExpectationType(expectationMix, rng.nextFloat());
    inflationExpectation[h] = (config.targetInflationAnnual ?? 0.02) + (rng.nextFloat() - 0.5) * 0.012;
    consumptionHabit[h] = 42 + rng.nextFloat() * 48;
    deposits[h] = consumptionHabit[h] * (1.5 + rng.nextFloat() * 7.5);
    debt[h] = rng.nextFloat() < 0.58 ? consumptionHabit[h] * (4 + rng.nextFloat() * 38) : 0;
    householdBank[h] = h % config.banks;
    const homeowner = rng.nextFloat() < 0.66;
    if (homeowner) {
      homeValue[h] = consumptionHabit[h] * (95 + rng.nextFloat() * 135);
      mortgageDebt[h] = homeValue[h] * (0.34 + rng.nextFloat() * 0.42);
      const variableTilt = rng.nextFloat() < (config.variableMortgageShare ?? 0.88) ? 1 : 0;
      variableMortgageShare[h] = variableTilt === 1 ? 0.75 + rng.nextFloat() * 0.25 : rng.nextFloat() * 0.2;
    } else {
      homeValue[h] = 0;
      mortgageDebt[h] = 0;
      variableMortgageShare[h] = 0;
    }
    const portfolioBase = deposits[h] + Math.max(0, homeValue[h] - mortgageDebt[h]) * 0.04;
    const riskyShare = clamp(0.08 + (portfolioBase / Math.max(1, consumptionHabit[h] * 300)) * 0.18, 0.02, 0.32);
    equityHoldings[h] = portfolioBase * riskyShare;
    deposits[h] = Math.max(0, deposits[h] - equityHoldings[h] * 0.35);
    baselineConsumption += consumptionHabit[h];
    baselineDeposits += deposits[h];
    baselineHomeValue += homeValue[h];
    baselineMortgageDebt += mortgageDebt[h];
    baselineEquityHoldings += equityHoldings[h];
    baselineNetWorth += deposits[h] + equityHoldings[h] + Math.max(0, homeValue[h] - mortgageDebt[h]) - debt[h];

    const employed = rng.nextFloat() > initialUnemploymentRate;
    if (employed) {
      const employer = drawFirmId(config.firms, rng);
      employerId[h] = employer;
      wage[h] = firmWageOffer[employer] * (0.9 + rng.nextFloat() * 0.18);
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
    const stage = firmStage[f];
    const basePotentialOutput =
      firmProductivity[f] *
      Math.pow(firmBaseLabor[f] + 1, 0.62) *
      Math.pow(firmCapital[f], 0.28);
    const requirement =
      0.1 +
      stage * 0.045 +
      firmWorkingCapitalExposure[f] * 0.08 +
      (f % 3) * 0.012 +
      rng.nextFloat() * 0.025;
    const targetMonths = config.inputInventoryTargetMonths ?? config.inventoryBufferMonths ?? 1.5;
    firmInputRequirement[f] = requirement;
    firmInputTarget[f] = Math.max(6, basePotentialOutput * requirement * targetMonths);
    firmInputInventory[f] = firmInputTarget[f] * (0.74 + rng.nextFloat() * 0.52);
    baselineInputInventory += firmInputInventory[f];
    sectorOutputBaseline[firmSector[f]] += Math.max(1, basePotentialOutput);
  }

  const sectorWeights = createSectorWeights(config.sectors);
  const supplierNetwork = generateSupplierNetwork(config, firmSector, rng);
  const layoffCursor = new Int32Array(config.firms);
  const baselineConstructionOutput = Math.max(1, sectorOutputBaseline[constructionSectorId(config.sectors)]);
  assetState.previousMortgageDebt = Math.max(1, baselineMortgageDebt);
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
    householdBehavior,
    expectationRule,
    deposits,
    debt,
    householdBank,
    mortgageDebt,
    homeValue,
    variableMortgageShare,
    equityHoldings,
    consumptionHabit,
    inflationExpectation,
    firmSector,
    firmStage,
    firmBank,
    firmPrice,
    firmProductivity,
    firmCapital,
    firmLabor,
    firmBaseLabor,
    firmWageBill,
    firmWageOffer,
    firmQuality,
    firmOutput,
    firmCash,
    firmDebt,
    firmEquityValue,
    firmInventory,
    firmInputRequirement,
    firmInputInventory,
    firmInputTarget,
    firmInputCostIndex,
    firmBacklog,
    firmReliability,
    firmDeliveryAttempts,
    firmDeliveryFailures,
    firmWorkingCapitalExposure,
    firmPriceStickiness,
    firmMarkup,
    firmDefaulted,
    sectorWeights,
    sectorOutputBaseline,
    bankCapital,
    bankMortgageBook,
    bankFirmLoanBook,
    bankCreditTightness,
    assetState,
    supplierNetwork,
    unemployedPool,
    layoffCursor,
    baselineConsumption: Math.max(1, baselineConsumption),
    baselineDeposits: Math.max(1, baselineDeposits),
    baselineInputInventory: Math.max(1, baselineInputInventory),
    baselineHomeValue: Math.max(1, baselineHomeValue),
    baselineMortgageDebt: Math.max(1, baselineMortgageDebt),
    baselineEquityHoldings: Math.max(1, baselineEquityHoldings),
    baselineFirmEquityValue: Math.max(1, baselineFirmEquityValue),
    baselineNetWorth: Math.max(1, baselineNetWorth),
    baselineConstructionOutput
  };
}

function updateMortgageRates(
  config: ScenarioConfig,
  economy: EconomyArrays,
  policyRateAnnual: number
): MortgageRatePeriod {
  const spread = (config.mortgageSpreadBps ?? 185) / 10_000;
  const variableMortgageRateAnnual = policyRateAnnual + spread + economy.assetState.averageCreditTightness * 0.006;
  const repricingSpeed = clamp(config.fixedMortgageRepricingSpeed ?? 0.08, 0, 1);
  economy.assetState.fixedMortgageRateAnnual =
    economy.assetState.fixedMortgageRateAnnual * (1 - repricingSpeed) + variableMortgageRateAnnual * repricingSpeed;
  const variableMortgageShare = aggregateVariableMortgageShare(economy);
  return {
    variableMortgageRateAnnual,
    fixedMortgageRateAnnual: economy.assetState.fixedMortgageRateAnnual,
    averageMortgageRateAnnual:
      variableMortgageShare * variableMortgageRateAnnual +
      (1 - variableMortgageShare) * economy.assetState.fixedMortgageRateAnnual,
    variableMortgageShare
  };
}

function updateAssetMarkets(
  config: ScenarioConfig,
  economy: EconomyArrays,
  policyShockAnnual: number,
  mortgageRateAnnual: number,
  loanRateAnnual: number,
  consumptionIndex: number,
  supplyChainStress: number,
  totalOutput: number,
  baseOutput: number
): AssetMarketPeriod {
  const state = economy.assetState;
  const previousHousingPriceIndex = state.housingPriceIndex;
  const previousEquityPriceIndex = state.equityPriceIndex;
  const constructionOutputIndex = computeConstructionOutputIndex(config, economy);
  const housingSupplyElasticity = clamp(config.housingSupplyElasticity ?? 0.28, 0, 1);
  const demandSignal = clamp(consumptionIndex - 1, -0.35, 0.35);
  const constructionShortage = clamp(1 - constructionOutputIndex / 100, -0.4, 0.7);
  const creditSignal = clamp(0.22 - state.averageCreditTightness, -0.35, 0.35);
  const monthlyHousingChange =
    0.0012 +
    demandSignal * 0.02 +
    constructionShortage * (0.012 + housingSupplyElasticity * 0.018) +
    creditSignal * 0.006 -
    Math.max(0, mortgageRateAnnual - config.policyRateAnnual - 0.012) * 0.08 -
    policyShockAnnual * 0.16;
  state.previousHousingPriceIndex = previousHousingPriceIndex;
  state.housingPriceIndex *= clamp(1 + monthlyHousingChange, 0.955, 1.045);
  const housingReturn = state.housingPriceIndex / Math.max(0.001, previousHousingPriceIndex);
  for (let h = 0; h < economy.homeValue.length; h += 1) {
    economy.homeValue[h] *= housingReturn;
  }

  let firmEquitySum = 0;
  const outputIndex = totalOutput / Math.max(1, baseOutput);
  const discountRate = loanRateAnnual + (config.equityRiskPremium ?? 0.045);
  for (let f = 0; f < economy.firmEquityValue.length; f += 1) {
    const earningsProxy = economy.firmOutput[f] * economy.firmPrice[f] * 22 - economy.firmWageBill[f] * 0.12;
    const fundamental = Math.max(
      1,
      (economy.firmCash[f] + earningsProxy * clamp(outputIndex, 0.55, 1.55) - economy.firmDebt[f] * 0.55) /
        Math.max(0.35, 1 + discountRate * 4)
    );
    economy.firmEquityValue[f] = economy.firmEquityValue[f] * 0.86 + fundamental * 0.14;
    firmEquitySum += economy.firmEquityValue[f];
  }

  state.previousEquityPriceIndex = previousEquityPriceIndex;
  const rawEquityIndex = firmEquitySum / economy.baselineFirmEquityValue;
  const equityStressDiscount = 1 - clamp(policyShockAnnual * 2.6 + supplyChainStress * 0.12, 0, 0.35);
  const transformedEquityIndex = 1 + Math.log(Math.max(0.2, rawEquityIndex)) * 0.11;
  const targetEquityIndex = clamp(transformedEquityIndex * equityStressDiscount, 0.42, 1.75);
  state.equityPriceIndex = previousEquityPriceIndex * 0.82 + targetEquityIndex * 0.18;
  const equityReturn = state.equityPriceIndex / Math.max(0.001, previousEquityPriceIndex);
  for (let h = 0; h < economy.equityHoldings.length; h += 1) {
    economy.equityHoldings[h] *= equityReturn;
  }

  state.constructionDemandIndex = clamp(
    1 +
      (state.housingPriceIndex - 1) * 0.36 -
      Math.max(0, mortgageRateAnnual - config.policyRateAnnual - 0.01) * 2.4 -
      state.averageCreditTightness * 0.28 +
      demandSignal * 0.22,
    0.55,
    1.45
  );

  return {
    housingPriceIndex: state.housingPriceIndex,
    housingPriceGrowthAnnualized: Math.log(state.housingPriceIndex / Math.max(0.001, previousHousingPriceIndex)) * 12,
    equityPriceIndex: state.equityPriceIndex,
    equityReturnAnnualized: Math.log(state.equityPriceIndex / Math.max(0.001, previousEquityPriceIndex)) * 12,
    constructionOutputIndex
  };
}

function updateBankCredit(config: ScenarioConfig, economy: EconomyArrays): BankCreditPeriod {
  economy.bankMortgageBook.fill(0);
  economy.bankFirmLoanBook.fill(0);
  economy.bankCapital.fill(0);
  const mortgageStressByBank = new Float64Array(config.banks);
  const mortgageHouseholdsByBank = new Int32Array(config.banks);

  for (let h = 0; h < economy.householdBank.length; h += 1) {
    const bank = economy.householdBank[h];
    economy.bankMortgageBook[bank] += economy.mortgageDebt[h];
    if (economy.homeValue[h] > 0) {
      const ltv = economy.mortgageDebt[h] / economy.homeValue[h];
      mortgageStressByBank[bank] += clamp((ltv - 0.72) / 0.28, 0, 1.8);
      mortgageHouseholdsByBank[bank] += 1;
    }
  }

  for (let f = 0; f < config.firms; f += 1) {
    const bank = economy.firmBank[f];
    economy.bankFirmLoanBook[bank] += economy.firmDebt[f];
  }

  let tightnessSum = 0;
  for (let bank = 0; bank < config.banks; bank += 1) {
    const mortgageBook = economy.bankMortgageBook[bank];
    const firmLoanBook = economy.bankFirmLoanBook[bank];
    const assets = mortgageBook + firmLoanBook;
    const capital = 0.082 * assets + 4_000 + (bank % 5) * 375;
    const mortgageStress = mortgageStressByBank[bank] / Math.max(1, mortgageHouseholdsByBank[bank]);
    const firmStress = firmLoanBook / Math.max(1, firmLoanBook + capital * 8);
    economy.bankCapital[bank] = Math.max(1, capital * (1 - mortgageStress * 0.22));
    const capitalRatio = economy.bankCapital[bank] / Math.max(1, assets);
    const tightness = clamp(0.11 + mortgageStress * 0.46 + firmStress * 0.12 + Math.max(0, 0.085 - capitalRatio) * 3.2, 0.04, 0.72);
    economy.bankCreditTightness[bank] = tightness;
    tightnessSum += tightness;
  }

  economy.assetState.averageCreditTightness = tightnessSum / config.banks;
  return { averageCreditTightness: economy.assetState.averageCreditTightness };
}

function summarizeHouseholdAssets(economy: EconomyArrays, mortgageRates: MortgageRatePeriod): HouseholdAssetSummary {
  let netWorth = 0;
  let totalMortgageDebt = 0;
  let totalMortgageService = 0;
  let totalDebtService = 0;
  let totalIncomeProxy = 0;
  let collateralStress = 0;
  let equityHoldings = 0;
  let deposits = 0;

  for (let h = 0; h < economy.employerId.length; h += 1) {
    const mortgageRate =
      economy.variableMortgageShare[h] * mortgageRates.variableMortgageRateAnnual +
      (1 - economy.variableMortgageShare[h]) * mortgageRates.fixedMortgageRateAnnual;
    const mortgageService = economy.mortgageDebt[h] * (mortgageRate / 12 + 0.0028);
    const consumerService = economy.debt[h] * (0.006 + 0.004);
    const homeEquity = Math.max(0, economy.homeValue[h] - economy.mortgageDebt[h]);
    const ltv = economy.homeValue[h] > 0 ? economy.mortgageDebt[h] / economy.homeValue[h] : 0;
    const incomeProxy = (economy.employerId[h] >= 0 ? economy.wage[h] : economy.consumptionHabit[h] * 0.26) + 1;
    totalMortgageDebt += economy.mortgageDebt[h];
    totalMortgageService += mortgageService;
    totalDebtService += mortgageService + consumerService;
    totalIncomeProxy += incomeProxy;
    collateralStress += economy.homeValue[h] > 0 ? clamp((ltv - 0.72) / 0.28, 0, 1.8) : 0;
    equityHoldings += economy.equityHoldings[h];
    deposits += economy.deposits[h];
    netWorth += economy.deposits[h] + economy.equityHoldings[h] + homeEquity - economy.debt[h];
  }

  const riskyDenominator = Math.max(1, equityHoldings + deposits);
  const mortgageCreditGrowthAnnualized =
    ((totalMortgageDebt - economy.assetState.previousMortgageDebt) / Math.max(1, economy.assetState.previousMortgageDebt)) * 12;
  economy.assetState.previousMortgageDebt = totalMortgageDebt;

  return {
    householdNetWorthIndex: netWorth / economy.baselineNetWorth,
    mortgageDebtServiceRatio: totalMortgageService / Math.max(1, totalIncomeProxy),
    householdDebtServiceRatio: totalDebtService / Math.max(1, totalIncomeProxy),
    collateralConstraintIndex: collateralStress / economy.employerId.length,
    riskyAssetShare: equityHoldings / riskyDenominator,
    mortgageCreditGrowthAnnualized
  };
}

function summarizeAssetMarkets(finalPoint: SimulationPoint): AssetMarketSummary {
  return {
    housingPriceIndex: finalPoint.housingPriceIndex,
    equityPriceIndex: finalPoint.equityPriceIndex,
    constructionOutputIndex: finalPoint.constructionOutputIndex,
    mortgageRateAnnual: finalPoint.mortgageRateAnnual,
    mortgageDebtServiceRatio: finalPoint.mortgageDebtServiceRatio,
    mortgageCreditGrowthAnnualized: finalPoint.mortgageCreditGrowthAnnualized,
    householdNetWorthIndex: finalPoint.householdNetWorthIndex,
    riskyAssetShare: finalPoint.riskyAssetShare,
    collateralConstraintIndex: finalPoint.collateralConstraintIndex,
    bankCreditTightness: finalPoint.bankCreditTightness,
    variableMortgageShare: finalPoint.variableMortgageShare
  };
}

function rebalancePortfolio(
  config: ScenarioConfig,
  economy: EconomyArrays,
  household: number,
  policyRateAnnual: number,
  debtServiceRatio: number,
  homeEquity: number
): void {
  const rebalanceSpeed = clamp(config.portfolioRebalanceSpeed ?? 0.18, 0, 1) / 12;
  const liquidWealth = economy.deposits[household] + economy.equityHoldings[household];
  if (liquidWealth <= 0) {
    return;
  }

  const wealthBuffer = clamp((homeEquity + liquidWealth) / Math.max(1, economy.consumptionHabit[household] * 180), 0, 2);
  const targetRiskyShare = clamp(
    0.08 + wealthBuffer * 0.12 - Math.max(0, policyRateAnnual - 0.025) * 0.9 - debtServiceRatio * 0.18,
    0.02,
    0.42
  );
  const targetEquity = liquidWealth * targetRiskyShare;
  const trade = (targetEquity - economy.equityHoldings[household]) * rebalanceSpeed;

  if (trade > 0) {
    const buy = Math.min(economy.deposits[household], trade);
    economy.deposits[household] -= buy;
    economy.equityHoldings[household] += buy;
  } else if (trade < 0) {
    const sell = Math.min(economy.equityHoldings[household], -trade);
    economy.equityHoldings[household] -= sell;
    economy.deposits[household] += sell;
  }
}

function aggregateVariableMortgageShare(economy: EconomyArrays): number {
  let mortgageDebt = 0;
  let variableDebt = 0;
  for (let h = 0; h < economy.mortgageDebt.length; h += 1) {
    mortgageDebt += economy.mortgageDebt[h];
    variableDebt += economy.mortgageDebt[h] * economy.variableMortgageShare[h];
  }
  return variableDebt / Math.max(1, mortgageDebt);
}

function computeConstructionOutputIndex(config: ScenarioConfig, economy: EconomyArrays): number {
  const sector = constructionSectorId(config.sectors);
  let output = 0;
  for (let f = sector; f < config.firms; f += config.sectors) {
    output += economy.firmOutput[f];
  }
  return (output / economy.baselineConstructionOutput) * 100;
}

function updateHouseholds(
  config: ScenarioConfig,
  economy: EconomyArrays,
  previousInflationAnnualized: number,
  policyRateAnnual: number,
  loanRateAnnual: number,
  mortgageRates: MortgageRatePeriod,
  previousConsumptionIndex: number,
  rng: ReturnType<typeof createSeededRng>
): HouseholdPeriod {
  let totalConsumption = 0;
  let totalExpectation = 0;
  let totalDeposits = 0;
  let budgetConsistent = true;
  const ruleCounts = { handToMouth: 0, liquidityBuffer: 0, habit: 0, debtStress: 0 };
  const targetInflation = config.targetInflationAnnual ?? 0.02;
  const credibility = clamp(config.centralBankCredibility ?? 0.55, 0, 1);
  const debtServiceSensitivity = config.debtServiceSensitivity ?? 0.42;
  const switchingIntensity = clamp(config.ruleSwitchingIntensity ?? 0.18, 0, 1);
  const wealthEffectStrength = clamp(config.wealthEffectStrength ?? 0.16, 0, 1);
  const collateralEffectStrength = clamp(config.collateralEffectStrength ?? 0.24, 0, 1);

  for (let h = 0; h < economy.employerId.length; h += 1) {
    const employer = economy.employerId[h];
    const wageIncome = employer >= 0 ? economy.wage[h] * economy.hours[h] : economy.consumptionHabit[h] * 0.26;
    const interestIncome = economy.deposits[h] * Math.max(0, policyRateAnnual - 0.012) / 12;
    const consumerInterestDue = economy.debt[h] * (loanRateAnnual / 12);
    const consumerPrincipalDue = Math.min(economy.debt[h], economy.debt[h] * 0.004);
    const householdMortgageRate =
      economy.variableMortgageShare[h] * mortgageRates.variableMortgageRateAnnual +
      (1 - economy.variableMortgageShare[h]) * mortgageRates.fixedMortgageRateAnnual;
    const mortgageInterestDue = economy.mortgageDebt[h] * (householdMortgageRate / 12);
    const mortgagePrincipalDue = Math.min(economy.mortgageDebt[h], economy.mortgageDebt[h] * 0.0028);
    const debtService = consumerInterestDue + consumerPrincipalDue + mortgageInterestDue + mortgagePrincipalDue;
    const expectation = updateInflationExpectation(
      economy,
      h,
      previousInflationAnnualized,
      targetInflation,
      credibility,
      previousConsumptionIndex
    );
    economy.inflationExpectation[h] = expectation;

    const homeEquity = Math.max(0, economy.homeValue[h] - economy.mortgageDebt[h]);
    const ltv = economy.homeValue[h] > 0 ? economy.mortgageDebt[h] / economy.homeValue[h] : 0;
    const collateralHeadroom = Math.max(0, economy.homeValue[h] * 0.82 - economy.mortgageDebt[h]);
    const creditAvailability = clamp(1 - economy.assetState.averageCreditTightness, 0.15, 1);
    const mortgageRateDrag = clamp(mortgageRates.averageMortgageRateAnnual - config.policyRateAnnual, 0, 0.08);
    const collateralDraw =
      collateralHeadroom *
      collateralEffectStrength *
      creditAvailability *
      clamp(0.0014 - mortgageRateDrag * 0.01, 0.00015, 0.0014);
    const wealthSignal =
      (economy.assetState.housingPriceIndex - 1) * (economy.homeValue[h] > 0 ? 0.72 : 0) +
      (economy.assetState.equityPriceIndex - 1) * (economy.equityHoldings[h] > 0 ? 0.38 : 0);
    const collateralStress = clamp(Math.max(0, ltv - 0.78) * 1.8 + mortgageRateDrag * 2.5, 0, 0.45);
    const incomeBeforeConsumption = economy.deposits[h] + wageIncome + interestIncome + collateralDraw - debtService;
    const debtServiceRatio = debtService / Math.max(1, wageIncome + interestIncome);
    const consumption = chooseConsumption(
      economy.householdBehavior[h],
      incomeBeforeConsumption,
      economy.deposits[h],
      economy.debt[h],
      debtServiceRatio,
      economy.consumptionHabit[h],
      expectation,
      debtServiceSensitivity,
      wealthSignal * wealthEffectStrength,
      collateralStress
    );
    const boundedConsumption = clamp(consumption, 0, Math.max(0, incomeBeforeConsumption));
    const newDeposits = incomeBeforeConsumption - boundedConsumption;

    if (!Number.isFinite(newDeposits) || !Number.isFinite(boundedConsumption) || boundedConsumption < 0) {
      budgetConsistent = false;
    }

    economy.deposits[h] = Math.max(0, newDeposits);
    economy.debt[h] = Math.max(0, economy.debt[h] - consumerPrincipalDue);
    economy.mortgageDebt[h] = Math.max(0, economy.mortgageDebt[h] + collateralDraw - mortgagePrincipalDue);
    economy.consumptionHabit[h] = 0.88 * economy.consumptionHabit[h] + 0.12 * boundedConsumption;
    rebalancePortfolio(config, economy, h, policyRateAnnual, debtServiceRatio, homeEquity);

    if (rng.nextFloat() < switchingIntensity / 12) {
      economy.householdBehavior[h] = chooseNextBehavior(
        economy.householdBehavior[h],
        debtServiceRatio,
        economy.deposits[h],
        economy.consumptionHabit[h],
        expectation,
        rng
      );
    }

    totalConsumption += boundedConsumption;
    totalExpectation += expectation;
    totalDeposits += economy.deposits[h];
    incrementRuleCount(ruleCounts, economy.householdBehavior[h]);
  }

  const households = economy.employerId.length;
  return {
    consumptionIndex: totalConsumption / economy.baselineConsumption,
    averageInflationExpectation: totalExpectation / households,
    householdDepositsIndex: totalDeposits / economy.baselineDeposits,
    ruleMix: {
      handToMouth: ruleCounts.handToMouth / households,
      liquidityBuffer: ruleCounts.liquidityBuffer / households,
      habit: ruleCounts.habit / households,
      debtStress: ruleCounts.debtStress / households
    },
    budgetConsistent
  };
}

function updateLaborMarket(
  config: ScenarioConfig,
  economy: EconomyArrays,
  rng: ReturnType<typeof createSeededRng>,
  policyShockAnnual: number,
  consumptionIndex: number,
  averageInflationExpectation: number,
  constructionDemandIndex: number
): { hires: number; layoffs: number; vacancies: number } {
  let hires = 0;
  let layoffs = 0;
  let vacancies = 0;
  const firingFriction = clamp(config.firingFriction ?? 0.45, 0, 1);
  const matchingFriction = clamp(config.matchingFriction ?? 0.35, 0, 0.95);
  const wageIndexation = clamp(config.wageIndexation ?? 0.28, 0, 1);
  const demandIndex = clamp(consumptionIndex, 0.65, 1.35);

  for (let f = 0; f < config.firms; f += 1) {
    if (economy.firmDefaulted[f] === 1) {
      continue;
    }

    const stage = economy.firmStage[f];
    const baseLabor = economy.firmBaseLabor[f];
    const demandSensitivity = 0.25 + stage * 0.08 + economy.firmWorkingCapitalExposure[f] * 0.18;
    const idiosyncraticDemand = (rng.nextFloat() - 0.5) * 0.035;
    const constructionDemand =
      economy.firmSector[f] === constructionSectorId(config.sectors)
        ? (constructionDemandIndex - 1) * (config.constructionDemandSensitivity ?? 0.38)
        : 0;
    const expectedDemand =
      0.78 +
      demandIndex * 0.28 +
      constructionDemand -
      policyShockAnnual * 2.8 * demandSensitivity +
      idiosyncraticDemand;
    const desiredLabor = Math.max(1, Math.round(baseLabor * clamp(expectedDemand, 0.55, 1.45)));
    const currentLabor = economy.firmLabor[f];
    const laborTightness = economy.unemployedPool.length / Math.max(1, config.households);
    const wagePressure = wageIndexation * averageInflationExpectation + (0.08 - laborTightness) * 0.015;
    economy.firmWageOffer[f] *= clamp(1 + wagePressure / 12, 0.985, 1.035);

    if (desiredLabor > currentLabor) {
      const firmVacancies = desiredLabor - currentLabor;
      vacancies += firmVacancies;
      const fillableVacancies = Math.floor(firmVacancies * (1 - matchingFriction) * (0.82 + rng.nextFloat() * 0.28));
      const actualHires = hireWorkers(economy, f, fillableVacancies, rng);
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

function updateSupplyChain(
  config: ScenarioConfig,
  economy: EconomyArrays,
  policyShockAnnual: number,
  consumptionIndex: number,
  rng: ReturnType<typeof createSeededRng>
): SupplyChainPeriod {
  const inputAvailability = new Float64Array(config.firms);
  const inputCostPressure = computeNetworkInputPressure(economy);
  const targetMonths = config.inputInventoryTargetMonths ?? config.inventoryBufferMonths ?? 1.5;
  const baseMonths = config.inventoryBufferMonths ?? 1.5;
  const targetScale = clamp(targetMonths / Math.max(0.25, baseMonths), 0.45, 2.5);
  const deliveryFailureSensitivity = clamp(config.deliveryFailureSensitivity ?? 0.42, 0, 1.5);
  const supplierRewireRate = clamp(config.supplierRewireRate ?? 0.16, 0, 1);
  const inputSubstitutionElasticity = clamp(config.inputSubstitutionElasticity ?? 0.22, 0, 1);
  let deliveryAttempts = 0;
  let deliveryFailures = 0;
  let rewiredEdges = 0;
  let inputInventorySum = 0;
  let backlogSum = 0;
  let targetSum = 0;

  for (let buyer = 0; buyer < config.firms; buyer += 1) {
    const targetInventory = Math.max(1, economy.firmInputTarget[buyer] * targetScale);
    const desiredOrder = economy.firmDefaulted[buyer]
      ? 0
      : Math.max(0, targetInventory - economy.firmInputInventory[buyer] + economy.firmBacklog[buyer] * 0.35);
    let buyerDelivered = 0;
    let weightedReliability = 0;

    for (
      let edge = economy.supplierNetwork.supplierPtr[buyer];
      edge < economy.supplierNetwork.supplierPtr[buyer + 1];
      edge += 1
    ) {
      const supplier = economy.supplierNetwork.supplierId[edge];
      const weight = economy.supplierNetwork.contractWeight[edge];
      weightedReliability += economy.firmReliability[supplier] * weight;

      if (desiredOrder <= 0.01) {
        continue;
      }

      deliveryAttempts += 1;
      economy.firmDeliveryAttempts[buyer] += 1;

      const orderQuantity = desiredOrder * weight;
      const supplierBacklogRatio = economy.firmBacklog[supplier] / Math.max(1, economy.firmInputTarget[supplier]);
      const supplierInventoryRatio =
        economy.firmInventory[supplier] / Math.max(1, economy.firmOutput[supplier] + economy.firmBaseLabor[supplier]);
      const supplierPricePressure = Math.max(0, inputCostPressure[supplier] - 1);
      const fragility =
        (1 - economy.firmReliability[supplier]) * 0.55 +
        clamp(supplierBacklogRatio, 0, 2) * 0.23 +
        Math.max(0, 0.5 - supplierInventoryRatio) * 0.08 +
        supplierPricePressure * 0.11;
      const failureProbability = clamp(
        0.012 +
          fragility * deliveryFailureSensitivity +
          policyShockAnnual * deliveryFailureSensitivity * 2.4 +
          Math.max(0, 1 - consumptionIndex) * 0.025,
        0.004,
        0.55
      );
      const failed = economy.firmDefaulted[supplier] === 1 || rng.nextFloat() < failureProbability;

      if (failed) {
        deliveryFailures += 1;
        economy.firmDeliveryFailures[buyer] += 1;
        economy.firmBacklog[buyer] += orderQuantity * (0.18 + deliveryFailureSensitivity * 0.16);
        economy.firmReliability[supplier] = clamp(economy.firmReliability[supplier] * 0.985, 0.38, 0.99);

        if (rng.nextFloat() < supplierRewireRate) {
          economy.supplierNetwork.supplierId[edge] = drawReplacementSupplier(config, economy, buyer, rng);
          rewiredEdges += 1;
        }
      } else {
        const deliveryQuantity = orderQuantity * clamp(0.76 + economy.firmReliability[supplier] * 0.28, 0.62, 1.03);
        buyerDelivered += deliveryQuantity;
        economy.firmReliability[supplier] = clamp(0.992 * economy.firmReliability[supplier] + 0.008 * 0.98, 0.38, 0.99);
        economy.firmInventory[supplier] = Math.max(0, economy.firmInventory[supplier] - deliveryQuantity * 0.018);
      }
    }

    economy.firmInputInventory[buyer] = clamp(
      economy.firmInputInventory[buyer] + buyerDelivered,
      0,
      targetInventory * 3
    );
    economy.firmInputCostIndex[buyer] = clamp(inputCostPressure[buyer] * (1 + (1 - weightedReliability) * 0.08), 0.55, 2.2);
    const inventoryRatio = economy.firmInputInventory[buyer] / targetInventory;
    const backlogRatio = economy.firmBacklog[buyer] / targetInventory;
    inputAvailability[buyer] = economy.firmDefaulted[buyer]
      ? 0.35
      : clamp(0.48 + inventoryRatio * 0.52 - backlogRatio * 0.18 + inputSubstitutionElasticity * 0.12, 0.35, 1.16);

    if (inputAvailability[buyer] > 0.9) {
      economy.firmBacklog[buyer] *= 0.9;
    } else {
      economy.firmBacklog[buyer] *= 0.985;
    }

    inputInventorySum += economy.firmInputInventory[buyer];
    backlogSum += economy.firmBacklog[buyer];
    targetSum += targetInventory;
  }

  const supplierEdges = Math.max(1, economy.supplierNetwork.supplierId.length);
  return {
    inputAvailability,
    deliveryAttempts,
    deliveryFailures,
    rewiredEdges,
    deliveryFailureRate: deliveryFailures / Math.max(1, deliveryAttempts),
    supplierRewireShare: rewiredEdges / supplierEdges,
    backlogIndex: backlogSum / Math.max(1, targetSum),
    inputInventoryIndex: inputInventorySum / economy.baselineInputInventory
  };
}

function updateFirms(
  config: ScenarioConfig,
  economy: EconomyArrays,
  supplyChainPeriod: SupplyChainPeriod,
  loanRateAnnual: number,
  policyShockAnnual: number,
  consumptionIndex: number,
  constructionDemandIndex: number
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
  const demandMultiplier = clamp(0.62 + consumptionIndex * 0.42, 0.62, 1.28);
  const constructionSector = constructionSectorId(config.sectors);

  for (let f = 0; f < config.firms; f += 1) {
    const labor = economy.firmLabor[f];
    const laborCapacity = Math.pow(labor + 1, 0.62);
    const capitalCapacity = Math.pow(economy.firmCapital[f], 0.28);
    const inputCostIndex = economy.firmInputCostIndex[f];
    const inputAvailability = supplyChainPeriod.inputAvailability[f];
    const shortageStress = Math.max(0, 1 - inputAvailability);
    const backlogStress = economy.firmBacklog[f] / Math.max(1, economy.firmInputTarget[f]);
    const inputStress = clamp(inputCostIndex - 1 + shortageStress * 0.68 + backlogStress * 0.18, -0.35, 0.9);
    const sectorDemandMultiplier =
      economy.firmSector[f] === constructionSector
        ? clamp(demandMultiplier * (0.82 + constructionDemandIndex * 0.22), 0.5, 1.45)
        : demandMultiplier;
    const plannedOutput = economy.firmProductivity[f] * laborCapacity * capitalCapacity * sectorDemandMultiplier;
    const inputNeeded = plannedOutput * economy.firmInputRequirement[f];
    const inputUsed = Math.min(economy.firmInputInventory[f], inputNeeded);
    const inputBottleneck = inputNeeded > 0 ? inputUsed / inputNeeded : 1;
    const supplyPenalty = clamp(0.58 + inputBottleneck * 0.42 - Math.max(0, inputStress) * 0.08, 0.42, 1.04);
    const output = plannedOutput * supplyPenalty;
    economy.firmOutput[f] = output;
    economy.firmInputInventory[f] = Math.max(0, economy.firmInputInventory[f] - inputUsed);
    if (inputBottleneck < 0.98) {
      economy.firmBacklog[f] += (1 - inputBottleneck) * inputNeeded * 0.72;
    } else {
      economy.firmBacklog[f] *= 0.94;
    }
    totalOutput += output;

    const bankSpread = (economy.firmBank[f] % 7) * 0.0005;
    const creditTightness = economy.bankCreditTightness[economy.firmBank[f]];
    const effectiveLoanRateAnnual = loanRateAnnual + bankSpread + creditTightness * 0.018;
    const wageBill = economy.firmWageBill[f];
    const inputCost = output * inputCostIndex * (0.24 + economy.firmInputRequirement[f] * 0.88);
    const workingCapitalNeed = Math.max(0, wageBill + inputCost - economy.firmCash[f] * 0.18);
    const workingCapitalCost =
      workingCapitalNeed * (effectiveLoanRateAnnual / 12) * economy.firmWorkingCapitalExposure[f];
    const unitLaborCost = wageBill / Math.max(1, output * 100);
    const markupPressure = (economy.firmMarkup[f] - 0.15) * 0.003;
    const marginalCostPressure =
      unitLaborCost * 0.02 + inputStress * 0.03 + workingCapitalCost / Math.max(10_000, wageBill + inputCost);
    const laborDemandPressure = clamp((labor - economy.firmBaseLabor[f]) / Math.max(1, economy.firmBaseLabor[f]), -0.4, 0.4);
    const householdDemandPressure = clamp(consumptionIndex - 1, -0.45, 0.45);
    const desiredMonthlyPriceChange =
      0.0011 +
      markupPressure +
      marginalCostPressure * (0.8 + costChannelStrength) +
      laborDemandPressure * 0.008 +
      householdDemandPressure * 0.012 +
      backlogStress * 0.01 +
      policyShockAnnual * costChannelStrength * economy.firmWorkingCapitalExposure[f] * 0.055;
    const adjustmentShare = 1 - economy.firmPriceStickiness[f];
    economy.firmPrice[f] *= clamp(1 + desiredMonthlyPriceChange * adjustmentShare, 0.965, 1.055);

    const revenue = output * economy.firmPrice[f] * 100;
    totalDebtBefore += economy.firmDebt[f];
    const newDebt = Math.max(0, workingCapitalNeed * clamp(0.14 - creditTightness * 0.08, 0.04, 0.14) - economy.firmCash[f] * 0.05);
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

    stressSum += Math.max(0, inputStress) + backlogStress * 0.12 + (economy.firmDefaulted[f] ? 0.08 : 0);
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
  economy: EconomyArrays,
  firm: number,
  vacancies: number,
  rng: ReturnType<typeof createSeededRng>
): number {
  let hires = 0;
  while (hires < vacancies && economy.unemployedPool.length > 0) {
    const worker = economy.unemployedPool.pop();
    if (worker === undefined || economy.employerId[worker] !== -1) {
      continue;
    }
    economy.employerId[worker] = firm;
    economy.hours[worker] = 1;
    economy.wage[worker] = economy.firmWageOffer[firm] * (0.9 + rng.nextFloat() * 0.2) * economy.firmQuality[firm];
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

function updateInflationExpectation(
  economy: EconomyArrays,
  household: number,
  previousInflationAnnualized: number,
  targetInflation: number,
  credibility: number,
  previousConsumptionIndex: number
): number {
  const oldExpectation = economy.inflationExpectation[household];
  const employer = economy.employerId[household];
  const employerSignal = employer >= 0 ? (economy.firmPrice[employer] - 1) * 0.05 : 0;
  const demandSignal = (previousConsumptionIndex - 1) * 0.025;
  let next = oldExpectation;

  switch (economy.expectationRule[household]) {
    case Expectation.Adaptive:
      next = 0.68 * oldExpectation + 0.32 * previousInflationAnnualized;
      break;
    case Expectation.Anchored:
      next = credibility * targetInflation + (1 - credibility) * (0.72 * oldExpectation + 0.28 * previousInflationAnnualized);
      break;
    case Expectation.Extrapolative:
      next = previousInflationAnnualized + 0.32 * (previousInflationAnnualized - oldExpectation);
      break;
    case Expectation.EmployerSector:
      next = 0.62 * oldExpectation + 0.28 * previousInflationAnnualized + employerSignal + demandSignal;
      break;
  }

  return clamp(next, -0.05, 0.18);
}

function chooseConsumption(
  behavior: number,
  available: number,
  deposits: number,
  debt: number,
  debtServiceRatio: number,
  habit: number,
  expectation: number,
  debtServiceSensitivity: number,
  wealthEffect: number,
  collateralStress: number
): number {
  if (available <= 0) {
    return 0;
  }

  const assetAdjustment = clamp(1 + wealthEffect - collateralStress, 0.72, 1.18);

  switch (behavior) {
    case Behavior.HandToMouth:
      return available * clamp(0.9 + expectation * 0.7, 0.78, 0.97) * assetAdjustment;
    case Behavior.LiquidityBuffer: {
      const targetBuffer = habit * 6;
      const bufferGap = clamp((targetBuffer - deposits) / Math.max(1, targetBuffer), -0.5, 1);
      return available * clamp(0.68 - bufferGap * 0.22 - expectation * 0.35, 0.36, 0.78) * assetAdjustment;
    }
    case Behavior.Habit:
      return clamp(habit * (0.92 + expectation * 0.8) * assetAdjustment, available * 0.35, available * 0.9);
    case Behavior.DebtStress: {
      const stressCut = debtServiceSensitivity * debtServiceRatio + Math.min(0.18, debt / Math.max(1, deposits + habit * 12) * 0.025);
      return available * clamp(0.74 - stressCut - collateralStress * 0.16, 0.28, 0.78) * clamp(1 + wealthEffect * 0.4, 0.88, 1.08);
    }
    default:
      return available * 0.7;
  }
}

function chooseNextBehavior(
  currentBehavior: number,
  debtServiceRatio: number,
  deposits: number,
  habit: number,
  expectation: number,
  rng: ReturnType<typeof createSeededRng>
): number {
  if (debtServiceRatio > 0.24) {
    return Behavior.DebtStress;
  }
  if (deposits < habit * 1.25) {
    return Behavior.HandToMouth;
  }
  if (deposits < habit * 4 || expectation > 0.045) {
    return Behavior.LiquidityBuffer;
  }
  if (rng.nextFloat() < 0.18) {
    return currentBehavior;
  }
  return Behavior.Habit;
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
    for (
      let edge = economy.supplierNetwork.supplierPtr[buyer];
      edge < economy.supplierNetwork.supplierPtr[buyer + 1];
      edge += 1
    ) {
      weightedPrice +=
        economy.firmPrice[economy.supplierNetwork.supplierId[edge]] *
        economy.supplierNetwork.contractWeight[edge];
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

function computePotentialOutput(economy: EconomyArrays, consumptionIndex: number): number {
  let total = 0;
  for (let f = 0; f < economy.firmOutput.length; f += 1) {
    const laborCapacity = Math.pow(economy.firmLabor[f] + 1, 0.62);
    const capitalCapacity = Math.pow(economy.firmCapital[f], 0.28);
    total += economy.firmProductivity[f] * laborCapacity * capitalCapacity * consumptionIndex;
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

function summarizeSectors(config: ScenarioConfig, economy: EconomyArrays): SectorSummary[] {
  const priceSum = new Float64Array(config.sectors);
  const outputSum = new Float64Array(config.sectors);
  const inputCostSum = new Float64Array(config.sectors);
  const inputInventorySum = new Float64Array(config.sectors);
  const inputTargetSum = new Float64Array(config.sectors);
  const backlogSum = new Float64Array(config.sectors);
  const deliveryAttempts = new Int32Array(config.sectors);
  const deliveryFailures = new Int32Array(config.sectors);
  const firmCount = new Int32Array(config.sectors);

  for (let f = 0; f < config.firms; f += 1) {
    const sector = economy.firmSector[f];
    priceSum[sector] += economy.firmPrice[f];
    outputSum[sector] += economy.firmOutput[f];
    inputCostSum[sector] += economy.firmInputCostIndex[f];
    inputInventorySum[sector] += economy.firmInputInventory[f];
    inputTargetSum[sector] += economy.firmInputTarget[f];
    backlogSum[sector] += economy.firmBacklog[f];
    deliveryAttempts[sector] += economy.firmDeliveryAttempts[f];
    deliveryFailures[sector] += economy.firmDeliveryFailures[f];
    firmCount[sector] += 1;
  }

  const sectors: SectorSummary[] = [];
  for (let sector = 0; sector < config.sectors; sector += 1) {
    const firms = Math.max(1, firmCount[sector]);
    sectors.push({
      sectorId: sector,
      stageId: stageForSector(sector, config.sectors),
      firms: firmCount[sector],
      priceIndex: priceSum[sector] / firms,
      outputIndex: (outputSum[sector] / Math.max(1, economy.sectorOutputBaseline[sector])) * 100,
      inputCostIndex: inputCostSum[sector] / firms,
      inputInventoryIndex: inputInventorySum[sector] / Math.max(1, inputTargetSum[sector]),
      backlogIndex: backlogSum[sector] / Math.max(1, inputTargetSum[sector]),
      deliveryFailureRate: deliveryFailures[sector] / Math.max(1, deliveryAttempts[sector])
    });
  }

  return sectors;
}

function summarizeNetwork(
  economy: EconomyArrays,
  deliveryAttempts: number,
  deliveryFailures: number,
  rewiredEdges: number,
  finalPeriod: SupplyChainPeriod | undefined
): NetworkSummary {
  const supplierEdges = economy.supplierNetwork.supplierId.length;
  return {
    supplierEdges,
    deliveryAttempts,
    deliveryFailures,
    rewiredEdges,
    deliveryFailureRate: deliveryFailures / Math.max(1, deliveryAttempts),
    supplierRewireShare: rewiredEdges / Math.max(1, deliveryAttempts),
    backlogIndex: finalPeriod?.backlogIndex ?? 0,
    inputInventoryIndex: finalPeriod?.inputInventoryIndex ?? 1
  };
}

function normalizeHouseholdRuleMix(mix: HouseholdRuleMix | undefined): HouseholdRuleMix {
  const raw = mix ?? { handToMouth: 0.35, liquidityBuffer: 0.3, habit: 0.2, debtStress: 0.15 };
  const sum = raw.handToMouth + raw.liquidityBuffer + raw.habit + raw.debtStress || 1;
  return {
    handToMouth: raw.handToMouth / sum,
    liquidityBuffer: raw.liquidityBuffer / sum,
    habit: raw.habit / sum,
    debtStress: raw.debtStress / sum
  };
}

function normalizeExpectationRuleMix(mix: ExpectationRuleMix | undefined): ExpectationRuleMix {
  const raw = mix ?? { adaptive: 0.48, anchored: 0.32, extrapolative: 0.1, employerSector: 0.1 };
  const sum = raw.adaptive + raw.anchored + raw.extrapolative + raw.employerSector || 1;
  return {
    adaptive: raw.adaptive / sum,
    anchored: raw.anchored / sum,
    extrapolative: raw.extrapolative / sum,
    employerSector: raw.employerSector / sum
  };
}

function drawBehaviorType(mix: HouseholdRuleMix, draw: number): number {
  if (draw < mix.handToMouth) {
    return Behavior.HandToMouth;
  }
  if (draw < mix.handToMouth + mix.liquidityBuffer) {
    return Behavior.LiquidityBuffer;
  }
  if (draw < mix.handToMouth + mix.liquidityBuffer + mix.habit) {
    return Behavior.Habit;
  }
  return Behavior.DebtStress;
}

function drawExpectationType(mix: ExpectationRuleMix, draw: number): number {
  if (draw < mix.adaptive) {
    return Expectation.Adaptive;
  }
  if (draw < mix.adaptive + mix.anchored) {
    return Expectation.Anchored;
  }
  if (draw < mix.adaptive + mix.anchored + mix.extrapolative) {
    return Expectation.Extrapolative;
  }
  return Expectation.EmployerSector;
}

function incrementRuleCount(ruleCounts: { handToMouth: number; liquidityBuffer: number; habit: number; debtStress: number }, behavior: number): void {
  if (behavior === Behavior.HandToMouth) {
    ruleCounts.handToMouth += 1;
  } else if (behavior === Behavior.LiquidityBuffer) {
    ruleCounts.liquidityBuffer += 1;
  } else if (behavior === Behavior.Habit) {
    ruleCounts.habit += 1;
  } else {
    ruleCounts.debtStress += 1;
  }
}

function computeAverage(values: Float64Array): number {
  let sum = 0;
  for (const value of values) {
    sum += value;
  }
  return sum / values.length;
}

function computeAveragePositive(values: Float64Array): number {
  let sum = 0;
  let count = 0;
  for (const value of values) {
    if (value > 0) {
      sum += value;
      count += 1;
    }
  }
  return count > 0 ? sum / count : 1;
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

function drawReplacementSupplier(
  config: ScenarioConfig,
  economy: EconomyArrays,
  buyer: number,
  rng: ReturnType<typeof createSeededRng>
): number {
  const buyerSector = economy.firmSector[buyer];
  const upstreamOffset = 1 + Math.floor(rng.nextFloat() * Math.min(4, config.sectors));
  const supplierSector = (buyerSector - upstreamOffset + config.sectors) % config.sectors;
  let supplier = firmIdForSector(config.firms, config.sectors, supplierSector, rng);
  if (supplier === buyer) {
    supplier = (supplier + config.sectors) % config.firms;
  }
  return supplier;
}

function constructionSectorId(sectors: number): number {
  return Math.min(sectors - 1, Math.max(0, Math.floor(sectors * 0.5)));
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
    throw new Error("Scenario must have at least as many households as firms for the explicit labor market.");
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
