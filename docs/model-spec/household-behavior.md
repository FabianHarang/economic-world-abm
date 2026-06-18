# Household Behavior And Expectations

Milestone 2 adds household-side state and bounded-rational decision rules to the browser-scale TypeScript engine.

## Household State

Each household stores:

- employer firm id, or `-1` when unemployed;
- wage and hours;
- deposits;
- debt;
- consumption habit;
- behavior rule type;
- expectation rule type;
- inflation expectation.

The current browser run uses 100,000 households. This is a reduced-scale run relative to the 1,000,000-household research target.

## Behavior Rules

Four stylized rules are implemented.

### Hand-To-Mouth

Households consume a high share of currently available resources. Expected inflation can raise near-term spending within bounded limits.

### Liquidity Buffer

Households compare deposits with a target buffer based on consumption habit. When deposits are low, they reduce consumption to rebuild liquidity.

### Habit

Households target consumption close to a smoothed habit level, bounded by available resources.

### Debt Stress

Households cut consumption when debt service is high relative to income.

## Rule Switching

A household can switch rules with a configurable monthly probability. The current switching heuristic is:

- high debt-service ratio selects the debt-stress rule;
- very low deposits select hand-to-mouth behavior;
- moderate liquidity pressure or high expected inflation selects liquidity-buffer behavior;
- otherwise habit behavior is favored.

This is a transparent heuristic, not an estimated psychological model. It must be sensitivity-tested.

## Expectation Rules

Four expectation rules are implemented.

- Adaptive: weighted average of old expectation and recent inflation.
- Anchored: central-bank target blended with recent inflation, controlled by credibility.
- Extrapolative: recent inflation plus a momentum term.
- Employer-sector: combines recent inflation with the household's employer price signal and demand signal.

## Labor-Market Feedback

Household consumption produces an aggregate consumption index. Firms use that index when forming desired labor demand. The labor market then updates:

- vacancies;
- hires;
- layoffs;
- exact household employer ids;
- firm worker counts;
- firm wage bills.

## Limitations

The Milestone 2 rules are stylized and currently calibrated only as transparent placeholders. Norway-specific calibration should later discipline household debt-service sensitivity, unemployment benefits, wage rigidity, mortgage pass-through, and rule shares.

