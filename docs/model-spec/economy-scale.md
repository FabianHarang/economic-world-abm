# Economy Scale

The project uses a two-scale architecture because GitHub Pages cannot run a server-side simulation backend.

## Browser Scale

Browser simulations are for exploration, education, and quick counterfactuals.

Current Milestone 6 browser companion:

- 100,000 households;
- 1,000 firms;
- 25 private banks;
- 20 sectors;
- 5,000 supplier edges.
- household behavior rules;
- expectation rules;
- wage offers and matching friction;
- intermediate-input inventories;
- delivery failures, backlogs, and supplier rewiring;
- sector-level supply-chain summaries;
- variable/fixed mortgage exposure;
- housing price, construction, and equity-price channels;
- household portfolio choice and collateral effects;
- bank credit tightness;
- paired-seed baseline/treatment rate-hike experiments;
- treatment-minus-baseline plots and browser-scale uncertainty bands.

This is intentionally at the high end of browser-scale work. It remains the interactive companion for inspecting mechanisms while research-scale runs move to the offline engine.

Browser results must be labelled as reduced-scale model-generated counterfactuals.

## Local Research Scale

The local development target is Fabian's MacBook Pro with Apple M4 and 36 GB unified memory.

The default memory cap is:

```bash
WORLD_ABM_MAX_MEMORY_GB=24
```

The `local_large` tier targets 1,000,000 households only after `estimate_memory.py` predicts that the run fits safely.

Milestone 6 adds a standard-library Python research engine with:

- typed household state arrays for employer, bank, deposits, debt, mortgage debt, mortgage-rate exposure, behavior rule, and expectation rule;
- firm, bank, and asset-channel state arrays;
- sparse production-network edges in compressed-sparse-row form by buyer;
- scalable employer-worker representation through firm worker counts plus an initial household-employer snapshot;
- compressed outputs in `metadata.json`, `summary.json`, `diagnostics.json`, `network_summary.json`, `aggregate.jsonl.gz`, and `sectors.jsonl.gz`;
- cross-scale validation using comparable small, medium, and larger runs before interpreting million-household outputs.

Default research target:

- 1,000,000 households;
- 5,000 firms;
- 25 private banks;
- 25 sectors;
- 75,000 sparse supplier edges;
- 120 monthly periods.

Run commands:

```bash
python3 experiments/scripts/estimate_memory.py
PYTHONPATH=research_engine python3 -m world_abm.run \
  --config experiments/configs/research_scale_baseline.yaml \
  --out experiments/results/research_scale_baseline
PYTHONPATH=research_engine python3 -m world_abm.validate \
  --config experiments/configs/research_scale_baseline.yaml \
  --scales 10000,50000,100000 \
  --periods 24
```

## External Research Scale

External compute is considered when:

- many paired Monte Carlo seeds are required;
- sensitivity or calibration needs thousands of runs;
- extended runs exceed local memory;
- local runtime blocks iteration;
- public precomputed research-scale results are needed.

No paid cloud or external compute resources may be started without Fabian's explicit approval and a documented compute plan.

## Cross-Scale Rule

Mechanisms must be checked across toy, browser, local, and research scales. A result that appears only at tiny scale may be a finite-size artifact; a result that appears only at huge scale may still be an artifact of behavioral assumptions.
