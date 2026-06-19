import type { StaticSiteArtifact } from "../data/staticResults";

interface StaticResultsPanelProps {
  readonly artifact: StaticSiteArtifact;
}

export function StaticResultsPanel({ artifact }: StaticResultsPanelProps) {
  const final = artifact.finalPeriod;
  const policy = artifact.artifactPolicy;
  const scaleLabel = policy.researchScaleRun ? "Research scale" : "Smoke artifact";

  return (
    <section className="static-results-panel" aria-label="Curated static result artifact">
      <div className="artifact-hero">
        <div>
          <p className="amor-kicker">Evidence status</p>
          <h3>{scaleLabel}: {artifact.scenarioName}</h3>
          <p>
            The current published artifact demonstrates the research pipeline: an offline engine run reduced to
            diagnostics, aggregate outcomes, network metrics, and sector stress rankings. It is deliberately labelled as
            a smoke artifact until calibrated Norway/EU paired-seed results replace it.
          </p>
        </div>
        <dl className="artifact-id-card">
          <div>
            <dt>Version</dt>
            <dd>{artifact.schemaVersion}</dd>
          </div>
          <div>
            <dt>Parameter hash</dt>
            <dd>{artifact.parameterHash}</dd>
          </div>
          <div>
            <dt>Diagnostics</dt>
            <dd>{artifact.diagnosticsPassed ? "Passed" : "Failed"}</dd>
          </div>
          <div>
            <dt>Raw microstate</dt>
            <dd>{policy.rawMicrostateIncluded ? "Included" : "Excluded"}</dd>
          </div>
        </dl>
      </div>

      <div className="static-results-grid">
        <article className="artifact-card">
          <span>Scale</span>
          <strong>{artifact.scale.households.toLocaleString()} households</strong>
          <p>
            {artifact.scale.firms.toLocaleString()} firms, {artifact.scale.banks.toLocaleString()} banks,{" "}
            {artifact.scale.sectors.toLocaleString()} sectors, {artifact.scale.supplierEdges.toLocaleString()} sparse
            supplier edges.
          </p>
        </article>
        <article className="artifact-card">
          <span>Final inflation</span>
          <strong>{percent(final.inflationAnnualized)}</strong>
          <p>
            Policy rate {percent(final.policyRateAnnual)}; mortgage rate {percent(final.mortgageRateAnnual)}.
          </p>
        </article>
        <article className="artifact-card">
          <span>Final output</span>
          <strong>{final.outputIndex.toFixed(2)}</strong>
          <p>
            Consumption {final.consumptionIndex.toFixed(2)}, unemployment {percent(final.unemploymentRate)}, layoffs{" "}
            {final.layoffs.toLocaleString()} in the final period.
          </p>
        </article>
        <article className="artifact-card">
          <span>Asset channel</span>
          <strong>{final.housingPriceIndex.toFixed(2)}</strong>
          <p>
            Housing index with equity {final.equityPriceIndex.toFixed(2)} and bank tightness{" "}
            {percent(final.bankCreditTightness)}.
          </p>
        </article>
      </div>

      <div className="artifact-details-grid">
        <section className="artifact-summary" aria-label="Static artifact assumptions">
          <p className="amor-kicker">Economy assumptions</p>
          <h4>{artifact.economyAssumptions.primary} first, {artifact.economyAssumptions.secondary} comparison</h4>
          <p>{artifact.economyAssumptions.mortgagePassThrough}</p>
          <p>
            The economic interpretation is intentionally restrained: this run checks the reporting contract before the
            model is calibrated to Norwegian debt, housing, labor, banking, price, and input-output data.
          </p>
          <dl>
            <div>
              <dt>Network representation</dt>
              <dd>{artifact.network.representation}</dd>
            </div>
            <div>
              <dt>Average sparse degree</dt>
              <dd>{artifact.network.average_in_degree.toFixed(1)}</dd>
            </div>
            <div>
              <dt>Delivery failure rate</dt>
              <dd>{percent(artifact.network.delivery_failure_rate)}</dd>
            </div>
            <div>
              <dt>Worker representation</dt>
              <dd>{artifact.summary.workerRepresentation}</dd>
            </div>
          </dl>
        </section>

        <section className="sector-stress-list" aria-label="Top sector stress rankings">
          <div className="sector-stress-header">
            <p className="amor-kicker">Sector stress</p>
            <span>Period {final.period}</span>
          </div>
          <div className="sector-stress-table">
            <div className="sector-stress-row sector-stress-head">
              <span>Sector</span>
              <span>Stress</span>
              <span>Output</span>
              <span>Failures</span>
            </div>
            {artifact.sectorStressTop.map((sector) => (
              <div className="sector-stress-row" key={sector.sectorId}>
                <span>{sector.sectorId}</span>
                <span>{sector.stressScore.toFixed(3)}</span>
                <span>{sector.outputIndex.toFixed(1)}</span>
                <span>{percent(sector.deliveryFailureRate)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="artifact-policy" aria-label="Artifact policy and limitations">
        <div>
          <p className="amor-kicker">Publication rule</p>
          <h4>Curated aggregate summary only</h4>
          <p>{policy.intendedUse}</p>
        </div>
        <ul>
          {policy.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </section>
    </section>
  );
}

function percent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}
