# Economy Scale

The project uses a two-scale architecture because GitHub Pages cannot run a server-side simulation backend.

## Browser Scale

Browser simulations are for exploration, education, and quick counterfactuals.

Initial target:

- 1,000-10,000 households;
- 50-300 firms;
- 3-20 private banks;
- 3-20 sectors during early development.

Medium browser runs may later target 10,000-100,000 households using Web Workers, typed arrays, progress messages, cancellation, and downsampled charting.

Browser results must be labelled as reduced-scale model-generated counterfactuals.

## Local Research Scale

The local development target is Fabian's MacBook Pro with Apple M4 and 36 GB unified memory.

The default memory cap is:

```bash
WORLD_ABM_MAX_MEMORY_GB=24
```

The `local_large` tier may target 500,000-1,000,000 households only after `estimate_memory.py` predicts that the run fits safely.

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

