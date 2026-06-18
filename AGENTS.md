# AGENTS.md

You are working on `economic-world-abm`, a research-grade large-scale heterogeneous-agent macroeconomic simulation project for FabianHarang.

## Project Goal

Build a GitHub Pages website and reproducible codebase for exploring how central-bank policy-rate changes propagate through a heterogeneous bounded-rationality economy with millions of consumers in research runs, thousands of firms, private banks, government, a central bank, housing, equities, credit, and a realistic firm production network.

## Non-Negotiable Standards

- Do not hard-code conclusions.
- Make assumptions explicit.
- Use seeded reproducible randomness only.
- Maintain stock-flow consistency.
- Add tests for every economic mechanism.
- Keep model equations and code synchronized.
- Never commit secrets or credentials.
- Prefer clarity and correctness over feature count.
- Every employed household/worker must have an employer firm id.
- Every firm must maintain a worker roster or scalable representation of its employees.
- Firm hiring/firing decisions must update household employment states and firm payroll consistently.
- Firms must belong to sectors and supply-chain stages.
- Inter-firm purchases must flow through an explicit supplier-buyer network or documented input-output approximation.
- Inflation must emerge from firm prices, final consumption weights, and supply-chain pass-through, not be directly imposed except as labelled exogenous import/supply shocks.
- Any result shown on the website must be reproducible from a scenario config and seed policy.
- Every simulation chart must state: model version, scenario name, parameter hash, seed policy, scale, and date generated.
- All user-facing pages, documents, charts, and reports must follow the AMOR design profile.
- The local folder `AMOR design profile` is the source of truth for visual identity; ask Fabian for the path if it cannot be found.
- AMOR assets are approved for public repository use in this project, but do not commit secrets, local metadata, or machine-specific files.

## Development Rules

- Use TypeScript strict mode.
- Avoid global mutable state except inside explicit simulation state objects.
- Do not use `Math.random`; use the project RNG.
- Keep the simulation core independent from React.
- Use Web Workers for long browser simulations.
- Use typed arrays and sparse structures for large agent state.
- Add schema validation for scenario configs.
- Add accounting invariant checks each tick.
- Add documentation alongside model changes.
- Run `npm test`, `npm run typecheck`, and `npm run build` before commit.
- Use the AMOR design tokens/components rather than ad hoc colors, fonts, or layout rules.
- Run or update the AMOR design audit checklist for user-facing pages.
- For research-scale code, run the Python/Rust test suite and a small deterministic cross-engine comparison before commit.
- Optimize local development for Fabian's MacBook Pro with Apple M4 and 36 GB RAM, while keeping memory limits configurable.
- Do not start paid external compute or create paid cloud resources without Fabian's explicit approval.

## Economic Modelling Rules

- Rates must be stored with period units clearly stated.
- Distinguish nominal and real variables.
- Track household, firm, bank, government, and central bank balance sheets.
- Track flows: wages, consumption, taxes, transfers, interest, dividends, loan issuance, repayments, defaults, investment, intermediate purchases, input deliveries, inventory changes, housing trades.
- Track employer-worker relationships exactly or through a documented scalable compressed representation.
- Track firm-to-firm supplier relationships and input-output flows.
- Monetary policy affects the economy through explicit channels: deposit rates, lending rates, mortgage rates, discount rates, expectations, credit constraints, firm working-capital costs, asset prices, and supply-chain propagation.

## Calibration Direction

Norway is the first economy-specific calibration target. EU / Euro area follows, with combined Norway + EU experiments only after assumptions and data-source differences are documented.

## Documentation Style

Write for a mathematically sophisticated non-programmer. Use equations, intuition, limitations, and diagrams. Keep documentation research-grade but readable.

