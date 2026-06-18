import { useMemo, useState } from "react";
import { firstStructuralDemoConfig, researchScaleMilestoneConfig, runSimulation } from "@world-abm/core";
import type { ScenarioConfig } from "@world-abm/core";
import { ControlSlider } from "./components/ControlSlider";
import { MetricTile } from "./components/MetricTile";
import { PathChart } from "./components/PathChart";

export function App() {
  const [handToMouth, setHandToMouth] = useState(0.35);
  const [liquidityBuffer, setLiquidityBuffer] = useState(0.3);
  const [habit, setHabit] = useState(0.2);
  const [debtStress, setDebtStress] = useState(0.15);
  const [anchoredExpectations, setAnchoredExpectations] = useState(0.32);
  const [matchingFriction, setMatchingFriction] = useState(firstStructuralDemoConfig.matchingFriction ?? 0.35);
  const [wageIndexation, setWageIndexation] = useState(firstStructuralDemoConfig.wageIndexation ?? 0.28);
  const [ruleSwitching, setRuleSwitching] = useState(firstStructuralDemoConfig.ruleSwitchingIntensity ?? 0.18);

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
      ruleSwitchingIntensity: ruleSwitching
    }),
    [anchoredExpectations, debtStress, habit, handToMouth, liquidityBuffer, matchingFriction, ruleSwitching, wageIndexation]
  );
  const result = useMemo(() => runSimulation(scenario), [scenario]);
  const finalPoint = result.path[result.path.length - 1];

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
              <span className="snapshot-title">Milestone 2 browser run</span>
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
          <p className="amor-kicker">Milestone 2</p>
          <h2>Household behavior status</h2>
        </div>
        <div className="metric-grid">
          <MetricTile label="Browser households" value={firstStructuralDemoConfig.households.toLocaleString()} detail="Typed-array Milestone 2 run" />
          <MetricTile label="Research target" value={researchScaleMilestoneConfig.households.toLocaleString()} detail="Offline/local-large target config" />
          <MetricTile label="Consumption index" value={finalPoint.consumptionIndex.toFixed(2)} detail="Household rule aggregate" />
          <MetricTile label="Diagnostics" value="Passing" detail="Worker, payroll, network, CPI, household budget" />
        </div>
      </section>

      <section className="controls-section">
        <div className="amor-shell controls-grid">
          <div>
            <p className="amor-kicker">Household controls</p>
            <h2>Behavior mix</h2>
          </div>
          <form className="control-panel" aria-label="Milestone 2 household behavior controls">
            <ControlSlider label="Hand-to-mouth" value={handToMouth} onChange={setHandToMouth} />
            <ControlSlider label="Liquidity buffer" value={liquidityBuffer} onChange={setLiquidityBuffer} />
            <ControlSlider label="Habit rule" value={habit} onChange={setHabit} />
            <ControlSlider label="Debt stress" value={debtStress} onChange={setDebtStress} />
            <ControlSlider label="Anchored expectations" value={anchoredExpectations} onChange={setAnchoredExpectations} />
            <ControlSlider label="Matching friction" value={matchingFriction} onChange={setMatchingFriction} />
            <ControlSlider label="Wage indexation" value={wageIndexation} onChange={setWageIndexation} />
            <ControlSlider label="Rule switching" value={ruleSwitching} onChange={setRuleSwitching} />
          </form>
        </div>
      </section>

      <section className="results-section">
        <div className="amor-shell results-grid">
          <div>
            <p className="amor-kicker">Seeded Milestone 2 result</p>
            <h2>Metadata before conclusions</h2>
            <p>
              The current browser run is a stylized 100,000-household ABM with household decision rules, expectations,
              employer-worker links, production-network plumbing, and CPI construction before Norway/EU calibration.
            </p>
            <ul className="metadata-list">
              <li>Model version: {result.metadata.modelVersion}</li>
              <li>Scenario: {result.metadata.scenarioName}</li>
              <li>Parameter hash: {result.metadata.parameterHash}</li>
              <li>Seed policy: {result.metadata.seedPolicy}</li>
              <li>Scale: {result.metadata.scale.households.toLocaleString()} households; {result.metadata.scale.firms.toLocaleString()} firms; {result.metadata.scale.supplierEdges.toLocaleString()} supplier edges</li>
              <li>Accounting checks: {result.diagnostics.accountingChecksPassed ? "passed" : "failed"}</li>
              <li>Expected inflation: {(finalPoint.averageInflationExpectation * 100).toFixed(2)} percent</li>
            </ul>
          </div>
          <PathChart path={result.path} />
        </div>
      </section>

      <section className="amor-shell content-section">
        <div className="section-heading">
          <p className="amor-kicker">Next build target</p>
          <h2>Move behavior into workers and scenarios</h2>
        </div>
        <div className="work-grid">
          <article>
            <h3>Labor market</h3>
            <p>Wage offers, matching friction, hiring, firing, vacancies, layoffs, and payroll update exact employer ids.</p>
          </article>
          <article>
            <h3>Household rules</h3>
            <p>Hand-to-mouth, liquidity-buffer, habit, and debt-stress rules now drive consumption and switching.</p>
          </article>
          <article>
            <h3>Expectations</h3>
            <p>Adaptive, anchored, extrapolative, and employer-sector expectations now feed household demand.</p>
          </article>
        </div>
        <p className="final-metric">
          Final Milestone 2 path: inflation {(finalPoint.inflationAnnualized * 100).toFixed(2)} percent annualized,
          consumption index {finalPoint.consumptionIndex.toFixed(2)}, unemployment{" "}
          {(finalPoint.unemploymentRate * 100).toFixed(2)} percent.
        </p>
      </section>
    </main>
  );
}
