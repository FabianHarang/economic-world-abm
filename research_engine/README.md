# Research Engine

The Milestone 6 research-scale engine runs offline simulations that are too large for GitHub Pages. It is a standard-library Python implementation with typed arrays, deterministic seeded randomness, sparse production networks, scalable employer-worker counts, and compressed aggregate/sector output.

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

If Python profiling becomes the bottleneck after the model becomes richer, the next candidate is a Rust core with Python bindings and optional WebAssembly export.
