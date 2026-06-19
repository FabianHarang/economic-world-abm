# 10. Calibration And Sensitivity

Milestone 7 creates the first calibration and sensitivity layer. The model remains stylized, but the repository now distinguishes source registration, parameter sets, synthetic generators, moment matching, and sensitivity sweeps.

## Norway First

Norway is prioritized because the interest-rate transmission problem is strongly shaped by mortgage pass-through, household debt service, bank credit conditions, and housing prices. The current Norway parameter set is explicitly labelled stylized.

## Data Sources

The source registry points to official sources rather than silently scraping data. Each empirical series added later must record provider, table or series identifier, frequency, transformations, retrieval date, and redistribution constraints.

## Synthetic Population And Firms

The synthetic household and firm generators are transparent placeholders. They provide arrays and summaries with consistent dimensions, deterministic seeds, and documented assumptions. They are not yet calibrated synthetic populations.

## Sensitivity

The first phase diagram varies variable mortgage exposure and supplier rewiring. This is deliberate: it tests whether policy-rate effects are sensitive to mortgage pass-through and supply-network adaptation, two central mechanisms in the current model.

## Interpretation

Moment matching and sensitivity sweeps are guardrails. They help reveal fragile assumptions, underidentified parameters, and regions where the model produces unstable outcomes. They do not turn the ABM into a forecast.
