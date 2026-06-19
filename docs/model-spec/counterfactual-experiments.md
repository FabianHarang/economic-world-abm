# Counterfactual Experiments

Milestone 5 adds a paired-seed experiment layer around the browser-scale ABM.

The core principle is simple: the baseline and treatment simulations reuse identical random seeds and parameters. The only intentional difference is the treatment policy-rate shock. This makes treatment-minus-baseline paths easier to interpret because idiosyncratic household, firm, bank, and supplier-network draws are paired.

## Default Browser Experiment

The default browser experiment is a +100 bps policy-rate shock:

- baseline: no additional policy-rate shock;
- treatment: +100 bps shock;
- treatment start: period 3;
- treatment duration: 12 monthly periods;
- paired browser seeds: two seeds by default;
- scale: 100,000 households, 1,000 firms, 25 banks, 20 sectors.

The browser displays mean treatment effects and min/max bands across paired seeds. This is intentionally a lightweight uncertainty band, not a full research Monte Carlo.

## Treatment-Minus-Baseline Paths

Milestone 5 reports:

- inflation delta in percentage points;
- output-index delta;
- unemployment-rate delta in percentage points;
- consumption-index delta;
- mortgage-rate delta in percentage points;
- housing-price-index delta;
- equity-price-index delta;
- bank-credit-tightness delta in percentage points.

## Research-Scale Direction

The research engine should later expand this into many paired seeds, scenario libraries, precomputed static artifacts, and sensitivity tables. Norway scenarios should come first, followed by EU / Euro area comparisons with separate mortgage, housing, bank, and portfolio assumptions.
