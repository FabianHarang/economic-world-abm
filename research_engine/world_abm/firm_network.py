"""Firm population and supplier-network generation."""

from __future__ import annotations

from array import array
from dataclasses import dataclass
from typing import Any

from .network import SparseProductionNetwork, generate_sparse_network, summarize_network
from .rng import SplitMix64


@dataclass(frozen=True)
class FirmNetworkConfig:
    firms: int
    sectors: int
    banks: int
    supplier_edges: int
    seed: int = 12_345
    size_dispersion: float = 1.25
    leverage_mean: float = 0.42
    supplier_diversification: float = 1.0


@dataclass
class FirmPopulation:
    sector: array
    stage: array
    bank: array
    workforce: array
    productivity: array
    capital: array
    wage_policy: array
    leverage: array
    markup: array
    inventory_target: array
    network: SparseProductionNetwork

    def summary(self) -> dict[str, Any]:
        firms = len(self.sector)
        total_workforce = sum(self.workforce)
        return {
            "firms": firms,
            "meanWorkforce": total_workforce / max(1, firms),
            "meanProductivity": sum(self.productivity) / max(1, firms),
            "meanLeverage": sum(self.leverage) / max(1, firms),
            **summarize_network(self.network),
        }


def generate_firm_population(config: FirmNetworkConfig) -> FirmPopulation:
    rng = SplitMix64(config.seed)
    sector = array("H")
    stage = array("b")
    bank = array("H")
    workforce = array("i")
    productivity = array("f")
    capital = array("d")
    wage_policy = array("f")
    leverage = array("f")
    markup = array("f")
    inventory_target = array("f")

    for firm_id in range(config.firms):
        sector_id = firm_id % config.sectors
        size_draw = _pareto_like_size(rng, config.size_dispersion)
        workers = max(1, int(size_draw * 18))
        productivity_draw = 0.78 + rng.random() * 0.48
        sector.append(sector_id)
        stage.append(sector_id % 6)
        bank.append(firm_id % config.banks)
        workforce.append(workers)
        productivity.append(productivity_draw)
        capital.append(workers * productivity_draw * (1.8 + rng.random() * 2.7))
        wage_policy.append(0.88 + rng.random() * 0.32)
        leverage.append(_clamp(config.leverage_mean + (rng.random() - 0.5) * 0.34, 0.02, 0.92))
        markup.append(0.08 + rng.random() * 0.28)
        inventory_target.append(0.8 + rng.random() * 1.8)

    network = generate_sparse_network(
        firms=config.firms,
        sectors=config.sectors,
        target_edges=max(config.firms, int(config.supplier_edges * config.supplier_diversification)),
        rng=rng,
    )
    return FirmPopulation(
        sector=sector,
        stage=stage,
        bank=bank,
        workforce=workforce,
        productivity=productivity,
        capital=capital,
        wage_policy=wage_policy,
        leverage=leverage,
        markup=markup,
        inventory_target=inventory_target,
        network=network,
    )


def _pareto_like_size(rng: SplitMix64, dispersion: float) -> float:
    draw = max(0.0001, 1.0 - rng.random())
    return min(80.0, draw ** (-1.0 / max(1.01, 1.0 + dispersion)))


def _clamp(value: float, low: float, high: float) -> float:
    return min(high, max(low, value))
