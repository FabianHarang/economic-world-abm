# Economy Scale

The project uses a two-scale architecture because GitHub Pages cannot run a server-side simulation backend.

## Browser Scale

Browser simulations are for exploration, education, and quick counterfactuals.

Current Milestone 2 target:

- 100,000 households;
- 1,000 firms;
- 25 private banks;
- 20 sectors;
- 5,000 supplier edges.
- household behavior rules;
- expectation rules;
- wage offers and matching friction.

This is intentionally at the high end of browser-scale work and should move to a Web Worker before richer household-period updates are added.

Browser results must be labelled as reduced-scale model-generated counterfactuals.

## Local Research Scale

The local development target is Fabian's MacBook Pro with Apple M4 and 36 GB unified memory.

The default memory cap is:

```bash
WORLD_ABM_MAX_MEMORY_GB=24
```

The `local_large` tier targets 1,000,000 households only after `estimate_memory.py` predicts that the run fits safely.

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
