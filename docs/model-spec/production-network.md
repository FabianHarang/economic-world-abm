# Production Network

The production network is an explicit directed weighted graph.

An edge `u -> f` means supplier firm `u` sells intermediate inputs to buyer firm `f`.

## Minimum Sector Taxonomy

The first structural model starts with a reduced subset of the full taxonomy and expands toward:

1. Agriculture and food raw materials.
2. Forestry, fishing, and biological resources.
3. Mining and raw materials.
4. Energy extraction and fuels.
5. Utilities.
6. Basic materials.
7. Food processing.
8. Capital goods and machinery.
9. Durable manufacturing.
10. Non-durable manufacturing.
11. Construction.
12. Transport and logistics.
13. Wholesale trade.
14. Retail trade.
15. Housing and real estate services.
16. Hospitality and consumer services.
17. Healthcare and care services.
18. Education and training.
19. Professional and business services.
20. Information, communications, and digital services.
21. Finance, insurance, and banking services.
22. Public administration and government services.
23. Rest-of-world interface.

## Stages

Each firm has a stage:

- 0: primary/resource/agriculture/energy;
- 1: basic processing and materials;
- 2: intermediate manufacturing and capital inputs;
- 3: final goods and construction;
- 4: logistics/wholesale/retail distribution;
- 5: final consumer services, public services, finance, real estate, professional services.

Loops are allowed for finance, energy, logistics, and professional services, but the default synthetic network should preserve a natural upstream-to-downstream tendency.

## Input-Output Coefficients

Let `A_IO[s, u]` be the amount of input from sector `u` required per unit gross output in sector `s`. For firm `f` in sector `s(f)`:

```text
a[f, u] = A_IO[s(f), u] * xi[f, u]
```

where `xi[f, u]` is firm-specific heterogeneity.

## Baseline Production Constraint

The first implementation uses a Leontief bottleneck:

```text
Y_cap[f,t] = A[f,t] * K[f,t]^alpha[f] * L[f,t]^beta[f]
Y_input[f,t] = min_u I[f,u,t] / a[f,u]
Y[f,t] = min(Y_cap[f,t], Y_input[f,t], Y_plan[f,t])
```

CES substitution is a later sensitivity option.

## Milestone 3 Browser Implementation

The Milestone 3 TypeScript browser model keeps the graph compact enough for a 100,000-household browser run while making intermediate inputs economically active.

Each firm now stores:

- an input requirement per unit of planned output;
- an intermediate-input inventory stock;
- an inventory target measured in months;
- an input-cost index from its supplier set;
- a backlog stock from missed or insufficient input deliveries;
- a supplier reliability score;
- cumulative delivery attempts and failures.

Each monthly step:

1. Buyers compare current input inventories with their target and backlog.
2. Orders are split across supplier edges by contract weight.
3. Suppliers may fail to deliver based on reliability, backlog pressure, inventory stress, supplier price pressure, and policy-rate shock pressure.
4. Failed deliveries add buyer backlog and reduce supplier reliability.
5. Buyers may rewire failed links to a replacement supplier in an upstream-biased sector.
6. Production is constrained by available intermediate inputs.
7. Backlog and input-cost pressure feed firm pricing and working-capital needs.

The current rule is still stylized. Norway is the first calibration target, so the next empirical step is to replace synthetic input requirements and stage weights with Norway input-output tables and sector-specific import/exposure assumptions. EU / Euro area parameters should then be added as a comparison rather than blended into the Norway baseline.

## Edge State

Each supplier-buyer edge stores:

- supplier firm id;
- buyer firm id;
- input sector/category;
- contract weight/share;
- price;
- typical delivery quantity;
- delivery delay;
- reliability score;
- trade-credit terms;
- contract duration;
- relationship strength.

The current browser model implements the first four operational edge concepts indirectly through supplier id, buyer id, contract weight, supplier price, and firm reliability. Delivery delay, trade credit, contract duration, and relationship strength remain explicit future state variables.

## Monetary-Policy Propagation

The cost channel enters when higher loan rates increase working-capital costs for credit-dependent firms. The demand channel enters when higher rates reduce household demand, investment, construction, housing, and credit-sensitive durable consumption. The production network lets these effects propagate upstream and downstream.
