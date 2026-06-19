# 11. Results Discussion

Milestone 8 results are architecture results, not empirical claims. The current browser companion verifies that the model can produce paired-seed baseline and treatment paths, sector summaries, asset-channel summaries, labor-market flows, and production-network diagnostics.

## Browser Companion

The browser run uses 100,000 households, 1,000 firms, 25 banks, 20 sectors, and 5,000 supplier edges. It is suitable for exploratory interaction and visual mechanism checks.

The current site reports:

- inflation paths;
- supply-chain backlog paths;
- treatment-minus-baseline bands for inflation, output, unemployment, and housing;
- mortgage, housing, construction, equity, and bank-credit channels;
- production-network stress and rewiring;
- labor-market vacancies, layoffs, unemployment, and wage growth.

## Interpretation Rules

Treatment-minus-baseline paths are conditional on:

- the scenario config;
- the policy-rate shock;
- the seed policy;
- household behavior-rule shares;
- mortgage pass-through assumptions;
- production-network topology;
- firm pricing and working-capital assumptions;
- calibration status.

No sign, timing, or magnitude should be treated as a statement about Norway or the EU / Euro area until calibration, many paired seeds, and sensitivity checks are complete.

## Research-Scale Direction

The offline engine is the correct surface for million-household experiments. The next result milestone should run multiple paired seeds, write curated summary artifacts to `data/static-site`, and expose those artifacts on the website without committing raw microstate.
