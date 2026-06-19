# Changelog

All notable changes to `economic-world-abm` will be documented here.

## 0.1.0 - 2026-06-18

- Created the initial repository scaffold.
- Added AMOR design-system notes, tokens, audit checklist, and approved public assets.
- Added local MacBook Pro M4 / 36 GB benchmark and memory-estimation scaffolding.
- Added first model-spec documents for scale, production networks, employer-worker links, and accounting.
- Added Norway-first and EU-second scenario configuration placeholders.
- Added a minimal Vite/React research-site scaffold and TypeScript packages.

## 0.2.0 - 2026-06-18

- Raised the browser Milestone 1 scale to 100,000 households, 1,000 firms, 25 banks, and 20 sectors.
- Added a 1,000,000-household research-scale target config in TypeScript and YAML.
- Reframed the site language around the inflation-interest-rate relationship in a large ABM.
- Replaced the toy path generator with a first structural TypeScript ABM core: employer-worker links, hiring/firing, sector/stage firms, supplier network, loan-rate pass-through, firm prices, and CPI inflation.

## 0.3.0 - 2026-06-18

- Added Milestone 2 household behavior rules: hand-to-mouth, liquidity-buffer, habit, and debt-stress.
- Added expectation rules: adaptive, anchored, extrapolative, and employer-sector.
- Added household deposits, debt, consumption habits, debt service, consumption demand, and rule switching.
- Added firm wage offers, matching friction, wage indexation, and demand-sensitive labor updates.
- Added browser controls for household rule composition and expectation/labor parameters.
- Added household-budget diagnostics and result paths for consumption, expectations, wage growth, and rule shares.

## 0.4.0 - 2026-06-19

- Added Milestone 3 intermediate-input inventories, input requirements, firm reliability, delivery attempts, delivery failures, backlogs, and supplier rewiring.
- Made firm production depend on input availability and backlog pressure, with input-cost pressure feeding pricing and working-capital needs.
- Added sector summaries for output, prices, input costs, inventory coverage, backlog pressure, and delivery failures.
- Added aggregate network summaries and browser metrics for delivery failures, rewired edges, backlog index, and input inventory.
- Added a production-network visualization and supply-chain controls to the AMOR web app.
