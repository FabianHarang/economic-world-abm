import { firstStructuralDemoConfig, runSimulation } from "@world-abm/core";
import { amorTheme } from "@world-abm/ui";
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
              <h1>Large-scale economic world ABM for monetary-policy counterfactuals</h1>
              <p className="hero-lede">
                A heterogeneous-agent model with households, firms, banks, employer-worker links, and production
                networks. The goal is to test when rate increases lower inflation, when effects are delayed, and when
                cost channels or supply-chain stress can dominate.
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
              <span className="snapshot-title">First structural demo target</span>
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
              </dl>
            </aside>
          </div>
        </div>
      </section>

      <section className="status-band" id="model-warning">
        <div className="amor-shell">
          <div className="model-warning">
            This is a model-generated counterfactual laboratory, not a forecast and not policy advice. Early scaffold
            charts verify architecture and reproducibility; economic claims require calibrated scenarios, paired seeds,
            sensitivity analysis, and documented limitations.
          </div>
        </div>
      </section>

      <section className="amor-shell content-section" id="scaffold-status">
        <div className="section-heading">
          <p className="amor-kicker">Milestone 0</p>
          <h2>Foundation status</h2>
        </div>
        <div className="metric-grid">
          <MetricTile label="Design source" value="AMOR" detail="Approved assets and tokens integrated" />
          <MetricTile label="Calibration path" value="Norway" detail="EU / Euro area follows as documented comparison" />
          <MetricTile label="Diagnostics" value="Passing" detail="Employer-worker and payroll invariants active" />
          <MetricTile label="Theme primary" value={amorTheme.color.petrol} detail="Petroleum, teal, sand, paper" />
        </div>
      </section>

      <section className="results-section">
        <div className="amor-shell results-grid">
          <div>
            <p className="amor-kicker">Seeded scaffold result</p>
            <h2>Metadata before conclusions</h2>
            <p>
              Every future chart must carry model version, scenario, parameter hash, seed policy, scale, and generated
              date. The values below are deliberately shown before any interpretation.
            </p>
            <ul className="metadata-list">
              <li>Model version: {result.metadata.modelVersion}</li>
              <li>Scenario: {result.metadata.scenarioName}</li>
              <li>Parameter hash: {result.metadata.parameterHash}</li>
              <li>Seed policy: {result.metadata.seedPolicy}</li>
              <li>Accounting checks: {result.diagnostics.accountingChecksPassed ? "passed" : "failed"}</li>
            </ul>
          </div>
          <PathChart path={result.path} />
        </div>
      </section>

      <section className="amor-shell content-section">
        <div className="section-heading">
          <p className="amor-kicker">Next build target</p>
          <h2>From scaffold to structural ABM</h2>
        </div>
        <div className="work-grid">
          <article>
            <h3>Employer-worker engine</h3>
            <p>Hiring, firing, vacancies, layoffs, and payroll flows must update households and firms consistently.</p>
          </article>
          <article>
            <h3>Production network</h3>
            <p>Firms need sector/stage assignments, supplier contracts, input inventories, and bottleneck diagnostics.</p>
          </article>
          <article>
            <h3>Paired counterfactuals</h3>
            <p>Baseline and treatment runs must share shocks so rate-hike effects are estimated by paired differences.</p>
          </article>
        </div>
        <p className="final-metric">
          Final scaffold unemployment path ends at {(finalPoint.unemploymentRate * 100).toFixed(2)} percent in the
          deterministic plumbing run.
        </p>
      </section>
    </main>
  );
}

