# Credit, Housing, Construction, And Equity Channels

Milestone 4 adds the first browser-scale representation of household mortgage exposure, housing prices, construction demand, firm equity valuation, household portfolio choice, and bank credit tightness.

The implementation is still stylized. It is meant to expose the channel structure before Norway/EU calibration, not to make empirical claims.

## Household Mortgage Market

Each household may own a home, carry mortgage debt, and hold a variable-rate mortgage share. The weighted mortgage rate combines:

- a policy-rate-linked variable mortgage rate;
- a slower repricing fixed mortgage rate;
- a bank-credit-tightness spread.

The default variable-rate exposure is high because Norway is the first calibration target and Norwegian households are more exposed to variable/floating mortgage rates than many Euro area households. The current value is a transparent placeholder until Norway mortgage-stock and interest-binding data are added.

## Housing Price Index

The aggregate housing price index responds to:

- household demand;
- mortgage-rate pressure;
- bank credit tightness;
- construction output;
- construction-supply elasticity.

Rising rates lower housing demand through debt service and discounting. Weak construction output can partly offset this through supply scarcity. This is deliberately a model channel, not a forecast.

## Construction Link

One synthetic sector is treated as construction. Its labor demand and output respond to the housing-demand index and still remain constrained by the Milestone 3 supply-chain/input bottleneck rules.

This means housing can affect real production, and supply-chain disruptions can feed back into housing scarcity.

## Equity And Portfolios

Firm equity value is a smoothed valuation of cash, output, leverage, and discount-rate pressure. Households hold stylized risky portfolios and rebalance gradually between deposits and equity holdings.

Equity-price changes affect household net worth and can feed into consumption through a bounded wealth effect.

## Collateral And Bank Credit

Home equity creates collateral headroom. Higher loan-to-value ratios and bank stress tighten the collateral channel. Banks hold mortgage and firm-loan books. Their credit tightness rises with mortgage stress, firm leverage exposure, and weak capital ratios.

Credit tightness feeds back into:

- household collateral drawdowns;
- mortgage spreads;
- firm working-capital loan costs;
- new firm debt availability.

## Calibration Direction

Norway should be calibrated first using documented sources for:

- variable versus fixed mortgage exposure;
- mortgage-rate pass-through and repricing speed;
- household debt-service ratios;
- housing price and construction-output histories;
- household equity/fund participation and portfolio shares;
- bank mortgage books, loan losses, and capital ratios.

EU / Euro area calibration should follow with separate parameter sets because mortgage fixation, housing supply elasticity, and household portfolio composition differ materially across countries.
