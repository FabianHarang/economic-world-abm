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

## 0.5.0 - 2026-06-19

- Added Milestone 4 mortgage market state with variable/fixed mortgage exposure, mortgage pass-through, and household mortgage debt service.
- Added stylized housing price, construction demand, construction output, firm equity valuation, and household portfolio choice channels.
- Added collateral headroom and asset-wealth effects in household consumption rules.
- Added bank mortgage/firm-loan books and bank credit tightness feeding firm credit costs.
- Added asset-channel controls, charts, and a Milestone 4 dashboard panel in the web app.

## 0.6.0 - 2026-06-19

- Added Milestone 5 paired-seed rate-hike experiments with baseline and treatment scenarios that share identical random seeds.
- Added treatment-minus-baseline paths for inflation, output, unemployment, consumption, mortgage rates, housing prices, equity prices, and bank credit tightness.
- Added simple Monte Carlo min/mean/max uncertainty bands across paired seeds.
- Added counterfactual summary metrics and treatment-effect charts to the AMOR web app.
- Updated the Norway mortgage assumption so the default realized variable-rate exposure sits in the 80-90% range.

## 0.7.0 - 2026-06-19

- Added the Milestone 6 offline Python research engine with typed household, firm, bank, and sparse-network arrays.
- Added a scalable employer-worker representation using firm worker counts plus an initial household-employer snapshot.
- Added compressed research artifacts: metadata, summary, diagnostics, network summary, aggregate JSONL.gz, and sector JSONL.gz.
- Added research-engine CLIs for running scenarios and cross-scale validation.
- Updated local benchmark and memory-estimation scripts to use the Milestone 6 engine.
- Updated the web app to present Milestone 6 as the research-scale offline layer while retaining the browser paired counterfactual companion.
