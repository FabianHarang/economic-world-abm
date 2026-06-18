# Accounting Identities

Accounting checks are not optional. If an accounting identity fails, the simulation should fail loudly and record the diagnostic.

## Core Principle

Every flow must have two sides. Wages paid by firms are wages received by households. Loan interest received by banks is interest paid by borrowers. Supplier revenue is buyer input cost.

## Initial Required Checks

### Employer Consistency

```text
sum_f worker_count[f] == count_h(employer_id[h] >= 0)
```

### Payroll Consistency

```text
wage_bill[f] == sum_{h: employer_id[h] == f} wage[h] * hours[h]
```

### Household Budget

```text
deposits[t+1] =
  deposits[t]
  + wage_income
  + transfers
  + interest_income
  - consumption
  - taxes
  - debt_service
```

Debt may be positive when credit is granted, but households may not spend beyond resources plus approved credit.

### Firm Cash

```text
cash[t+1] =
  cash[t]
  + sales_revenue
  + loan_draws
  - wages
  - supplier_payments
  - interest
  - taxes
  - investment
  - dividends
```

### Bank Balance Sheet

```text
assets = reserves + household_loans + firm_loans + mortgages + other_assets
liabilities = deposits + wholesale_funding + equity
```

Defaults reduce bank assets and equity according to the resolution rule.

### Price Index

Inflation must emerge from firm prices and final-consumption weights:

```text
pi[t] = log(P[t]) - log(P[t-1])
```

Imported supply shocks may affect input costs, but aggregate inflation should not be directly imposed except in explicitly labelled exogenous scenarios.

