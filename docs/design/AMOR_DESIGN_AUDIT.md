# AMOR Design Audit

Run this audit before considering a user-facing page, chart, report, notebook, slide, or PDF complete.

## Required Checks

1. The page uses AMOR colors, typography, spacing, logo/mark rules, and layout patterns where applicable.
2. No arbitrary colors or typefaces appear outside the design system unless a documented accessibility or semantic need justifies them.
3. Charts use AMOR-compatible chart colors, line weights, grid lines, legends, labels, and uncertainty bands.
4. Mathematical notation is readable and consistent with surrounding text.
5. Model-status warnings are visible: results are model-generated counterfactuals, not forecasts or policy advice.
6. Assumptions and limitations are present near results, not hidden in distant footnotes.
7. The page works on mobile, tablet, and desktop.
8. Keyboard navigation and focus states are visible.
9. Text contrast is acceptable against its background.
10. AMOR assets preserve aspect ratio and clear-space rules.
11. No proprietary or private local files, paths, secrets, or metadata are exposed.
12. Result charts state model version, scenario, parameter hash, seed policy, scale, and generated date.

## Scientific Communication Checks

- The page does not imply that the model proves a real-world policy claim.
- Negative, null, delayed, and counterproductive effects are shown as legitimate possible outputs.
- Sensitivity and uncertainty are visible when results are stochastic or parameter-dependent.
- Browser-scale simulations are clearly labelled as reduced-scale demonstrations.
- Research-scale outputs are clearly labelled as precomputed offline artifacts.

## AMOR + ABM Tension To Watch

The AMOR identity can make the site look institutionally authoritative. That is useful for coherence but risky for interpretation. Every result section must keep the conditional nature of the simulation visible.

