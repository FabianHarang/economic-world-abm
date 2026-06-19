import type { CounterfactualExperimentResult, SimulationResult } from "@world-abm/core";

interface ManuscriptPanelProps {
  readonly result: SimulationResult;
  readonly experiment: CounterfactualExperimentResult;
}

const manuscriptSections = [
  ["01", "Research question and contribution", "Drafted"],
  ["02", "Literature review", "Drafted"],
  ["04", "Households and expectations", "Extended"],
  ["05", "Firms and production networks", "Extended"],
  ["06", "Labor market and employer-worker links", "Extended"],
  ["07", "Credit, housing, construction, and equity", "Extended"],
  ["08", "Counterfactual experiments", "Extended"],
  ["09", "Research-scale engine", "Extended"],
  ["10", "Calibration and sensitivity", "Extended"],
  ["11", "Results discussion", "Drafted"],
  ["12", "Limitations", "Drafted"],
  ["13", "Reproducibility guide", "Drafted"]
] as const;

const literatureSources = [
  ["ABM overview", "Cristelli, Pietronero, and Zaccaria"],
  ["Credit networks", "Delli Gatti, Gallegati, Greenwald, Russo, and Stiglitz"],
  ["Production networks", "Mandel and Veetil"],
  ["Graph analytics UI", "Neo4j Aura Graph Analytics"]
] as const;

export function ManuscriptPanel({ result, experiment }: ManuscriptPanelProps) {
  return (
    <div className="manuscript-panel" aria-label="Milestone 8 manuscript and reproducibility panel">
      <div className="manuscript-column">
        <span>Manuscript</span>
        <strong>Research draft map</strong>
        <div className="manuscript-section-list">
          {manuscriptSections.map(([chapter, title, status]) => (
            <div key={chapter}>
              <span>{chapter}</span>
              <p>{title}</p>
              <strong>{status}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="manuscript-column">
        <span>Evidence</span>
        <strong>Reproducibility anchors</strong>
        <dl className="manuscript-facts">
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
            <dt>Parameter hash</dt>
            <dd>{result.metadata.parameterHash}</dd>
          </div>
          <div>
            <dt>Accounting checks</dt>
            <dd>{result.diagnostics.accountingChecksPassed ? "passed" : "failed"}</dd>
          </div>
          <div>
            <dt>Limitations</dt>
            <dd>visible and versioned</dd>
          </div>
        </dl>

        <span>Literature</span>
        <div className="literature-list">
          {literatureSources.map(([topic, source]) => (
            <div key={topic}>
              <strong>{topic}</strong>
              <span>{source}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
