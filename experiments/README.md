# Experiments

This folder stores experiment configuration, benchmark scripts, calibration plans, sensitivity scaffolding, and reproducible output metadata.

Large raw outputs must not be committed to git. Curated small static artifacts for the website belong in `data/static-site`.

## First Configs

- `configs/first_structural_demo.yaml`: 100,000-household Milestone 8 browser companion target.
- `configs/research_scale_baseline.yaml`: 1,000,000-household Milestone 8 offline benchmark target.
- `calibration/parameter_sets`: stylized, Norway-first, and EU/euro-area parameter scaffolds.
- `sensitivity/default_sweep.yaml`: default two-parameter phase-diagram sweep.

## Milestone 8 Commands

```bash
python3 experiments/scripts/estimate_memory.py
python3 experiments/scripts/benchmark_local_m4_36gb.py
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
```

The research engine writes compressed aggregate and sector artifacts. Raw household microstate is intentionally not written to git.

## Economy Priority

1. Norway.
2. EU / Euro area.
3. Norway + EU comparison once assumptions are documented.
