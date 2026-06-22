import { useMemo, useState } from "react";
import { firstStructuralDemoConfig, researchScaleMilestoneConfig, runRateHikeExperiment } from "@world-abm/core";
import type { ScenarioConfig } from "@world-abm/core";
import { AssetChannelsPanel } from "./components/AssetChannelsPanel";
import { CounterfactualChart } from "./components/CounterfactualChart";
import { ControlSlider } from "./components/ControlSlider";
import { LaborMarketExplorer } from "./components/LaborMarketExplorer";
import { ManuscriptPanel } from "./components/ManuscriptPanel";
import { MathematicsPanel } from "./components/MathematicsPanel";
import { MetricTile } from "./components/MetricTile";
import { NetworkExplorer } from "./components/NetworkExplorer";
import { PathChart } from "./components/PathChart";
import { ProductionNetworkPanel } from "./components/ProductionNetworkPanel";
import { StaticResultsPanel } from "./components/StaticResultsPanel";
import { milestone10StaticResults } from "./data/staticResults";

type WorkspaceView = "overview" | "experiment" | "math" | "results" | "networks" | "labor" | "manuscript";

const workspaceViews: Array<{ id: WorkspaceView; label: string; detail: string }> = [
  { id: "overview", label: "Overview", detail: "lab purpose" },
  { id: "experiment", label: "Simulator", detail: "regime tests" },
  { id: "math", label: "Mathematics", detail: "dynamics" },
  { id: "results", label: "Runs", detail: "saved outputs" },
  { id: "networks", label: "Networks", detail: "system map" },
  { id: "labor", label: "Labor", detail: "households" },
  { id: "manuscript", label: "Lab Guide", detail: "policy regimes" }
];

