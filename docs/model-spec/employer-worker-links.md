# Employer-Worker Links

Every employed household/worker must be linked to exactly one employer firm.

## Household State

At minimum, household state includes:

- household id;
- employment status;
- employer firm id, or `-1` if unemployed or out of labor force;
- sector of employment;
- wage and hours;
- deposits, debt, mortgage, housing status;
- behavior and expectation rule types.

## Firm Workforce State

Each firm `f` has:

- worker count;
- wage bill;
- desired labor;
- vacancies;
- layoffs;
- worker roster or scalable equivalent.

At browser scale, the roster may be explicit. At research scale, use:

- `employer_id[h]` as the authoritative household-to-firm array;
- `worker_start[f]` and `worker_count[f]` after sorting/grouping;
- optional aggregated skill counts when full rosters are not needed every tick.

## Invariants

Every tick must satisfy:

```text
sum_f worker_count[f] == count_h(employer_id[h] >= 0)
```

Payroll consistency:

```text
wage_bill[f] == sum_{h: employer_id[h] == f} wage[h] * hours[h]
```

Household wage income and firm wage expense are opposite sides of the same transaction.

## Hiring And Firing

Hiring updates:

- household employment status;
- household employer id;
- household wage and hours;
- firm worker count/roster;
- firm payroll obligation;
- unemployment statistics.

Firing reverses those updates and may later trigger severance or unemployment benefits depending on scenario institutions.

