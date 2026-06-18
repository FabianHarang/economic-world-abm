import { firstStructuralDemoConfig, researchScaleMilestoneConfig, runSimulation } from "@world-abm/core";
import { MetricTile } from "./components/MetricTile";
import { PathChart } from "./components/PathChart";

const result = runSimulation(firstStructuralDemoConfig);
const finalPoint = result.path[result.path.length - 1];

export function App() {
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
              <span className="snapshot-title">Milestone 1 browser run</span>
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
          <p className="amor-kicker">Milestone 1</p>
          <h2>Structural ABM status</h2>
        </div>
        <div className="metric-grid">
          <MetricTile label="Browser households" value={firstStructuralDemoConfig.households.toLocaleString()} detail="Typed-array Milestone 1 run" />
          <MetricTile label="Research target" value={researchScaleMilestoneConfig.households.toLocaleString()} detail="Offline/local-large target config" />
          <MetricTile label="Supplier edges" value={result.summary.supplierEdges.toLocaleString()} detail="Explicit directed firm network" />
          <MetricTile label="Diagnostics" value="Passing" detail="Worker, payroll, network, and CPI checks" />
        </div>
      </section>

      <section className="results-section">
        <div className="amor-shell results-grid">
          <div>
            <p className="amor-kicker">Seeded Milestone 1 result</p>
            <h2>Metadata before conclusions</h2>
            <p>
              The current browser run is a stylized 100,000-household ABM. It is large enough to test architecture,
              employer-worker consistency, production-network plumbing, and CPI construction before Norway/EU calibration.
            </p>
            <ul className="metadata-list">
              <li>Model version: {result.metadata.modelVersion}</li>
              <li>Scenario: {result.metadata.scenarioName}</li>
              <li>Parameter hash: {result.metadata.parameterHash}</li>
              <li>Seed policy: {result.metadata.seedPolicy}</li>
              <li>Scale: {result.metadata.scale.households.toLocaleString()} households; {result.metadata.scale.firms.toLocaleString()} firms; {result.metadata.scale.supplierEdges.toLocaleString()} supplier edges</li>
              <li>Accounting checks: {result.diagnostics.accountingChecksPassed ? "passed" : "failed"}</li>
            </ul>
          </div>
          <PathChart path={result.path} />
        </div>
      </section>

      <section className="amor-shell content-section">
        <div className="section-heading">
          <p className="amor-kicker">Next build target</p>
          <h2>Deepen the Milestone 1 economy</h2>
        </div>
        <div className="work-grid">
          <article>
            <h3>Labor market</h3>
            <p>Hiring, firing, vacancies, layoffs, and payroll now update exact household employer ids.</p>
          </article>
          <article>
            <h3>Production network</h3>
            <p>Firms now have sector/stage assignments, supplier contracts, and input-cost propagation.</p>
          </article>
          <article>
            <h3>Research scale</h3>
            <p>The next engine pass should move the 1,000,000-household target out of the browser and into offline runs.</p>
          </article>
        </div>
        <p className="final-metric">
          Final Milestone 1 path: inflation {(finalPoint.inflationAnnualized * 100).toFixed(2)} percent annualized,
          unemployment {(finalPoint.unemploymentRate * 100).toFixed(2)} percent, output index{" "}
          {finalPoint.outputIndex.toFixed(1)}.
        </p>
      </section>
    </main>
  );
}
