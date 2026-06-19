import type { CounterfactualExperimentResult, SimulationResult } from "@world-abm/core";

interface ManuscriptPanelProps {
  readonly result: SimulationResult;
  readonly experiment: CounterfactualExperimentResult;
}

const outline = [
  ["purpose", "Lab purpose"],
  ["scale", "Scale"],
  ["target", "2% target"],
  ["regimes", "Policy regimes"],
  ["calibration", "Calibration"],
  ["sources", "Source anchors"]
] as const;

const scaleCards = [
  {
    title: "Interactive browser run",
    value: "100,000 households",
    text:
      "This is the live TypeScript economy shown in the controls, charts, networks, and labor views. It is meant for fast exploration."
  },
  {
    title: "Local offline target",
    value: "1,000,000 households",
    text:
      "This is the large local engine target for heavier paired-seed runs, calibration sweeps, and compressed artifacts."
  },
  {
    title: "Saved site artifact",
    value: "2,000 households",
    text:
      "This small committed artifact tests the static publication contract. It is not the browser run and not the million-household run."
  }
] as const;

const policyRegimes = [
  {
    title: "Systematic disinflation rule",
    source: "Taylor; Norges Bank; ECB",
    text:
      "Test a transparent reaction rule that raises or holds the policy rate while the inflation gap remains positive, but does not mechanically chase one noisy monthly value."
  },
  {
    title: "Expectations anchor package",
    source: "Norges Bank; ECB; IMF",
    text:
      "Increase central-bank credibility, publish a clear path back to 2%, and test whether better-anchored expectations reduce wage and price persistence."
  },
  {
    title: "Second-round prevention",
    source: "Norges Bank",
    text:
      "Separate temporary energy or import-price shocks from broad spillovers into wages and other prices, then tighten more when spillovers become persistent."
  },
  {
    title: "Aligned fiscal stance",
    source: "IMF; Norges Bank",
    text:
      "Avoid broad demand stimulus while inflation is high. If households need protection, test targeted and offset support rather than economy-wide demand boosts."
  },
  {
    title: "Norway mortgage guardrail",
    source: "Norges Bank; model assumption",
    text:
      "Because Norway is modeled with very high variable-rate mortgage pass-through, rate hikes should be tested with household cash-flow stress, bank credit risk, and housing feedbacks visible."
  },
  {
    title: "Supply-network repair",
    source: "Norges Bank; ECB",
    text:
      "When inflation is partly cost- or bottleneck-driven, monetary policy can limit spillovers, while supplier substitution, inventories, and sector capacity affect the output cost of disinflation."
  }
] as const;

const sourceCards = [
  {
    title: "Norges Bank: inflation target",
    href: "https://www.norges-bank.no/en/topics/monetary-policy/inflation/",
    text:
      "Norges Bank states a 2% annual inflation target and describes the policy rate as the main instrument for steering inflation."
  },
  {
    title: "Norges Bank: strategy statement",
    href: "https://www.norges-bank.no/en/topics/monetary-policy/monetary-policy-strategy/",
    text:
      "The strategy emphasizes flexible, forward-looking inflation targeting, spillovers into wages and prices, financial imbalances, lags, uncertainty, and gradualism unless risks are severe."
  },
  {
    title: "ECB monetary policy strategy",
    href: "https://www.ecb.europa.eu/mopo/strategy/strategy-review/ecb.strategyreview_monpol_strategy_statement.en.html",
    text:
      "The ECB frames 2% inflation over the medium term as a symmetric target and stresses expectations, context-specific responses, policy-rate instruments, and financial transmission."
  },
  {
    title: "IMF WEO 2023: expectations",
    href: "https://www.imf.org/en/publications/weo/issues/2023/10/10/world-economic-outlook-october-2023",
    text:
      "The IMF argues that anchored expectations and communication can help bring inflation back to target faster and at lower output cost."
  },
  {
    title: "Taylor 1993: policy rules",
    href: "https://web.stanford.edu/~johntayl/Onlinepaperscombinedbyyear/1993/Discretion_versus_Policy_Rules_in_Practice.pdf",
    text:
      "Taylor argues for systematic policy rules with judgment, not blindly mechanical formulas."
  }
] as const;

