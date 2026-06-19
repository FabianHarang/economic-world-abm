# Research-Scale Engine

Milestone 6 introduces an offline Python engine for runs that are too large or too slow for the browser. The goal is not to replace the TypeScript browser companion; it is to create a reproducible path for larger Norway-first experiments and future calibration sweeps.

## Default Target

- 1,000,000 households;
- 5,000 firms;
- 25 private banks;
- 25 sectors;
- 75,000 sparse supplier edges;
- 120 monthly periods.

## State Layout

The engine uses Python standard-library typed arrays in `research_engine/world_abm`:

- household arrays: employer snapshot, bank id, deposits, debt, mortgage debt, variable-rate mortgage exposure, behavior rule, expectation rule;
- firm arrays: worker count, baseline workers, sector, stage, productivity, price, wage, output, inventory, backlog, cash, debt, equity value;
- bank arrays: capital and credit tightness;
- production-network arrays: buyer pointer, supplier id, buyer id, contract weight, reliability.

The employer-worker representation is scalable: firm worker counts are the period-by-period source of truth, while a household-employer snapshot preserves deterministic population structure without maintaining expensive per-firm rosters.

## Output Policy

Research runs write compact artifacts:

- `metadata.json`;
- `summary.json`;
- `diagnostics.json`;
- `network_summary.json`;
- `aggregate.jsonl.gz`;
- `sectors.jsonl.gz`.

Raw household microstate is not written by default. Curated small outputs for the website should be copied into `data/static-site` only after review.

## Cross-Scale Validation

Before interpreting a million-household output, run:

```bash
PYTHONPATH=research_engine python3 -m world_abm.validate \
  --config experiments/configs/research_scale_baseline.yaml \
  --scales 10000,50000,100000 \
  --periods 24
```

The validation report compares final inflation, unemployment, output, and bank-credit tightness across scales and records diagnostics for each run. Passing this check does not prove calibration; it only guards against obvious finite-size or accounting failures.

## Norway Assumptions

The default Milestone 6 research config is Norway-first and stylized. The variable mortgage exposure target is 0.90 because Norway is expected to have very high floating-rate mortgage prevalence. This remains a working assumption until the calibration layer adds documented data sources and sensitivity bands.
