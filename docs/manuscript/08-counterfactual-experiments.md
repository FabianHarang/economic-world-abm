# 08. Counterfactual Experiments

Milestone 5 introduces paired counterfactual experiments. A treatment run and a baseline run share the same seed, population, firm network, household balance sheets, bank structure, and behavioral parameters. The treatment run differs by the policy-rate shock.

This is important because a large ABM has many stochastic micro-level differences. Pairing the seed removes much of that noise when interpreting treatment-minus-baseline paths.

## Browser Experiment

The current browser experiment uses a +100 bps policy-rate treatment and two paired seeds. The charted bands are min/mean/max across those paired seeds. They are useful for visual sanity checks, but they are not yet a full uncertainty analysis.

## Interpretation

The paired plots should be read as model-generated counterfactuals:

- inflation response is treatment inflation minus baseline inflation;
- output response is treatment output index minus baseline output index;
- unemployment response is treatment unemployment rate minus baseline unemployment rate;
- housing response is treatment housing index minus baseline housing index.

The model must not be tuned to force a preferred sign. Rate hikes can reduce demand, raise debt-service stress, lower housing wealth, tighten bank credit, and raise working-capital costs. Which force dominates is an output of the model conditional on assumptions.

## Next Research Step

Milestone 6 now provides the first research-scale engine. The next counterfactual expansion is to run many paired seeds offline, save static artifacts, add sensitivity tables, and attach Norway-first calibration metadata.