export function ManuscriptPanel({ result, experiment }: ManuscriptPanelProps) {
  const final = result.path[result.path.length - 1];
  const targetInflation = 0.02;
  const inflation = (final.inflationAnnualized * 100).toFixed(2);
  const inflationGap = ((final.inflationAnnualized - targetInflation) * 100).toFixed(2);
  const unemployment = (final.unemploymentRate * 100).toFixed(2);
  const output = final.outputIndex.toFixed(2);
  const peakInflationDelta = experiment.summary.peakInflationDeltaPp.toFixed(2);

  return (
    <section className="manuscript-reader" aria-label="Virtual economy data lab guide">
      <header className="manuscript-cover">
        <div>
          <p className="amor-kicker">Lab guide</p>
          <h3>Virtual economy data lab for regime testing</h3>
          <p>
            We have not produced an empirical finding yet. The site is a structured laboratory for building artificial
            economies, changing regimes, and comparing how inflation, output, unemployment, housing, credit, wages, and
            supplier networks evolve under those assumptions.
          </p>
        </div>
        <dl className="manuscript-meta">
          <div>
            <dt>Browser economy</dt>
            <dd>{result.metadata.scale.households.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Inflation target</dt>
            <dd>{(targetInflation * 100).toFixed(0)}%</dd>
          </div>
          <div>
            <dt>Current gap</dt>
            <dd>{inflationGap} pp</dd>
          </div>
          <div>
            <dt>Diagnostics</dt>
            <dd>{result.diagnostics.accountingChecksPassed ? "passed" : "failed"}</dd>
          </div>
        </dl>
      </header>

      <div className="manuscript-layout">
        <nav className="manuscript-outline" aria-label="Lab guide outline">
          {outline.map(([id, label]) => (
            <a href={`#manuscript-${id}`} key={id}>
              {label}
            </a>
          ))}
        </nav>

        <article className="manuscript-article">
          <section className="manuscript-chapter" id="manuscript-purpose">
            <span>01</span>
            <h4>Purpose</h4>
            <p>
              The lab should answer questions like: what happens if monetary policy is more systematic, expectations
              are better anchored, mortgage pass-through is stronger, fiscal support is broad or targeted, supplier
              networks are fragile, or wage indexation is high? The point is to test regimes and inspect the channels,
              not to announce that one current chart is the economy.
            </p>
            <p>
              Norway remains the first economy because variable-rate mortgages make household cash-flow transmission a
              central mechanism. EU / Euro area comparisons should be added as separate parameter sets, especially for
              mortgage pass-through, bank lending, housing structure, and supplier-network exposure.
            </p>
          </section>

          <section className="manuscript-chapter" id="manuscript-scale">
            <span>02</span>
            <h4>Scale is now explicit</h4>
            <p>
              The previous page mixed scale language too easily. The lab now distinguishes three separate objects. A
              live browser run is not the same thing as a local million-household target, and the small saved artifact
              is only a publication-pipeline test.
            </p>
            <div className="lab-scale-grid">
              {scaleCards.map((card) => (
                <article key={card.title}>
                  <span>{card.title}</span>
                  <strong>{card.value}</strong>
                  <p>{card.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="manuscript-chapter" id="manuscript-target">
            <span>03</span>
            <h4>The 2% target is the calibration anchor</h4>
            <p>
              The current browser treatment ends with {inflation}% annualized inflation, {unemployment}% unemployment,
              output index {output}, and a {inflationGap} percentage-point gap to the 2% target. That is not acceptable
              as a calibrated macro result. It tells us the current lab parameters produce too much inflation and need a
              disinflation regime plus calibration discipline.
            </p>
            <div className="manuscript-callout">
              Practical lab advice: treat high simulated inflation as a failed calibration state. The next test should
              combine a systematic policy-rate rule, stronger expectation anchoring, and explicit checks for wage,
              mortgage, credit, and supplier-network spillovers.
            </div>
          </section>

          <section className="manuscript-chapter" id="manuscript-regimes">
            <span>04</span>
            <h4>Policy regimes to test for returning inflation toward 2%</h4>
            <p>
              The most sensible first policy package is not a single ad hoc rate hike. It is a transparent disinflation
              regime: raise or hold rates when the inflation gap and expectations remain too high, communicate the path
              back to 2%, avoid broad fiscal demand support, and protect financial stability where mortgage pass-through
              is strong.
            </p>
            <div className="policy-regime-grid">
              {policyRegimes.map((regime) => (
                <article key={regime.title}>
                  <span>{regime.source}</span>
                  <strong>{regime.title}</strong>
                  <p>{regime.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="manuscript-chapter" id="manuscript-calibration">
            <span>05</span>
            <h4>What must be calibrated next</h4>
            <p>
              The lab should add a Norway calibration pack before interpreting disinflation paths: mortgage repricing
              speeds, household debt service, income groups, wage formation, sector employment, CPI/CPI-ATE dynamics,
              bank credit conditions, import-price exposure, and input-output links. The EU / Euro area pack should then
              vary the same channels rather than copying Norway’s mortgage structure.
            </p>
            <p>
              The paired-seed treatment effect currently records a peak inflation effect of {peakInflationDelta}
              percentage points. That statistic is useful for debugging the lab, but it becomes economically meaningful
              only after the assumptions match data and sensitivity sweeps show which regimes robustly move inflation
              toward target.
            </p>
          </section>

          <section className="manuscript-chapter" id="manuscript-sources">
            <span>06</span>
            <h4>Source anchors used for the policy playbook</h4>
            <p>
              These sources are included so every policy regime in the lab can point back to the literature or official
              strategy statement that motivated it.
            </p>
            <div className="policy-source-list">
              {sourceCards.map((source) => (
                <a href={source.href} key={source.title} target="_blank" rel="noreferrer">
                  <strong>{source.title}</strong>
                  <span>{source.text}</span>
                </a>
              ))}
            </div>
          </section>
        </article>
      </div>

      <section className="manuscript-rule-grid" aria-label="Lab interpretation rules">
        <article>
          <span>Do not overread</span>
          <p>Current outputs are mechanism and architecture checks until Norway/EU calibration is added.</p>
        </article>
        <article>
          <span>Use the target</span>
          <p>Every inflation run should show its gap to the 2% target and whether the regime closes it over time.</p>
        </article>
        <article>
          <span>Compare regimes</span>
          <p>Rate paths, expectations, fiscal stance, mortgage pass-through, and supplier repair should be tested jointly.</p>
        </article>
      </section>
    </section>
  );
}
