import { useMemo, useState } from "react";
import { firstStructuralDemoConfig, researchScaleMilestoneConfig, runRateHikeExperiment } from "@world-abm/core";
import type { ScenarioConfig } from "@world-abm/core";
import { AssetChannelsPanel } from "./components/AssetChannelsPanel";
import { CounterfactualChart } from "./components/CounterfactualChart";
import { ControlSlider } from "./components/ControlSlider";
import { MetricTile } from "./components/MetricTile";
import { PathChart } from "./components/PathChart";
import { ProductionNetworkPanel } from "./components/ProductionNetworkPanel";

export function App() {
  const [handToMouth, setHandToMouth] = useState(0.35);
  const [liquidityBuffer, setLiquidityBuffer] = useState(0.3);
  const [habit, setHabit] = useState(0.2);
  const [debtStress, setDebtStress] = useState(0.15);
  const [anchoredExpectations, setAnchoredExpectations] = useState(0.32);
  const [matchingFriction, setMatchingFriction] = useState(firstStructuralDemoConfig.matchingFriction ?? 0.35);
  const [wageIndexation, setWageIndexation] = useState(firstStructuralDemoConfig.wageIndexation ?? 0.28);
  const [ruleSwitching, setRuleSwitching] = useState(firstStructuralDemoConfig.ruleSwitchingIntensity ?? 0.18);
  const [inputInventoryTarget, setInputInventoryTarget] = useState(firstStructuralDemoConfig.inputInventoryTargetMonths ?? 1.6);
  const [deliveryFailureSensitivity, setDeliveryFailureSensitivity] = useState(
    firstStructuralDemoConfig.deliveryFailureSensitivity ?? 0.42
  );
  const [supplierRewireRate, setSupplierRewireRate] = useState(firstStructuralDemoConfig.supplierRewireRate ?? 0.16);
  const [inputSubstitution, setInputSubstitution] = useState(firstStructuralDemoConfig.inputSubstitutionElasticity ?? 0.22);
  const [variableMortgageShare, setVariableMortgageShare] = useState(firstStructuralDemoConfig.variableMortgageShare ?? 0.9);
  const [wealthEffectStrength, setWealthEffectStrength] = useState(firstStructuralDemoConfig.wealthEffectStrength ?? 0.16);
  const [collateralEffectStrength, setCollateralEffectStrength] = useState(
    firstStructuralDemoConfig.collateralEffectStrength ?? 0.24
  );
  const [constructionDemandSensitivity, setConstructionDemandSensitivity] = useState(
    firstStructuralDemoConfig.constructionDemandSensitivity ?? 0.38
  );
  const [portfolioRebalanceSpeed, setPortfolioRebalanceSpeed] = useState(
    firstStructuralDemoConfig.portfolioRebalanceSpeed ?? 0.18
  );

  const scenario = useMemo<ScenarioConfig>(
    () => ({
      ...firstStructuralDemoConfig,
      householdRuleMix: {
        handToMouth,
        liquidityBuffer,
        habit,
        debtStress
      },
      expectationRuleMix: {
        adaptive: Math.max(0.05, 0.78 - anchoredExpectations),
        anchored: anchoredExpectations,
        extrapolative: 0.1,
        employerSector: 0.12
      },
      matchingFriction,
      wageIndexation,
      ruleSwitchingIntensity: ruleSwitching,
      inputInventoryTargetMonths: inputInventoryTarget,
      deliveryFailureSensitivity,
      supplierRewireRate,
      inputSubstitutionElasticity: inputSubstitution,
      variableMortgageShare,
      wealthEffectStrength,
      collateralEffectStrength,
      constructionDemandSensitivity,
      portfolioRebalanceSpeed
    }),
    [
      anchoredExpectations,
      debtStress,
      deliveryFailureSensitivity,
      habit,
      handToMouth,
      inputInventoryTarget,
      inputSubstitution,
      liquidityBuffer,
      matchingFriction,
      collateralEffectStrength,
      constructionDemandSensitivity,
      portfolioRebalanceSpeed,
      ruleSwitching,
      supplierRewireRate,
      variableMortgageShare,
      wealthEffectStrength,
      wageIndexation
    ]
  );
  const experiment = useMemo(
    () =>
      runRateHikeExperiment(scenario, {
        experimentName: "browser_paired_100bps_rate_hike",
        seeds: [scenario.seed, scenario.seed + 101]
      }),
    [scenario]
  );
  const result = experiment.treatment;
  const finalPoint = result.path[result.path.length - 1];
  const baselineFinalPoint = experiment.baseline.path[experiment.baseline.path.length - 1];
  const stressedSectorCount = result.sectors.filter((sector) => sector.backlogIndex > 0.05 || sector.deliveryFailureRate > 0.05).length;
  const researchSupplierEdges =
    researchScaleMilestoneConfig.firms * (researchScaleMilestoneConfig.supplierEdgesPerFirm ?? 0);

  return (
    <main className="amor-page">
      <section className="hero">
        <div className="hero-backdrop" />
        <div className="amor-shell hero-content">
          <header className="topbar" aria-label="Project header">
            <div className="brand-lockup">
              <img src="/economic-world-abm/amor/geodesic-color.svg" alt="" />
              <span className="amor-wordmark">AMOR</span>
            </div>
            <span className="repo-label">economic-world-abm</span>
          </header>

          <div className="hero-grid">
            <div className="hero-copy">
              <p className="amor-kicker">Computational laboratory</p>
              <h1>Large ABM laboratory for inflation and interest rates</h1>
              <p className="hero-lede">
                We use a large heterogeneous-agent ABM to study the inflation-interest-rate relationship across
                households, firms, banks, employer-worker links, and production networks. Browser runs are reduced-scale;
                Milestone 6 adds a separate offline engine for million-household research-scale experiments.
              </p>
              <div className="hero-actions">
                <a className="amor-button" href="#scaffold-status">
                  View scaffold
                </a>
                <a className="amor-button secondary" href="#model-warning">
                  Read warning
                </a>
              </div>
            </div>

            <aside className="hero-snapshot amor-panel" aria-label="Current scaffold snapshot">
              <span className="snapshot-title">Milestone 6 research scale</span>
              <dl>
                <div>
                  <dt>Households</dt>
                  <dd>{firstStructuralDemoConfig.households.toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Firms</dt>
                  <dd>{firstStructuralDemoConfig.firms.toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Banks</dt>
                  <dd>{firstStructuralDemoConfig.banks.toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Primary economy</dt>
                  <dd>{firstStructuralDemoConfig.economyContext}</dd>
                </div>
                <div>
                  <dt>Research target</dt>
                  <dd>{researchScaleMilestoneConfig.households.toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Offline firms</dt>
                  <dd>{researchScaleMilestoneConfig.firms.toLocaleString()}</dd>
                </div>
              </dl>
            </aside>
          </div>
        </div>
      </section>

      <section className="status-band" id="model-warning">
        <div className="amor-shell">
          <div className="model-warning">
            This is a model-generated counterfactual laboratory, not a forecast and not policy advice. Early scaffold
            charts verify architecture and reproducibility. Million-household outputs are generated by the offline
            engine, then summarized into compressed artifacts. Economic claims require Norway/EU calibration, paired
            seeds, sensitivity analysis, and documented limitations.
          </div>
        </div>
      </section>

      <section className="amor-shell content-section" id="scaffold-status">
        <div className="section-heading">
          <p className="amor-kicker">Milestone 6</p>
          <h2>Research-scale offline engine</h2>
          <p className="section-note">
            The new Python engine uses typed household, firm, bank, and sparse-network arrays, writes compressed
            artifacts, and includes cross-scale validation before million-household runs are treated as research output.
          </p>
        </div>
        <div className="metric-grid">
          <MetricTile label="Offline households" value={researchScaleMilestoneConfig.households.toLocaleString()} detail="Research-scale target" />
          <MetricTile label="Offline firms" value={researchScaleMilestoneConfig.firms.toLocaleString()} detail="Array-oriented firm state" />
          <MetricTile label="Sparse edges" value={researchSupplierEdges.toLocaleString()} detail="Compressed supplier network" />
          <MetricTile label="Artifacts" value="JSONL.gz" detail="Aggregate and sector paths" />
        </div>
        <div className="metric-grid companion-grid">
          <MetricTile label="Shock" value={`+${experiment.metadata.treatmentShockBps} bps`} detail="Treatment-minus-baseline policy path" />
          <MetricTile label="Paired seeds" value={experiment.summary.seedCount.toLocaleString()} detail="Identical seeds; policy shock differs" />
          <MetricTile label="Peak inflation effect" value={`${experiment.summary.peakInflationDeltaPp.toFixed(2)} pp`} detail="Mean treatment minus baseline" />
          <MetricTile label="Browser companion" value={result.metadata.scale.households.toLocaleString()} detail="Interactive TypeScript path" />
        </div>
      </section>

      <section className="controls-section">
        <div className="amor-shell controls-grid">
          <div>
            <p className="amor-kicker">Interactive controls</p>
            <h2>Behavior, supply, and assets</h2>
          </div>
          <form className="control-panel" aria-label="Milestone 6 browser companion controls">
            <ControlSlider label="Hand-to-mouth" value={handToMouth} onChange={setHandToMouth} />
            <ControlSlider label="Liquidity buffer" value={liquidityBuffer} onChange={setLiquidityBuffer} />
            <ControlSlider label="Habit rule" value={habit} onChange={setHabit} />
            <ControlSlider label="Debt stress" value={debtStress} onChange={setDebtStress} />
            <ControlSlider label="Anchored expectations" value={anchoredExpectations} onChange={setAnchoredExpectations} />
            <ControlSlider label="Matching friction" value={matchingFriction} onChange={setMatchingFriction} />
            <ControlSlider label="Wage indexation" value={wageIndexation} onChange={setWageIndexation} />
            <ControlSlider label="Rule switching" value={ruleSwitching} onChange={setRuleSwitching} />
            <ControlSlider label="Input inventory months" value={inputInventoryTarget} min={0.6} max={3} step={0.05} suffix=" mo" onChange={setInputInventoryTarget} />
            <ControlSlider label="Delivery fragility" value={deliveryFailureSensitivity} onChange={setDeliveryFailureSensitivity} />
            <ControlSlider label="Supplier rewiring" value={supplierRewireRate} onChange={setSupplierRewireRate} />
            <ControlSlider label="Input substitution" value={inputSubstitution} onChange={setInputSubstitution} />
            <ControlSlider label="Variable mortgages" value={variableMortgageShare} onChange={setVariableMortgageShare} />
            <ControlSlider label="Wealth effect" value={wealthEffectStrength} onChange={setWealthEffectStrength} />
            <ControlSlider label="Collateral effect" value={collateralEffectStrength} onChange={setCollateralEffectStrength} />
            <ControlSlider label="Construction sensitivity" value={constructionDemandSensitivity} onChange={setConstructionDemandSensitivity} />
            <ControlSlider label="Portfolio rebalancing" value={portfolioRebalanceSpeed} onChange={setPortfolioRebalanceSpeed} />
          </form>
        </div>
      </section>

      <section className="results-section">
        <div className="amor-shell results-grid">
          <div>
            <p className="amor-kicker">Seeded browser companion</p>
            <h2>Metadata before conclusions</h2>
            <p>
              The current browser view remains a paired-seed rate-hike experiment for inspecting mechanisms. Baseline
              and treatment reuse identical seeds; only the policy-rate shock differs. Norway mortgage exposure is
              stylized at the high variable-rate range pending calibration.
            </p>
            <ul className="metadata-list">
              <li>Model version: {result.metadata.modelVersion}</li>
              <li>Experiment: {experiment.metadata.experimentName}</li>
              <li>Baseline hash: {experiment.metadata.baselineParameterHash}</li>
              <li>Treatment hash: {experiment.metadata.treatmentParameterHash}</li>
              <li>Seed policy: {experiment.metadata.pairedSeedPolicy}</li>
              <li>Scale: {result.metadata.scale.households.toLocaleString()} households; {result.metadata.scale.firms.toLocaleString()} firms; {result.metadata.scale.supplierEdges.toLocaleString()} supplier edges</li>
              <li>Accounting checks: {result.diagnostics.accountingChecksPassed ? "passed" : "failed"}</li>
              <li>Baseline final inflation: {(baselineFinalPoint.inflationAnnualized * 100).toFixed(2)} percent</li>
              <li>Treatment final inflation: {(finalPoint.inflationAnnualized * 100).toFixed(2)} percent</li>
              <li>Delivery attempts: {result.network.deliveryAttempts.toLocaleString()}</li>
              <li>Supplier rewires: {result.network.rewiredEdges.toLocaleString()}</li>
              <li>Variable mortgage exposure: {(finalPoint.variableMortgageShare * 100).toFixed(1)} percent</li>
              <li>Bank credit tightness: {(finalPoint.bankCreditTightness * 100).toFixed(1)} percent</li>
            </ul>
          </div>
          <div className="chart-stack">
            <PathChart path={result.path} />
            <PathChart
              path={result.path}
              metric="backlogIndex"
              title="Supply-chain backlog path"
              caption="Backlog pressure from missed intermediate-input deliveries and inventory shortfalls in the seeded Milestone 4 run."
              multiplier={100}
              ceiling={10}
              variant="amber"
            />
          </div>
        </div>
      </section>

      <section className="counterfactual-section">
        <div className="amor-shell">
          <div className="section-heading">
            <p className="amor-kicker">Treatment minus baseline</p>
            <h2>Paired-seed counterfactual bands</h2>
          </div>
          <div className="metric-grid">
            <MetricTile label="Unemployment peak" value={`${experiment.summary.peakUnemploymentDeltaPp.toFixed(2)} pp`} detail="Mean treatment effect" />
            <MetricTile label="Housing final effect" value={experiment.summary.finalHousingPriceDeltaIndex.toFixed(3)} detail="Treatment minus baseline" />
            <MetricTile label="Equity final effect" value={experiment.summary.finalEquityPriceDeltaIndex.toFixed(3)} detail="Primary paired seed" />
            <MetricTile label="Credit tightness final" value={`${experiment.summary.finalBankCreditTightnessDeltaPp.toFixed(2)} pp`} detail="Primary paired seed" />
          </div>
          <div className="chart-grid">
            <CounterfactualChart
              bands={experiment.bands}
              metric="inflation"
              title="Inflation treatment effect"
              caption="Annualized inflation in treatment minus baseline across paired seeds."
              unit="pp"
            />
            <CounterfactualChart
              bands={experiment.bands}
              metric="output"
              title="Output treatment effect"
              caption="Output index in treatment minus baseline across paired seeds."
              unit="index"
              variant="amber"
            />
            <CounterfactualChart
              bands={experiment.bands}
              metric="unemployment"
              title="Unemployment treatment effect"
              caption="Unemployment-rate treatment effect across paired seeds."
              unit="pp"
            />
            <CounterfactualChart
              bands={experiment.bands}
              metric="housing"
              title="Housing-price treatment effect"
              caption="Housing index in treatment minus baseline across paired seeds."
              unit="index"
              variant="amber"
            />
          </div>
        </div>
      </section>

      <section className="asset-section">
        <div className="amor-shell">
          <div className="section-heading">
            <p className="amor-kicker">Credit and asset prices</p>
            <h2>Mortgage, housing, construction, and equity channels</h2>
          </div>
          <AssetChannelsPanel result={result} />
          <div className="chart-grid">
            <PathChart
              path={result.path}
              metric="housingPriceIndex"
              title="Housing price index"
              caption="House-price path from mortgage pass-through, collateral conditions, and construction supply pressure."
              multiplier={100}
              floor={85}
              ceiling={125}
            />
            <PathChart
              path={result.path}
              metric="equityPriceIndex"
              title="Firm equity index"
              caption="Equity valuation path from firm cash flow, leverage, discount rates, and household portfolio exposure."
              multiplier={100}
              floor={60}
              ceiling={140}
              variant="amber"
            />
          </div>
        </div>
      </section>

      <section className="amor-shell content-section">
        <div className="section-heading">
          <p className="amor-kicker">Supply-chain propagation</p>
          <h2>Sector stress and rewiring</h2>
        </div>
        <ProductionNetworkPanel sectors={result.sectors} network={result.network} />
        <div className="work-grid">
          <article>
            <h3>Mortgage market</h3>
            <p>Variable and fixed mortgage shares convert policy rates into household debt service.</p>
          </article>
          <article>
            <h3>Housing and construction</h3>
            <p>House prices and credit conditions feed construction demand in the synthetic construction sector.</p>
          </article>
          <article>
            <h3>Equity and portfolios</h3>
            <p>Firm equity valuation changes household portfolio wealth and risky-asset allocation.</p>
          </article>
        </div>
        <p className="final-metric">
          Final browser-companion treatment path: inflation {(finalPoint.inflationAnnualized * 100).toFixed(2)} percent annualized,
          housing index {finalPoint.housingPriceIndex.toFixed(2)}, equity index {finalPoint.equityPriceIndex.toFixed(2)},
          mortgage DSR {(finalPoint.mortgageDebtServiceRatio * 100).toFixed(1)} percent, unemployment{" "}
          {(finalPoint.unemploymentRate * 100).toFixed(2)} percent. Stressed supply-chain sectors:{" "}
          {stressedSectorCount.toLocaleString()}.
        </p>
      </section>
    </main>
  );
}
