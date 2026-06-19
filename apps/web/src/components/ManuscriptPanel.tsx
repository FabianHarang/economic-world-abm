import type { CounterfactualExperimentResult, SimulationResult } from "@world-abm/core";

interface ManuscriptPanelProps {
  readonly result: SimulationResult;
  readonly experiment: CounterfactualExperimentResult;
}

const outline = [
  ["motivation", "Motivation"],
  ["contribution", "Contribution"],
  ["literature", "Literature position"],
  ["model", "Model design"],
  ["interpretation", "Current evidence"],
  ["roadmap", "Research roadmap"]
] as const;

const literatureCards = [
  {
    title: "Heterogeneous-agent monetary economics",
    anchor: "Kaplan, Moll, and Violante; Auclert; McKay and Reis",
    text:
      "HANK models show why household balance sheets and marginal propensities to consume matter for monetary transmission. This project keeps that distributional concern, then adds explicit firms, banks, labor links, and network propagation."
  },
  {
    title: "Financial accelerator and collateral channels",
    anchor: "Bernanke, Gertler, and Gilchrist; Kiyotaki and Moore; Iacoviello",
    text:
      "Credit frictions can amplify small shocks through net worth, collateral, and borrowing constraints. The ABM makes these channels visible through bank tightness, mortgage payments, housing prices, equity values, and firm cash flow."
  },
  {
    title: "Production-network macroeconomics",
    anchor: "Acemoglu et al.; Gabaix; Carvalho; Baqaee and Farhi",
    text:
      "Aggregate outcomes can depend on which sectors are connected, how large firms or sectors are, and how shocks move through input-output links. The network view is therefore part of the research design, not decoration."
  },
  {
    title: "Agent-based macroeconomics",
    anchor: "Delli Gatti et al.; Dawid and Delli Gatti; Fagiolo and Roventini",
    text:
      "ABM work studies economies as interacting, out-of-equilibrium systems. The contribution here is not a black-box simulation; it is a reproducible laboratory with paired seeds, diagnostics, documented assumptions, and calibration gates."
  }
] as const;

