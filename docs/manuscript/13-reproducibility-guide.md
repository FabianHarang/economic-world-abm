# 13. Reproducibility Guide

Every interpretable result must be reproducible from code, config, seed policy, and model version.

## Required Metadata

Each result must record:

- model version;
- scenario name;
- economy context;
- parameter hash;
- seed policy;
- household, firm, bank, sector, period, and supplier-edge scale;
- generated date;
- diagnostics status.

## Browser Companion

Use:

```bash
npm run typecheck
npm test
npm run build
npm run dev -w @world-abm/web
```

The browser companion runs the TypeScript model directly and displays scenario metadata in the site.

## Research Engine

Use:

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
```

Large raw outputs stay out of git. Curated small artifacts for the public site belong in `data/static-site`.

## Acceptance Rule

A result is publishable only when diagnostics pass, assumptions are documented, seed policy is clear, calibration status is visible, and the artifact can be regenerated from repository instructions.
