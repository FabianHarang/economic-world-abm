# Changelog

All notable changes to `economic-world-abm` will be documented here.

## 0.11.0 - 2026-06-19

- Added a Milestone 10 curated static-site result exporter for the offline Python engine.
- Committed `data/static-site/milestone10_results.json` as a reduced-scale smoke artifact with diagnostics, final metrics, network summary, and sector stress rankings.
- Added a Results workspace view to present static artifacts without loading raw microstate in the browser.
- Updated active configs, schemas, package versions, and research-engine version to 0.11.0.
- Documented the static artifact contract and its Norway-first/EU-second interpretation limits.

## 0.10.0 - 2026-06-19

- Added the Milestone 9 structured research workspace with Overview, Simulator, Networks, Labor, and Manuscript views.
- Reworked the web app presentation so the page no longer lists every model surface in one long scroll.
- Collapsed scenario controls behind a dedicated Simulator view and grouped result, graph, labor, and manuscript surfaces.
- Added a Milestone 9 presentation manifest for future static-site result artifacts.
- Bumped model, package, and research-engine versions to 0.10.0.

## 0.9.0 - 2026-06-19

- Upgraded the production-network explorer with draggable sectors, layout switching, neighborhood focus, path highlighting, systemic-sector ranking, minimap, and local edge rewiring.
- Added a labor-market explorer for employer-worker transmission, vacancies, layoffs, unemployment, consumption pressure, and wage growth.
- Added a Milestone 8 manuscript/reproducibility panel to the site.
- Added manuscript chapters for introduction, literature review, results discussion, limitations, and reproducibility.
- Added a Milestone 8 AMOR design audit and small static-site summary artifact.
- Bumped model, package, and research-engine versions to 0.9.0.

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

## 0.8.0 - 2026-06-19

- Added a zoomable, pannable production-network explorer with node/link selection and local edge rewiring.
- Added a Milestone 7 data-source registry for official Norway, EU/euro area, OECD, and BIS calibration sources.
- Added stylized, Norway-first, and EU/euro-area parameter-set scaffolds.
- Added synthetic household population and firm/network generators for calibration experiments.
- Added moment-matching and sensitivity/phase-diagram CLIs to the research engine.
- Updated the web app and docs for Milestone 7 calibration and sensitivity.
