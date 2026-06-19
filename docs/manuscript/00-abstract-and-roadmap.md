# 00. Abstract And Roadmap

This manuscript documents a large heterogeneous-agent macroeconomic simulation for studying the inflation-interest-rate relationship under explicit household, firm, bank, labor-market, housing, equity, and production-network channels.

The project is a computational laboratory, not a forecasting engine. The central research object is a paired counterfactual experiment: one seeded economy follows a baseline policy-rate path while a treatment economy receives a rate shock. Differences in inflation, output, unemployment, consumption, asset prices, bank credit tightness, and supply-chain stress are interpreted as model-generated outcomes conditional on assumptions.

## Current Contribution

The current implementation provides:

- a browser companion with 100,000 households and 1,000 firms;
- an offline research engine targeting 1,000,000 households and 5,000 firms;
- explicit employer-worker links and firm worker counts;
- a sparse supplier-buyer production network;
- mortgage, housing, construction, equity, and bank-credit channels;
- calibration and sensitivity scaffolding for Norway first, then EU / Euro area;
- graph-analysis and labor-market explorers for inspecting mechanisms;
- curated static-site result artifacts for presenting offline-engine outputs without raw microstate;
- reproducibility rules for seeds, versions, diagnostics, configs, and artifacts.

## Roadmap

Milestone 10 turns the repository into a manuscript-and-site research surface with a static result artifact path. The next research tasks are empirical Norway/EU calibration, replacing smoke artifacts with paired-seed research-scale outputs, literature expansion, and stronger uncertainty analysis across many paired seeds.
