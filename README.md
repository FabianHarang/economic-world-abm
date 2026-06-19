# Economic World ABM

`economic-world-abm` is an AMOR-branded computational laboratory for studying how central-bank policy-rate changes propagate through a heterogeneous economy with households, firms, banks, explicit employer-worker links, and production networks.

The project is not a forecasting engine and not a policy-advice machine. Results are model-generated counterfactuals conditional on assumptions, parameterization, shock structure, seed policy, and scale.

## First Research Question

How does the inflation-interest-rate relationship behave inside a large heterogeneous-agent ABM with households, firms, banks, labor-market links, and production networks?

The model must not hard-code the desired conclusion. It represents competing channels:

- demand, credit, and cash-flow contraction;
- household mortgage and debt-service stress;
- asset-price and collateral effects;
- expectation anchoring or de-anchoring;
- firm working-capital cost pass-through;
- supply-chain propagation through supplier-buyer networks;
- labor-market feedback through employer-worker links.

## Scale Architecture

GitHub Pages is static hosting, so the project uses two scales:

- **Browser scale:** interactive, reduced-size simulations in TypeScript/Web Workers.
- **Research scale:** offline Python/Rust-compatible experiments with struct-of-arrays layouts, sparse production networks, deterministic seeds, and compressed summary artifacts for the website.

Current Milestone 10 browser companion: 100,000 households, 1,000 firms, 25 banks, 20 sectors, 5,000 supplier edges, household behavior rules, expectation rules, wage offers, matching friction, intermediate-input inventories, delivery failures, supplier rewiring, mortgage pass-through, housing prices, construction demand, firm equity values, household portfolio choice, bank credit tightness, paired-seed baseline/treatment rate-hike experiments, a graph-analysis production-network explorer with local rewiring, a labor-market explorer, a structured research-workspace presentation, and a curated static Results view.

Milestone 10 research target: 1,000,000 households, 5,000 firms, 25 banks, 25 sectors, and 75,000 sparse supplier edges in the offline Python engine, with calibration, sensitivity, manuscript, reproducibility, and static-result presentation scaffolding layered around the research runs.

## Calibration Direction

The first empirical calibration direction is **Norway**, followed by **EU / Euro area**, then combined Norway + EU scenarios where assumptions are explicit. Every economy-specific parameter set must explain:

- the data source;
- the assumption;
- why it is used;
- whether it is stylized or empirically calibrated;
- what sensitivity checks are required.

## AMOR Identity

The local AMOR design profile is the source of truth for user-facing design. Fabian has approved public repository use of the AMOR assets in this project.

Current local source inspected:

`/Users/fabianharang/ABM economics/AMOR design profile `

The first scaffold uses AMOR petroleum, teal, sand, ink, paper, and chart tokens. Scientific clarity takes priority over decoration.

## Local Development

This scaffold currently uses npm workspaces because `pnpm` was not available in the local toolchain when the repository was created.

```bash
npm install
npm run typecheck
npm test
npm run build
npm run dev -w @world-abm/web
```

The Vite site is configured for GitHub Pages at `/economic-world-abm/`.

## Research Engine

The Milestone 6 engine lives in `research_engine/world_abm` and writes compressed artifacts instead of raw microstate:

```bash
python3 experiments/scripts/estimate_memory.py
PYTHONPATH=research_engine python3 -m world_abm.run \
  --config experiments/configs/research_scale_baseline.yaml \
  --out experiments/results/research_scale_baseline
PYTHONPATH=research_engine python3 -m world_abm.validate \
  --config experiments/configs/research_scale_baseline.yaml \
  --scales 10000,50000,100000 \
  --periods 24
PYTHONPATH=research_engine python3 -m world_abm.moments \
  --config experiments/configs/research_scale_baseline.yaml \
  --targets experiments/calibration/target_moments_norway_stylized.json
PYTHONPATH=research_engine python3 -m world_abm.sensitivity \
  --config experiments/configs/research_scale_baseline.yaml \
  --out experiments/results/sensitivity
PYTHONPATH=research_engine python3 -m world_abm.static_site \
  --config experiments/configs/research_scale_baseline.yaml \
  --households 2000 \
  --firms 60 \
  --periods 5 \
  --supplier-edges 360 \
  --out data/static-site/milestone10_results.json
```

The engine is standard-library Python in this milestone: typed arrays for household, firm, bank, and sparse-network state; firm-count employer-worker representation; gzipped aggregate/sector JSONL outputs; synthetic population and firm/network generators; moment matching; sensitivity/phase-diagram sweeps; and curated static-site artifact export.

## Milestone 10 Static Results Layer

Milestone 10 keeps the structured workspace and adds a dedicated Results view backed by `data/static-site/milestone10_results.json`:

- Overview: research brief, current endpoint, and artifact status;
- Simulator: scenario controls, metadata, charts, and asset channels;
- Results: static artifact scale, diagnostics, final-period outcomes, network summary, sector stress, and limitations;
- Networks: production-network explorer and sector stress summary;
- Labor: employer-worker transmission explorer;
- Manuscript: research notes, limitations, literature anchors, and reproducibility.

The committed Milestone 10 artifact is a reduced-scale smoke artifact. It demonstrates the export path and browser presentation contract; it is not a calibrated Norway/EU research result. Raw household and firm microstate remain excluded from git.

## Repository Map

- `apps/web`: GitHub Pages research website and browser simulator shell.
- `packages/core`: TypeScript simulation core package.
- `packages/ui`: reusable AMOR theme tokens for TypeScript UI code.
- `research_engine`: offline Python research engine and validation CLIs.
- `experiments`: configs, hardware profiles, benchmark scripts, HPC/cloud scaffolds.
- `docs`: model specification, manuscript, design, performance documentation.
- `data`: metadata, static-site artifacts, and documented data directories.

## Reproducibility Rules

- No hidden global randomness.
- No `Math.random` in simulation code.
- Every result must store model version, scenario name, parameter hash, seed policy, scale, code commit, and generated date.
- Every employed household must have one employer firm id.
- Every firm must have a worker count or scalable worker-roster representation.
- Accounting identities must fail loudly when violated.

## License

Code is MIT licensed. Documentation and research content should be treated as CC BY 4.0 unless a separate license file is added.
