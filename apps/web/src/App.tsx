import { useMemo, useState } from "react";
import { firstStructuralDemoConfig, researchScaleMilestoneConfig, runSimulation } from "@world-abm/core";
import type { ScenarioConfig } from "@world-abm/core";
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
      inputSubstitutionElasticity: inputSubstitution
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
      ruleSwitching,
      supplierRewireRate,
      wageIndexation
    ]
  );
  const result = useMemo(() => runSimulation(scenario), [scenario]);
  const finalPoint = result.path[result.path.length - 1];
  const stressedSectorCount = result.sectors.filter((sector) => sector.backlogIndex > 0.05 || sector.deliveryFailureRate > 0.05).length;

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
                million-household runs are treated as offline research-scale experiments.
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
              <span className="snapshot-title">Milestone 3 browser run</span>
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
              </dl>
            </aside>
          </div>
        </div>
      </section>

      <section className="status-band" id="model-warning">
        <div className="amor-shell">
          <div className="model-warning">
            This is a model-generated counterfactual laboratory, not a forecast and not policy advice. Early scaffold
            charts verify architecture and reproducibility. Economic claims require Norway/EU calibration, paired seeds,
            sensitivity analysis, and documented limitations.
          </div>
        </div>
      </section>

      <section className="amor-shell content-section" id="scaffold-status">
        <div className="section-heading">
          <p className="amor-kicker">Milestone 3</p>
          <h2>Production-network status</h2>
        </div>
        <div className="metric-grid">
          <MetricTile label="Browser households" value={firstStructuralDemoConfig.households.toLocaleString()} detail="Typed-array Milestone 3 run" />
          <MetricTile label="Research target" value={researchScaleMilestoneConfig.households.toLocaleString()} detail="Offline/local-large target config" />
          <MetricTile label="Delivery failures" value={`${(finalPoint.deliveryFailureRate * 100).toFixed(1)}%`} detail="Intermediate-input delivery attempts" />
          <MetricTile label="Stressed sectors" value={stressedSectorCount.toLocaleString()} detail="Backlog or delivery-failure pressure" />
        </div>
      </section>

      <section className="controls-section">
        <div className="amor-shell controls-grid">
          <div>
            <p className="amor-kicker">Interactive controls</p>
            <h2>Behavior and supply chains</h2>
          </div>
          <form className="control-panel" aria-label="Milestone 3 behavior and supply-chain controls">
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
          </form>
        </div>
      </section>

      <section className="results-section">
        <div className="amor-shell results-grid">
          <div>
            <p className="amor-kicker">Seeded Milestone 3 result</p>
            <h2>Metadata before conclusions</h2>
            <p>
              The current browser run is a stylized 100,000-household ABM with household rules, expectations,
              employer-worker links, intermediate-input inventories, supplier rewiring, delivery failures, and CPI
              construction before Norway/EU calibration.
            </p>
            <ul className="metadata-list">
              <li>Model version: {result.metadata.modelVersion}</li>
              <li>Scenario: {result.metadata.scenarioName}</li>
              <li>Parameter hash: {result.metadata.parameterHash}</li>
              <li>Seed policy: {result.metadata.seedPolicy}</li>
              <li>Scale: {result.metadata.scale.households.toLocaleString()} households; {result.metadata.scale.firms.toLocaleString()} firms; {result.metadata.scale.supplierEdges.toLocaleString()} supplier edges</li>
              <li>Accounting checks: {result.diagnostics.accountingChecksPassed ? "passed" : "failed"}</li>
              <li>Expected inflation: {(finalPoint.averageInflationExpectation * 100).toFixed(2)} percent</li>
              <li>Delivery attempts: {result.network.deliveryAttempts.toLocaleString()}</li>
              <li>Supplier rewires: {result.network.rewiredEdges.toLocaleString()}</li>
            </ul>
          </div>
          <div className="chart-stack">
            <PathChart path={result.path} />
            <PathChart
              path={result.path}
              metric="backlogIndex"
              title="Supply-chain backlog path"
              caption="Backlog pressure from missed intermediate-input deliveries and inventory shortfalls in the seeded Milestone 3 run."
              multiplier={100}
              ceiling={10}
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
            <h3>Input bottlenecks</h3>
            <p>Intermediate-input inventories now constrain firm production when deliveries fail or backlogs build.</p>
          </article>
          <article>
            <h3>Supplier rewiring</h3>
            <p>Firms can replace failed supplier links while preserving an upstream bias in the production graph.</p>
          </article>
          <article>
            <h3>Sector reporting</h3>
            <p>Each sector reports output, input-cost pressure, inventory coverage, backlogs, and delivery failures.</p>
          </article>
        </div>
        <p className="final-metric">
          Final Milestone 3 path: inflation {(finalPoint.inflationAnnualized * 100).toFixed(2)} percent annualized,
          backlog index {finalPoint.backlogIndex.toFixed(2)}, delivery failures{" "}
          {(finalPoint.deliveryFailureRate * 100).toFixed(1)} percent, unemployment{" "}
          {(finalPoint.unemploymentRate * 100).toFixed(2)} percent.
        </p>
      </section>
    </main>
  );
}