export function ManuscriptPanel({ result, experiment }: ManuscriptPanelProps) {
  const final = result.path[result.path.length - 1];
  const inflation = (final.inflationAnnualized * 100).toFixed(2);
  const unemployment = (final.unemploymentRate * 100).toFixed(2);
  const output = final.outputIndex.toFixed(2);
  const peakInflationDelta = experiment.summary.peakInflationDeltaPp.toFixed(2);

  return (
    <section className="manuscript-reader" aria-label="Readable manuscript">
      <header className="manuscript-cover">
        <div>
          <p className="amor-kicker">Manuscript reader</p>
          <h3>Interest-rate transmission in a heterogeneous, networked economy</h3>
          <p>
            The paper asks how a policy-rate increase propagates when households differ in liquidity and debt exposure,
            firms depend on bank credit and supplier inputs, workers are attached to employers, and Norway-style
            variable-rate mortgages transmit policy quickly into household cash flow.
          </p>
        </div>
        <dl className="manuscript-meta">
          <div>
            <dt>Model version</dt>
            <dd>{result.metadata.modelVersion}</dd>
          </div>
          <div>
            <dt>Scenario</dt>
            <dd>{result.metadata.scenarioName}</dd>
          </div>
          <div>
            <dt>Seed policy</dt>
            <dd>{experiment.metadata.pairedSeedPolicy}</dd>
          </div>
          <div>
            <dt>Diagnostics</dt>
            <dd>{result.diagnostics.accountingChecksPassed ? "passed" : "failed"}</dd>
          </div>
        </dl>
      </header>

      <div className="manuscript-layout">
        <nav className="manuscript-outline" aria-label="Manuscript outline">
          {outline.map(([id, label]) => (
            <a href={`#manuscript-${id}`} key={id}>
              {label}
            </a>
          ))}
        </nav>

        <article className="manuscript-article">
          <section className="manuscript-chapter" id="manuscript-motivation">
            <span>01</span>
            <h4>Motivation</h4>
            <p>
              Monetary policy is often summarized as a demand-management instrument: raise rates, cool spending, reduce
              inflation. That summary hides several channels that can operate with different signs and delays. Higher
              rates reduce demand through debt service and credit conditions, but they can also raise firm financing
              costs, alter housing and collateral values, change wage bargaining pressure, and expose bottlenecks in
              supplier networks.
            </p>
            <p>
              This is especially relevant for Norway. When a large share of mortgages reprices quickly, a policy-rate
              shock reaches household cash flow faster than in economies dominated by long fixed-rate mortgages. The
              same rate change can therefore hit consumption, housing demand, bank credit risk, construction, and firm
              revenues within the same macro episode.
            </p>
          </section>

          <section className="manuscript-chapter" id="manuscript-contribution">
            <span>02</span>
            <h4>Contribution</h4>
            <p>
              The project contributes a computational laboratory rather than a single reduced-form coefficient. It
              combines household heterogeneity, employer-worker links, banks, mortgage pass-through, housing and equity
              prices, and a sparse production network inside one paired-seed counterfactual design.
            </p>
            <div className="manuscript-callout">
              The central object is not whether rates always lower inflation. The central object is the set of
              conditions under which disinflation dominates cost pass-through, network stress, credit tightening, and
              asset-price feedbacks.
            </div>
          </section>

          <section className="manuscript-chapter" id="manuscript-literature">
            <span>03</span>
            <h4>Literature position</h4>
            <p>
              The model sits between HANK, financial-accelerator, production-network, and ABM traditions. HANK models
              provide the logic for heterogeneous household transmission; financial-accelerator models motivate credit
              and collateral feedback; production-network macro motivates supplier-buyer propagation; ABM methodology
              motivates heterogeneous interacting agents that need not remain near a representative-agent equilibrium.
            </p>
          </section>

          <section className="manuscript-chapter" id="manuscript-model">
            <span>04</span>
            <h4>Model design</h4>
            <p>
              The browser companion runs 100,000 households and 1,000 firms for interactive exploration. The offline
              engine targets one million households, 5,000 firms, and 75,000 sparse supplier links. Households carry
              deposits, debt, mortgage exposure, behavior rules, expectations, and employer assignments. Firms carry
              workers, prices, wages, inventories, backlogs, debt, cash, and equity value. Banks transmit credit
              tightness and mortgage conditions.
            </p>
            <p>
              Every treatment run is paired with a baseline using identical seeds. This design helps isolate the policy
              shock from random population and network draws, while still keeping the model stochastic and heterogeneous.
            </p>
          </section>

          <section className="manuscript-chapter" id="manuscript-interpretation">
            <span>05</span>
            <h4>Current evidence</h4>
            <p>
              The current browser treatment ends with {inflation}% annualized inflation, {unemployment}% unemployment,
              and an output index of {output}. The paired-seed experiment records a peak inflation treatment effect of{" "}
              {peakInflationDelta} percentage points. These values are architecture checks, not empirical estimates.
            </p>
            <p>
              The site therefore separates live simulator output from static artifacts and keeps diagnostics, scenario
              names, parameter hashes, seed policy, and scale visible. A result becomes an economic claim only after
              Norway/EU calibration, sensitivity analysis, and many paired seeds.
            </p>
          </section>

          <section className="manuscript-chapter" id="manuscript-roadmap">
            <span>06</span>
            <h4>Research roadmap</h4>
            <p>
              The next empirical step is not more interface polish. It is data discipline: Norway-first calibration of
              mortgage pass-through, household debt service, sector employment, price dynamics, input-output exposure,
              and bank credit conditions, followed by an explicit EU / Euro area comparison.
            </p>
            <p>
              Only after that should the project publish research-scale paired-seed artifacts as substantive evidence.
              Until then, the website is a transparent laboratory for model design, mechanism inspection, and
              reproducibility.
            </p>
          </section>
        </article>
      </div>

      <section className="literature-positioning" aria-label="Literature positioning">
        <div>
          <p className="amor-kicker">Positioning</p>
          <h4>How the project relates to existing macro literature</h4>
        </div>
        <div className="literature-positioning-grid">
          {literatureCards.map((card) => (
            <article key={card.title}>
              <span>{card.title}</span>
              <strong>{card.anchor}</strong>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="manuscript-rule-grid" aria-label="Interpretation rules">
        <article>
          <span>Do not overread</span>
          <p>Current outputs are smoke and architecture checks until calibrated Norway/EU evidence is added.</p>
        </article>
        <article>
          <span>Read channels jointly</span>
          <p>Demand, mortgage cash flow, credit tightness, collateral, wages, and supplier stress can move together.</p>
        </article>
        <article>
          <span>Preserve provenance</span>
          <p>Every figure must remain tied to model version, scenario, seed policy, scale, and parameter hash.</p>
        </article>
      </section>
    </section>
  );
}
