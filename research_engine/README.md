# Research Engine

The research-scale engine will run offline simulations for larger experiments than GitHub Pages can execute in the browser.

Initial implementation target:

- Python with array-oriented state;
- deterministic seeded randomness;
- sparse production-network representation;
- scalable employer-worker representation;
- compressed aggregate and sector output.

If Python is too slow after profiling, a Rust core with Python bindings and optional WebAssembly export will be considered.

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

