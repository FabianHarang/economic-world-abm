# Research Engine

The research-scale engine runs offline simulations that are too large for GitHub Pages. It is a standard-library Python implementation with typed arrays, deterministic seeded randomness, sparse production networks, scalable employer-worker counts, and compressed aggregate/sector output.

The browser app remains the interactive companion. Research-scale runs should be generated here, inspected, then curated into static artifacts only when needed.

## Target Command

```bash
python -m world_abm.run \
  --households 1000000 \
  --firms 5000 \
  --banks 25 \
  --sectors 25 \
  --periods 120 \
  --seed 12345 \
  --config experiments/configs/research_scale_baseline.yaml \
  --out experiments/results/research_scale_baseline
```

From the repository root, use:

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

## Artifacts

Each run writes:

- `metadata.json`;
- `summary.json`;
- `diagnostics.json`;
- `network_summary.json`;
- `aggregate.jsonl.gz`;
- `sectors.jsonl.gz`.

Raw household microstate is not written by default.

The static-site exporter writes a curated JSON summary with metadata, diagnostics, final-period outcomes, network summary, ranked sector stress, and artifact limitations. The committed Milestone 10 artifact is smoke-scale and should not be read as a calibrated Norway/EU result.

## Calibration And Sensitivity Utilities

The current research layer includes:

- `world_abm.population`: synthetic household population generator;
- `world_abm.firm_network`: firm and sparse supplier-network generator;
- `world_abm.moments`: moment-matching loss check;
- `world_abm.sensitivity`: two-parameter sensitivity sweep with phase-diagram CSV output.
- `world_abm.static_site`: curated website artifact exporter.

If Python profiling becomes the bottleneck after the model becomes richer, the next candidate is a Rust core with Python bindings and optional WebAssembly export.
