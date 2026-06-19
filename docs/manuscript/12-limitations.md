# 12. Limitations

The model currently has several explicit limitations.

## Calibration

Norway and EU / Euro area parameter sets are stylized. Official source registries exist, but empirical series have not yet been ingested, transformed, or matched to model moments.

## Behavioral Rules

Household consumption, expectations, rule switching, firm pricing, wage adjustment, and credit decisions use transparent heuristic rules. These are useful for sensitivity analysis, but they are not estimated behavioral models.

## Production Network

The current production network is synthetic. It includes supplier links, delivery failures, input inventories, backlogs, and rewiring, but it is not yet calibrated to input-output tables or firm-level supplier data.

## Browser Scale

The browser companion is intentionally reduced-scale. It should be used for mechanism inspection, not final research claims.

## Offline Scale

The research engine targets one million households, but large runs still need cross-scale validation, memory checks, many paired seeds, and artifact review before being published on the site.

## Visual Authority

AMOR branding and polished charts can make early outputs look more authoritative than they are. The site must keep warnings, assumptions, and reproducibility metadata visible.
