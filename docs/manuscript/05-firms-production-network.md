# 05. Firms And The Production Network

This chapter specifies the firm's role in the economic world model. Firms are heterogeneous production units connected by supplier-buyer contracts. They hire specific workers, buy intermediate inputs, set prices, borrow from banks, hold inventories, and may default.

## Firm State

Each firm has a sector, supply-chain stage, productivity, capital stock, labor force, wage bill, output price, inventory, cash, debt, bank relationship, expected demand, supplier set, customer set, markup rule, working-capital need, and default status.

The model deliberately avoids a representative firm. Monetary policy can affect firms differently depending on debt, sector, labor intensity, input dependence, price stickiness, and position in the production network.

## Production

The baseline production function combines a capacity term and an intermediate-input bottleneck:

```text
Y_cap[f,t] = A[f,t] K[f,t]^alpha[f] L[f,t]^beta[f]
Y_input[f,t] = min_u I[f,u,t] / a[f,u]
Y[f,t] = min(Y_cap[f,t], Y_input[f,t], Y_plan[f,t])
```

This Leontief structure is useful for studying bottlenecks. A later CES option will test how much results depend on substitutability across input categories and suppliers.

## Working-Capital Cost Channel

Firms may need credit to pay wages and input invoices before sales revenue arrives:

```text
WCNeed[f,t] = omega_W[f] WageBill[f,t] + omega_X[f] InputCost[f,t] - CashAvailable[f,t]
InterestCost_WC[f,t] = r_loan[f,t] max(0, WCNeed[f,t])
```

This channel is central. A rate hike may reduce demand, but it can also raise marginal cost for working-capital dependent firms. Whether inflation falls, rises temporarily, or responds with a delay is therefore a model outcome rather than an imposed assumption.

## Pricing

Early pricing rules include:

- markup over marginal cost;
- inventory and backlog adjustment;
- partial cost pass-through;
- Calvo/menu-cost rigidity;
- stress pricing for liquidity-constrained firms.

The default implementation will expose pass-through strength, price stickiness, and inventory target parameters.

## Network Propagation

A firm may be upstream, downstream, or central in the supplier graph. Higher rates can reduce downstream demand, lower upstream orders, raise bankruptcies, and disrupt input delivery. Conversely, higher financing costs in upstream sectors can pass through to final prices even when final demand weakens.

## Milestone 3 Implementation Notes

Milestone 3 turns the supplier graph into an active production constraint. Firms now hold intermediate-input inventories and input requirements. A monthly supplier routine sends orders through existing supplier edges, records delivery attempts, creates failures when suppliers are unreliable or stressed, and rewires a fraction of failed links toward replacement suppliers in upstream-biased sectors.

Production is constrained by the ratio of available inputs to required inputs. Shortages reduce output, raise backlogs, and add marginal-cost pressure. Backlog pressure also enters the price rule, allowing supply-chain disruptions to appear in sector prices even when household demand is weak.

The implemented assumptions are stylized:

- Input requirements rise with downstream production stage and working-capital exposure.
- Inventory targets are expressed in months of expected intermediate-input use.
- Delivery failure probability responds to supplier reliability, supplier backlog, supplier inventory stress, supplier price pressure, and the policy-rate shock.
- Rewiring is local to the synthetic production graph and preserves an upstream tendency.
- Sector summaries report output, prices, input costs, inventory coverage, backlogs, and delivery failures.

For Norway-first calibration, these stylized quantities should be replaced by Statistics Norway input-output structures, sector inventory norms where available, and explicit import exposure for energy, food, manufacturing, and construction inputs. EU / Euro area comparison should use comparable Eurostat input-output and sector-price assumptions after the Norway baseline is documented.

## Norway And EU Calibration Direction

The first empirical sector and input-output calibration will target Norway. EU / Euro area structures will follow. When Norway-specific data are unavailable, stylized values may be used, but they must be labelled as stylized and included in sensitivity checks.
