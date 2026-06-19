# Static-Site Result Artifacts

Milestone 10 adds a small static artifact contract between the offline research engine and the browser site.

The goal is to let GitHub Pages present reproducible model outputs without committing raw household, firm, bank, or edge-level microstate.

## Artifact Builder

The exporter is:

```bash
PYTHONPATH=research_engine python3 -m world_abm.static_site \
  --config experiments/configs/research_scale_baseline.yaml \
  --households 2000 \
  --firms 60 \
  --periods 5 \
  --supplier-edges 360 \
  --out data/static-site/milestone10_results.json
```

The committed Milestone 10 artifact is intentionally smoke-scale. The same exporter is designed for reviewed research-scale summaries once Norway/EU calibration and paired-seed runs are ready.

## Included Fields

- schema version, artifact kind, source, scenario name, economy context, calibration status, parameter hash, seed policy, scale, and deterministic generation label;
- diagnostics pass/fail;
- aggregate summary metrics from the final period;
- selected final-period path values;
- compressed production-network summary values;
- top ranked sector-stress rows from the final period;
- economy assumption notes;
- artifact policy and limitations.

## Excluded Fields

The artifact must not include:

- household arrays;
- firm arrays;
- bank arrays;
- full edge lists;
- full aggregate or sector time series;
- raw generated populations;
- personally identifying or restricted source data.

The canonical policy flag is:

```json
{
  "rawMicrostateIncluded": false
}
```

## Interpretation

Norway remains the first calibration target. EU / Euro area assumptions are comparison or fallback assumptions until explicitly documented.

Milestone 10 artifacts are presentation and reproducibility objects. They are not forecasts, policy advice, or calibrated empirical findings unless the artifact metadata, manuscript, and sensitivity analysis say so explicitly.
