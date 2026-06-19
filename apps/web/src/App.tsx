import { useMemo, useState } from "react";
import { firstStructuralDemoConfig, researchScaleMilestoneConfig, runRateHikeExperiment } from "@world-abm/core";
import type { ScenarioConfig } from "@world-abm/core";
import { AssetChannelsPanel } from "./components/AssetChannelsPanel";
import { CounterfactualChart } from "./components/CounterfactualChart";
import { ControlSlider } from "./components/ControlSlider";
import { LaborMarketExplorer } from "./components/LaborMarketExplorer";
import { ManuscriptPanel } from "./components/ManuscriptPanel";
import { MetricTile } from "./components/MetricTile";
import { NetworkExplorer } from "./components/NetworkExplorer";
import { PathChart } from "./components/PathChart";
import { ProductionNetworkPanel } from "./components/ProductionNetworkPanel";

type WorkspaceView = "overview" | "experiment" | "networks" | "labor" | "manuscript";

const workspaceViews: Array<{ id: WorkspaceView; label: string; detail: string }> = [
  { id: "overview", label: "Overview", detail: "research brief" },
  { id: "experiment", label: "Simulator", detail: "controls and results" },
  { id: "networks", label: "Networks", detail: "supplier graph" },
  { id: "labor", label: "Labor", detail: "worker flows" },
  { id: "manuscript", label: "Manuscript", detail: "docs and limits" }
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
                A structured research workspace for testing the inflation-interest-rate relationship across households,
                firms, banks, employer-worker links, asset channels, and production networks. Milestone 9 turns the
                earlier long page into a guided presentation layer for the browser companion and future static results.
              </p>
              <div className="hero-actions">
                <a className="amor-button" href="#workspace">
                  Open workspace
                </a>
                <a className="amor-button secondary" href="#model-warning">
                  Read warning
                </a>
              </div>
            </div>

            <aside className="hero-snapshot amor-panel" aria-label="Current scaffold snapshot">
              <span className="snapshot-title">Milestone 9 presentation site</span>
              <dl>
                <div>
                  <dt>Browser households</dt>
                  <dd>{firstStructuralDemoConfig.households.toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Browser firms</dt>
                  <dd>{firstStructuralDemoConfig.firms.toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Primary economy</dt>
                  <dd>{firstStructuralDemoConfig.economyContext}</dd>
                </div>
                <div>
                  <dt>Research target</dt>
                  <dd>{researchScaleMilestoneConfig.households.toLocaleString()}</dd>
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

      <section className="workspace-section" id="workspace">
        <div className="amor-shell">
          <div className="workspace-header">
            <div className="section-heading">
              <p className="amor-kicker">Milestone 9</p>
              <h2>Structured research workspace</h2>
              <p className="section-note">
                The site is now organized as a presentation layer. Choose a view instead of scrolling through every
                model surface at once.
              </p>
            </div>
            <div className="workspace-health" aria-label="Current run health">
              <span>Diagnostics</span>
              <strong>{result.diagnostics.accountingChecksPassed ? "Passed" : "Failed"}</strong>
              <small>{result.metadata.modelVersion} / {result.metadata.scenarioName}</small>
            </div>
          </div>

          <nav className="workspace-tabs" aria-label="Research workspace views">
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
                    <p className="amor-kicker">Research brief</p>
                    <h3>What this page is for</h3>
                    <p>
                      Use this site as a guided laboratory: start with the assumptions, inspect paired treatment effects,
                      move into the network and labor mechanisms, and finish with limitations and reproducibility.
                    </p>
                  </article>
                  <div className="briefing-steps">
                    <article>
                      <span>01</span>
                      <h4>Choose assumptions</h4>
                      <p>Scenario levers stay in the Simulator view so the page does not start as a wall of controls.</p>
                    </article>
                    <article>
                      <span>02</span>
                      <h4>Read effects</h4>
                      <p>Counterfactual charts compare treatment and baseline runs that share identical seeds.</p>
                    </article>
                    <article>
                      <span>03</span>
                      <h4>Inspect mechanisms</h4>
                      <p>Network and labor views separate the most important propagation channels.</p>
                    </article>
                    <article>
                      <span>04</span>
                      <h4>Check limits</h4>
                      <p>The manuscript view keeps assumptions, citations, and reproducibility close to the model.</p>
                    </article>
                  </div>
                </div>

                <div className="metric-grid">
                  <MetricTile label="Browser households" value={result.metadata.scale.households.toLocaleString()} detail="Interactive TypeScript companion" />
                  <MetricTile label="Research target" value={researchScaleMilestoneConfig.households.toLocaleString()} detail="Offline Python engine" />
                  <MetricTile label="Supplier edges" value={result.metadata.scale.supplierEdges.toLocaleString()} detail="Browser graph scale" />
                  <MetricTile label="Peak inflation effect" value={`${experiment.summary.peakInflationDeltaPp.toFixed(2)} pp`} detail="Treatment minus baseline" />
                </div>

                <div className="result-brief">
                  <div>
                    <span>Current treatment endpoint</span>
                    <strong>{(finalPoint.inflationAnnualized * 100).toFixed(2)}% inflation</strong>
                    <p>
                      Final treatment path: housing {finalPoint.housingPriceIndex.toFixed(2)}, equity{" "}
                      {finalPoint.equityPriceIndex.toFixed(2)}, unemployment{" "}
                      {(finalPoint.unemploymentRate * 100).toFixed(2)}%, stressed sectors{" "}
                      {stressedSectorCount.toLocaleString()}.
                    </p>
                  </div>
                  <div>
                    <span>Static artifact status</span>
                    <strong>Curated summaries only</strong>
                    <p>
                      Milestone 9 adds the presentation structure for future research-scale artifacts. Raw microstate
                      remains excluded from git.
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
                  <form className="control-panel" aria-label="Milestone 9 browser companion controls">
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
                    <p className="amor-kicker">Seeded browser companion</p>
                    <h2>Metadata before conclusions</h2>
                    <p>
                      Baseline and treatment reuse identical seeds; only the policy-rate shock differs. Norway mortgage
                      exposure is stylized at the high variable-rate range pending calibration.
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

            {activeView === "networks" && (
              <div className="workspace-view">
                <NetworkExplorer sectors={result.sectors} network={result.network} />
                <ProductionNetworkPanel sectors={result.sectors} network={result.network} />
                <div className="work-grid">
                  <article>
                    <h3>Supplier stress</h3>
                    <p>Delivery failures and input shortages can transmit upstream or downstream through the graph.</p>
                  </article>
                  <article>
                    <h3>Rewiring</h3>
                    <p>Local rewiring is a sandbox interaction for exploring alternate topology assumptions.</p>
                  </article>
                  <article>
                    <h3>Research scale</h3>
                    <p>{researchSupplierEdges.toLocaleString()} sparse edges are targeted in the offline engine.</p>
                  </article>
                </div>
              </div>
            )}

            {activeView === "labor" && (
              <div className="workspace-view">
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
                    <h3>Limitations stay visible</h3>
                    <p>The site labels current outputs as architecture checks until Norway/EU calibration is complete.</p>
                  </article>
                  <article>
                    <h3>Reproducibility first</h3>
                    <p>Every result must tie back to model version, scenario name, parameter hash, and seed policy.</p>
                  </article>
                  <article>
                    <h3>Milestone 9 scope</h3>
                    <p>The new presentation layer prepares the site for curated static research-scale artifacts.</p>
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