export function App() {
  const [activeView, setActiveView] = useState<WorkspaceView>("overview");
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
  const inflationTargetAnnual = scenario.targetInflationAnnual ?? 0.02;
  const inflationTargetGapPp = (finalPoint.inflationAnnualized - inflationTargetAnnual) * 100;
  const stressedSectorCount = result.sectors.filter((sector) => sector.backlogIndex > 0.05 || sector.deliveryFailureRate > 0.05).length;
  const researchSupplierEdges =
    researchScaleMilestoneConfig.firms * (researchScaleMilestoneConfig.supplierEdgesPerFirm ?? 0);
  const openWorkspaceView = (view: WorkspaceView) => {
    setActiveView(view);
    window.requestAnimationFrame(() => {
      document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

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
              <p className="amor-kicker">Virtual economy data lab</p>
              <h1>Test economic regimes before claiming results</h1>
              <p className="hero-lede">
                Build artificial Norway-first economies, change monetary, credit, housing, wage, expectation, and
                network regimes, and watch how inflation, output, unemployment, household cash flow, and firm stress
                evolve over time.
              </p>
              <div className="hero-actions">
                <button className="amor-button" type="button" onClick={() => openWorkspaceView("manuscript")}>
                  Open lab guide
                </button>
                <button className="amor-button secondary" type="button" onClick={() => openWorkspaceView("experiment")}>
                  Run regime test
                </button>
                <button className="amor-button secondary" type="button" onClick={() => openWorkspaceView("math")}>
                  Read mathematics
                </button>
                <a className="amor-button secondary" href="#model-warning">
                  Model warning
                </a>
              </div>
            </div>

            <aside className="hero-snapshot amor-panel" aria-label="Scale shown on this page">
              <span className="snapshot-title">Three scales, three meanings</span>
              <dl>
                <div>
                  <dt>Interactive browser run</dt>
                  <dd>{firstStructuralDemoConfig.households.toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Offline target run</dt>
                  <dd>{researchScaleMilestoneConfig.households.toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Saved smoke artifact</dt>
                  <dd>{milestone10StaticResults.scale.households.toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Inflation target</dt>
                  <dd>{(inflationTargetAnnual * 100).toFixed(0)}%</dd>
                </div>
              </dl>
            </aside>
          </div>
        </div>
      </section>

      <section className="status-band" id="model-warning">
        <div className="amor-shell">
          <div className="model-warning">
            This is a virtual-economy laboratory, not a forecast and not a finished empirical finding. The browser runs
            100,000 households interactively; the local offline engine targets 1,000,000 households; the committed
            Results artifact is a 2,000-household export test. These are different scales, not the same run. Policy
            regimes shown here are literature-grounded scenarios to test, not official or personalized advice.
          </div>
        </div>
      </section>

      <section className="workspace-section" id="workspace">
        <div className="amor-shell">
          <div className="workspace-header">
            <div className="section-heading">
              <p className="amor-kicker">Milestone 10</p>
              <h2>Virtual economy data lab</h2>
              <p className="section-note">
                Use the page as a structured control room: choose a regime, compare paths, inspect transmission
                channels, and keep scale and calibration status visible before treating any simulated path as a finding.
              </p>
            </div>
            <div className="workspace-health" aria-label="Current run health">
              <span>Diagnostics</span>
              <strong>{result.diagnostics.accountingChecksPassed ? "Passed" : "Failed"}</strong>
              <small>{result.metadata.modelVersion} / {result.metadata.scenarioName}</small>
            </div>
          </div>

          <nav className="workspace-tabs" aria-label="Virtual economy lab views">
            {workspaceViews.map((view) => (
              <button
                type="button"
                key={view.id}
                className={activeView === view.id ? "active" : ""}
                aria-pressed={activeView === view.id}
                onClick={() => setActiveView(view.id)}
              >
                <span>{view.label}</span>
                <small>{view.detail}</small>
              </button>
            ))}
          </nav>

          <div className="workspace-panel">
            {activeView === "overview" && (
              <div className="workspace-view">
                <div className="briefing-grid">
                  <article className="briefing-lead">
                    <p className="amor-kicker">Lab brief</p>
                    <h3>What this lab is for</h3>
                    <p>
                      The goal is to create a virtual economy where we can test regimes and compare how the economy
                      evolves. Interest rates are one regime lever, but the lab also exposes credit, housing, wage,
                      expectation, fiscal, and supplier-network assumptions.
                    </p>
                  </article>
                  <div className="briefing-steps">
                    <article>
                      <span>01</span>
                      <h4>Build the economy</h4>
                      <p>Create households, firms, banks, jobs, mortgages, assets, and supplier links with Norway first.</p>
                    </article>
                    <article>
                      <span>02</span>
                      <h4>Choose a regime</h4>
                      <p>Change rate paths, expectation anchoring, mortgage pass-through, credit tightness, and wage behavior.</p>
                    </article>
                    <article>
                      <span>03</span>
                      <h4>Compare paths</h4>
                      <p>Baseline and treatment economies share seeds, so the policy change is isolated as cleanly as possible.</p>
                    </article>
                    <article>
                      <span>04</span>
                      <h4>Inspect channels</h4>
                      <p>Network and labor views show supplier stress, layoffs, vacancies, cash-flow pressure, and income effects.</p>
                    </article>
                    <article>
                      <span>05</span>
                      <h4>Respect scale</h4>
                      <p>100,000 households are live in the browser; 1,000,000 is the offline target; 2,000 is a saved export test.</p>
                    </article>
                    <article>
                      <span>06</span>
                      <h4>Read the math</h4>
                      <p>The Mathematics view states the simulation dimensions, state variables, timing, and update equations.</p>
                    </article>
                  </div>
                </div>

                <div className="metric-grid">
                  <MetricTile label="Browser run" value={result.metadata.scale.households.toLocaleString()} detail="Interactive households now" />
                  <MetricTile label="Offline target" value={researchScaleMilestoneConfig.households.toLocaleString()} detail="Local engine target" />
                  <MetricTile label="Supplier edges" value={result.metadata.scale.supplierEdges.toLocaleString()} detail="Browser graph scale" />
                  <MetricTile label="Saved artifact" value={milestone10StaticResults.scale.households.toLocaleString()} detail="Export smoke test" />
                  <MetricTile label="Gap to 2%" value={`${inflationTargetGapPp.toFixed(2)} pp`} detail="Final browser treatment" />
                </div>

                <div className="result-brief">
                  <div>
                    <span>Current uncalibrated browser run</span>
                    <strong>{(finalPoint.inflationAnnualized * 100).toFixed(2)}% inflation</strong>
                    <p>
                      This number is far from the {(inflationTargetAnnual * 100).toFixed(0)}% target and should be read as a calibration problem to
                      solve, not as a policy result. Final path: housing {finalPoint.housingPriceIndex.toFixed(2)}, equity{" "}
                      {finalPoint.equityPriceIndex.toFixed(2)}, unemployment{" "}
                      {(finalPoint.unemploymentRate * 100).toFixed(2)}%, stressed sectors{" "}
                      {stressedSectorCount.toLocaleString()}.
                    </p>
                  </div>
                  <div>
                    <span>Scale clarity</span>
                    <strong>100k / 1m / 2k</strong>
                    <p>
                      The app shows three different objects: the browser simulation, the offline million-household
                      target, and a small saved artifact used to test static-site publication.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeView === "experiment" && (
              <div className="workspace-view">
                <details className="control-drawer">
                  <summary>
                    <span>Scenario controls</span>
                    <strong>17 levers</strong>
                  </summary>
                  <form className="control-panel" aria-label="Milestone 10 browser companion controls">
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
                </details>

                <div className="results-grid workspace-results">
                  <div>
                    <p className="amor-kicker">Regime test</p>
                    <h2>Baseline versus policy-rate path</h2>
                    <p>
                      The simulator compares a baseline path with a treatment path that receives a temporary rate
                      increase. Both economies reuse identical seeds, so differences show how this virtual economy
                      reacts under the current assumptions.
                    </p>
                    <ul className="metadata-list">
                      <li>Model version: {result.metadata.modelVersion}</li>
                      <li>Experiment: {experiment.metadata.experimentName}</li>
                      <li>Baseline hash: {experiment.metadata.baselineParameterHash}</li>
                      <li>Treatment hash: {experiment.metadata.treatmentParameterHash}</li>
                      <li>Seed policy: {experiment.metadata.pairedSeedPolicy}</li>
                      <li>Scale: {result.metadata.scale.households.toLocaleString()} households; {result.metadata.scale.firms.toLocaleString()} firms; {result.metadata.scale.supplierEdges.toLocaleString()} supplier edges</li>
                      <li>Accounting checks: {result.diagnostics.accountingChecksPassed ? "passed" : "failed"}</li>
                      <li>Inflation target: {(inflationTargetAnnual * 100).toFixed(2)} percent</li>
                      <li>Baseline final inflation: {(baselineFinalPoint.inflationAnnualized * 100).toFixed(2)} percent</li>
                      <li>Treatment final inflation: {(finalPoint.inflationAnnualized * 100).toFixed(2)} percent</li>
                      <li>Treatment gap to target: {inflationTargetGapPp.toFixed(2)} percentage points</li>
                    </ul>
                  </div>
                  <div className="chart-stack">
                    <PathChart path={result.path} />
                    <PathChart
                      path={result.path}
                      metric="backlogIndex"
                      title="Supply-chain backlog path"
                      caption="Backlog pressure from missed intermediate-input deliveries and inventory shortfalls."
                      multiplier={100}
                      ceiling={10}
                      variant="amber"
                    />
                  </div>
                </div>

                <div className="metric-grid">
                  <MetricTile label="Unemployment peak" value={`${experiment.summary.peakUnemploymentDeltaPp.toFixed(2)} pp`} detail="Mean treatment effect" />
                  <MetricTile label="Housing final effect" value={experiment.summary.finalHousingPriceDeltaIndex.toFixed(3)} detail="Treatment minus baseline" />
                  <MetricTile label="Equity final effect" value={experiment.summary.finalEquityPriceDeltaIndex.toFixed(3)} detail="Primary paired seed" />
                  <MetricTile label="Credit tightness final" value={`${experiment.summary.finalBankCreditTightnessDeltaPp.toFixed(2)} pp`} detail="Primary paired seed" />
                </div>

                <div className="chart-grid">
                  <CounterfactualChart bands={experiment.bands} metric="inflation" title="Inflation treatment effect" caption="Annualized inflation in treatment minus baseline across paired seeds." unit="pp" />
                  <CounterfactualChart bands={experiment.bands} metric="output" title="Output treatment effect" caption="Output index in treatment minus baseline across paired seeds." unit="index" variant="amber" />
                  <CounterfactualChart bands={experiment.bands} metric="unemployment" title="Unemployment treatment effect" caption="Unemployment-rate treatment effect across paired seeds." unit="pp" />
                  <CounterfactualChart bands={experiment.bands} metric="housing" title="Housing-price treatment effect" caption="Housing index in treatment minus baseline across paired seeds." unit="index" variant="amber" />
                </div>

                <AssetChannelsPanel result={result} />
              </div>
            )}

            {activeView === "results" && (
              <div className="workspace-view">
                <StaticResultsPanel artifact={milestone10StaticResults} />
              </div>
            )}

            {activeView === "math" && (
              <div className="workspace-view">
                <MathematicsPanel result={result} experiment={experiment} />
                <div className="work-grid">
                  <article>
                    <h3>Dimensions first</h3>
                    <p>The panel states the active browser dimensions before presenting dynamics.</p>
                  </article>
                  <article>
                    <h3>LaTeX blocks</h3>
                    <p>Equations are written as copyable LaTeX so they can become formal documentation later.</p>
                  </article>
                  <article>
                    <h3>Code-faithful</h3>
                    <p>The equations summarize the implemented TypeScript transitions, including clamps and stylized coefficients.</p>
                  </article>
                </div>
              </div>
            )}

            {activeView === "networks" && (
              <div className="workspace-view">
                <div className="view-intro">
                  <p className="amor-kicker">Production-network system map</p>
                  <h3>Inspect where shocks travel</h3>
                  <p>
                    Supplier links determine whether financing costs, demand changes, and input shortages stay local or
                    travel through delivery failures, backlogs, and replacement-supplier behavior.
                  </p>
                </div>
                <NetworkExplorer sectors={result.sectors} network={result.network} />
                <ProductionNetworkPanel sectors={result.sectors} network={result.network} />
                <div className="work-grid">
                  <article>
                    <h3>Topology lever</h3>
                    <p>Sector centrality, supplier concentration, and input linkages can amplify or dampen regime shocks.</p>
                  </article>
                  <article>
                    <h3>Model channel</h3>
                    <p>Firms hold input inventories, accumulate backlogs, face delivery failures, and can rewire suppliers.</p>
                  </article>
                  <article>
                    <h3>Offline target</h3>
                    <p>{researchSupplierEdges.toLocaleString()} sparse edges are targeted before input-output calibration.</p>
                  </article>
                </div>
              </div>
            )}

            {activeView === "labor" && (
              <div className="workspace-view">
                <div className="view-intro">
                  <p className="amor-kicker">Labor-income transmission</p>
                  <h3>Household cash flow is a regime channel</h3>
                  <p>
                    The labor view connects firm stress to vacancies, layoffs, unemployment, consumption pressure, and
                    wage growth. In Norway, high variable-rate mortgage exposure makes household cash flow especially
                    important to test.
                  </p>
                </div>
                <LaborMarketExplorer result={result} />
                <div className="metric-grid">
                  <MetricTile label="Unemployment" value={`${(finalPoint.unemploymentRate * 100).toFixed(2)}%`} detail="Final treatment path" />
                  <MetricTile label="Vacancy rate" value={`${(finalPoint.vacancyRate * 100).toFixed(2)}%`} detail="Final treatment path" />
                  <MetricTile label="Hires" value={finalPoint.hires.toLocaleString()} detail="Final period" />
                  <MetricTile label="Layoffs" value={finalPoint.layoffs.toLocaleString()} detail="Final period" />
                </div>
              </div>
            )}

            {activeView === "manuscript" && (
              <div className="workspace-view">
                <ManuscriptPanel result={result} experiment={experiment} />
                <div className="work-grid">
                  <article>
                    <h3>Lab purpose</h3>
                    <p>The guide explains what the virtual economy data lab can test and what remains uncalibrated.</p>
                  </article>
                  <article>
                    <h3>Policy regimes</h3>
                    <p>The guide translates inflation-targeting literature into concrete scenarios for the lab.</p>
                  </article>
                  <article>
                    <h3>Scale discipline</h3>
                    <p>Current outputs remain mechanism checks until Norway/EU calibration and paired-seed sweeps mature.</p>
                  </article>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
