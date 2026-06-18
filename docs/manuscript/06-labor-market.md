# 06. Labor Market And Employer-Worker Links

The labor market is explicit. Employed households are not anonymous labor units; each worker has an employer firm id.

## Motivation

Employer-worker links matter because rate-sensitive firms can fire workers, lowering household income and reducing demand. That demand reduction can then feed back into firm revenues, supplier orders, and bankruptcies. This mechanism is invisible in a model with only aggregate labor.

## Matching

Firms choose desired labor from expected demand, capital, productivity, cash, credit conditions, and uncertainty:

```text
L_desired[f,t] = g(D_expected[f,t], Inventory[f,t], K[f,t], A[f,t], wage[f,t], cash[f,t], credit[f,t])
```

Vacancies and layoffs are:

```text
Vacancies[f,t] = max(0, L_desired[f,t] - L[f,t])
Layoffs[f,t] = max(0, L[f,t] - L_desired[f,t])
```

Households match to vacancies using skill, sector, region, wage offer, reservation wage, firm quality, and search frictions.

## Wage Dynamics

Wages are heterogeneous and sticky. A baseline wage-update equation is:

```text
Delta log wage[h,t] =
  rho_w Delta log wage[h,t-1]
  + gamma_pi expected_inflation[h,t]
  + gamma_u (u_star - unemployment[t])
  + gamma_p firm_profitability[employer[h],t]
  + shock[h,t]
```

## Required Invariants

Each period must verify:

- every employed worker has exactly one employer;
- every firm worker count matches the household employer array;
- payroll paid by firms equals wage income received by households.

## Norway And EU Calibration Direction

Norway is the first target for labor-market institutions, sector employment shares, wage rigidity, and household debt interaction. EU / Euro area assumptions will be documented separately because labor-market institutions, mortgage pass-through, wage bargaining, and sector structures differ across countries.

