# 02. Literature Review

This is the first verified literature layer. It is intentionally conservative: only sources that have been checked during implementation are listed here. Later revisions should add a full bibliography with DOIs, BibTeX entries, and topic-by-topic synthesis.

## Agent-Based Economics

Cristelli, Pietronero, and Zaccaria provide a critical overview of agent-based models in economics, emphasizing why ABMs can represent dynamics beyond classical equilibrium frameworks and why issues such as non-stationarity and self-organization matter for economic modeling ([arXiv:1101.1847](https://arxiv.org/abs/1101.1847)).

For this project, that literature motivates transparent behavioral rules, explicit heterogeneity, and strong validation discipline. The model should not merely produce plausible-looking paths; it must record assumptions, seeds, diagnostics, and sensitivity results.

## Credit Networks

Delli Gatti, Gallegati, Greenwald, Russo, and Stiglitz model a credit-network economy with downstream firms, upstream firms, and banks, where productive and credit relationships allow failures and financing conditions to diffuse through the network ([arXiv:1006.3521](https://arxiv.org/abs/1006.3521)).

This project uses that logic as a design warning: bank credit tightness and firm working-capital pressure should not be treated as aggregate wedges only. They need links to firm production, household income, defaults, and supplier stress.

## Production Networks

Mandel and Veetil study shock propagation through production networks and emphasize that macro outcomes depend on the structure and dynamics of the network, including how disturbances mix and dissipate over time ([arXiv:2603.05367](https://arxiv.org/abs/2603.05367)).

That motivates the Milestone 8 production-network explorer: users need to inspect systemic sectors, bottlenecks, paths, and local rewiring rather than only aggregate inflation paths.

## Graph Analytics And Exploration

Neo4j's Aura Graph Analytics page emphasizes graph algorithms such as community detection, pathfinding, and similarity, and positions graph analytics as a way to uncover hidden patterns in connected data ([Neo4j Aura Graph Analytics](https://neo4j.com/product/aura-graph-analytics/)).

This is not an economic citation, but it informed the interface direction: the ABM network explorer should feel like an analytical graph canvas, with ranking, path highlighting, focus neighborhoods, and maneuverable nodes.

## Next Bibliography Tasks

The next literature pass should verify and add canonical production-network macro references, including Acemoglu, Carvalho, Ozdaglar, and Tahbaz-Salehi; Carvalho; Baqaee and Farhi; Gabaix; and work on price rigidity, supply-chain shocks, and ABM validation.
