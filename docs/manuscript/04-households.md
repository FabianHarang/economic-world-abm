# 04. Households

Milestone 2 introduces heterogeneous household behavior into the model. Households are workers, consumers, borrowers, savers, and expectation-forming agents. Each employed household is linked to exactly one employer firm.

## State

Household state includes employment status, employer id, wage, hours, deposits, debt, consumption habit, behavior rule, expectation rule, and inflation expectation.

## Consumption

Households do not solve a full dynamic optimization problem. They use bounded-rational rules:

- hand-to-mouth;
- liquidity-buffer;
- habit;
- debt-stress.

Each rule maps available resources, deposits, debt service, consumption habit, and expected inflation into current consumption. Consumption feeds back into firm demand and labor demand.

## Expectations

Inflation expectations can be adaptive, anchored to the central-bank target, extrapolative, or linked to employer-sector signals. Central-bank credibility controls the strength of anchoring.

## Rule Switching

Households may switch behavior rules over time. The current switching mechanism is heuristic and deliberately transparent. It is meant to expose sensitivity, not to claim psychological realism.

## Norway And EU Calibration

Norway is the first target for household debt, mortgage pass-through, unemployment benefits, wage rigidity, and consumption-buffer assumptions. EU / Euro area parameters should be added as a separate comparison rather than silently mixed into Norway runs.

