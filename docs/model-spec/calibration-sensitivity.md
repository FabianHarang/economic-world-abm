# Calibration And Sensitivity

Milestone 7 starts the calibration layer. It does not make the model empirically calibrated yet; it creates the machinery and provenance rules needed to calibrate responsibly.

## Data-Source Registry

The source registry is `data/sources/calibration_sources.json`. It registers official candidate sources:

- Statistics Norway StatBank for Norway macro, labor, household, sector, wage, debt, and housing targets;
- Norges Bank statistics for policy rates, lending rates, mortgage rates, credit growth, and financial-stability indicators;
- Eurostat for EU/euro-area HICP, labor, business demography, and input-output data;
- ECB Data Portal for euro-area monetary and bank-lending series;
- OECD Data Explorer for cross-country comparison moments;
- BIS statistics for credit, debt service, property prices, and banking aggregates.

The registry is provenance metadata only. It does not ingest or redistribute restricted data.

## Parameter Sets

Initial parameter sets live in `experiments/calibration/parameter_sets`:

- `stylized.yaml`;
- `norway_stylized.yaml`;
- `eu_euro_area_stylized.yaml`.

Norway remains first. EU/euro-area assumptions are separate because mortgage fixation, pass-through, banking structure, labor-market persistence, and sector composition can differ materially from Norway.

## Synthetic Generators

`world_abm.population` creates household arrays for household size, age group, region, skill, employment, sector, employer, income, deposits, debt, mortgage debt, equity ownership, behavior rule, expectation rule, and bank relationship.

`world_abm.firm_network` creates firm arrays for sector, stage, bank, workforce, productivity, capital, wage policy, leverage, markup, inventory target, and sparse supplier links.

These are transparent stylized generators. Later work should replace marginals with official data and iterative proportional fitting where appropriate.

## Moment Matching

`world_abm.moments` runs a simulated-moments loss check. The first target file is `experiments/calibration/target_moments_norway_stylized.json`.

The loss is diagnostic, not proof. A model that matches a small set of moments can still be misspecified or underidentified.

## Sensitivity And Phase Diagrams

`world_abm.sensitivity` runs two-parameter sweeps and writes:

- `sensitivity_results.jsonl.gz`;
- `sensitivity_summary.json`;
- `phase_diagram.csv`.

The default sweep varies variable-mortgage share and supplier-rewire rate. This directly targets the Norway-first mortgage pass-through channel and the production-network adaptation channel.

## Network Explorer

The browser network explorer is a mechanism-inspection surface. It lets the user zoom, pan, select sectors and links, and locally rewire links. These visual rewires are exploratory UI state; they do not yet mutate the simulation engine. Later milestones can connect the explorer to scenario export/import.
