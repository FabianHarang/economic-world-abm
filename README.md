# Economic World ABM

`economic-world-abm` is an AMOR-branded computational laboratory for studying how central-bank policy-rate changes propagate through a heterogeneous economy with households, firms, banks, explicit employer-worker links, and production networks.

The project is not a forecasting engine and not a policy-advice machine. Results are model-generated counterfactuals conditional on assumptions, parameterization, shock structure, seed policy, and scale.

## First Research Question

How does the inflation-interest-rate relationship behave inside a large heterogeneous-agent ABM with households, firms, banks, labor-market links, and production networks?

The model must not hard-code the desired conclusion. It represents competing channels:

- demand, credit, and cash-flow contraction;
- household mortgage and debt-service stress;
- asset-price and collateral effects;
- expectation anchoring or de-anchoring;
- firm working-capital cost pass-through;
- supply-chain propagation through supplier-buyer networks;
- labor-market feedback through employer-worker links.

## Scale Architecture

GitHub Pages is static hosting, so the project uses two scales:

- **Browser scale:** interactive, reduced-size simulations in TypeScript/Web Workers.
- **Research scale:** offline Python/Rust-compatible experiments with struct-of-arrays layouts, sparse production networks, deterministic seeds, and compressed summary artifacts for the website.

Current Milestone 3 browser target: 100,000 households, 1,000 firms, 25 banks, 20 sectors, 5,000 supplier edges, household behavior rules, expectation rules, wage offers, matching friction, intermediate-input inventories, delivery failures, supplier rewiring, backlogs, and sector summaries.

Initial research target: 1,000,000 households, 5,000 firms, 25 banks, and 25 sectors, only after memory estimation confirms that the run is safe on the target machine.

## Calibration Direction

The first empirical calibration direction is **Norway**, followed by **EU / Euro area**, then combined Norway + EU scenarios where assumptions are explicit. Every economy-specific parameter set must explain:

- the data source;
- the assumption;
- why it is used;
- whether it is stylized or empirically calibrated;
- what sensitivity checks are required.

## AMOR Identity

The local AMOR design profile is the source of truth for user-facing design. Fabian has approved public repository use of the AMOR assets in this project.

Current local source inspected:

`/Users/fabianharang/ABM economics/AMOR design profile `

The first scaffold uses AMOR petroleum, teal, sand, ink, paper, and chart tokens. Scientific clarity takes priority over decoration.

## Local Development

This scaffold currently uses npm workspaces because `pnpm` was not available in the local toolchain when the repository was created.

```bash
npm install
npm run typecheck
npm test
npm run build
npm run dev -w @world-abm/web
```

The Vite site is configured for GitHub Pages at `/economic-world-abm/`.

## Repository Map

- `apps/web`: GitHub Pages research website and browser simulator shell.
- `packages/core`: TypeScript simulation core package.
- `packages/ui`: reusable AMOR theme tokens for TypeScript UI code.
- `research_engine`: future offline Python/Rust-compatible research engine.
- `experiments`: configs, hardware profiles, benchmark scripts, HPC/cloud scaffolds.
- `docs`: model specification, manuscript, design, performance documentation.
- `data`: metadata, static-site artifacts, and documented data directories.

## Reproducibility Rules

- No hidden global randomness.
- No `Math.random` in simulation code.
- Every result must store model version, scenario name, parameter hash, seed policy, scale, code commit, and generated date.
- Every employed household must have one employer firm id.
- Every firm must have a worker count or scalable worker-roster representation.
- Accounting identities must fail loudly when violated.

## License

Code is MIT licensed. Documentation and research content should be treated as CC BY 4.0 unless a separate license file is added.
