"""Synthetic household population generator for calibration scaffolding."""

from __future__ import annotations

from array import array
from dataclasses import dataclass
from typing import Any

from .rng import SplitMix64


@dataclass(frozen=True)
class SyntheticPopulationConfig:
    households: int
    firms: int
    banks: int
    sectors: int
    seed: int = 12_345
    unemployment_rate: float = 0.06
    mortgage_ownership_rate: float = 0.58
    variable_mortgage_share: float = 0.90
    equity_ownership_rate: float = 0.32
    regions: int = 6


@dataclass
class SyntheticPopulation:
    household_size: array
    age_group: array
    region: array
    skill_group: array
    employed: array
    sector: array
    employer: array
    bank: array
    income: array
    deposits: array
    debt: array
    mortgage_debt: array
    equity_ownership: array
    behavior_rule: array
    expectation_rule: array

    def summary(self) -> dict[str, Any]:
        households = len(self.household_size)
        employed_count = sum(1 for value in self.employed if value)
        mortgage_count = sum(1 for value in self.mortgage_debt if value > 0)
        equity_count = sum(1 for value in self.equity_ownership if value)
        total_income = sum(self.income)
        total_debt = sum(self.debt) + sum(self.mortgage_debt)
        return {
            "households": households,
            "employmentRate": employed_count / max(1, households),
            "mortgageShare": mortgage_count / max(1, households),
            "equityOwnershipShare": equity_count / max(1, households),
            "meanIncome": total_income / max(1, households),
            "debtToIncome": total_debt / max(1.0, total_income),
        }


def generate_synthetic_population(config: SyntheticPopulationConfig) -> SyntheticPopulation:
    rng = SplitMix64(config.seed)
    household_size = array("b")
    age_group = array("b")
    region = array("H")
    skill_group = array("b")
    employed = array("b")
    sector = array("H")
    employer = array("i")
    bank = array("H")
    income = array("d")
    deposits = array("d")
    debt = array("d")
    mortgage_debt = array("d")
    equity_ownership = array("b")
    behavior_rule = array("b")
    expectation_rule = array("b")

    for household_id in range(config.households):
        size = _draw_household_size(rng)
        age = _draw_age_group(rng)
        skill = _draw_skill_group(rng)
        is_employed = rng.random() >= config.unemployment_rate and age not in {0, 5}
        sector_id = int(rng.randrange(config.sectors)) if is_employed else 0
        employer_id = int(rng.randrange(config.firms)) if is_employed else -1
        income_anchor = (0.55 + skill * 0.28 + size * 0.08) * (1.0 if is_employed else 0.34)
        has_mortgage = rng.random() < config.mortgage_ownership_rate and age in {2, 3, 4}
        owns_equity = rng.random() < config.equity_ownership_rate * (0.6 + skill * 0.22)

        household_size.append(size)
        age_group.append(age)
        region.append(int(rng.randrange(max(1, config.regions))))
        skill_group.append(skill)
        employed.append(1 if is_employed else 0)
        sector.append(sector_id)
        employer.append(employer_id)
        bank.append(household_id % config.banks)
        income.append(max(0.05, income_anchor * (0.82 + rng.random() * 0.42)))
        deposits.append(max(0.02, income_anchor * (0.15 + rng.random() * 2.1)))
        debt.append(max(0.0, income_anchor * (0.05 + rng.random() * 0.85)))
        mortgage_debt.append(income_anchor * (2.2 + rng.random() * 3.5) if has_mortgage else 0.0)
        equity_ownership.append(1 if owns_equity else 0)
        behavior_rule.append(_draw_behavior_rule(rng))
        expectation_rule.append(_draw_expectation_rule(rng))

    return SyntheticPopulation(
        household_size=household_size,
        age_group=age_group,
        region=region,
        skill_group=skill_group,
        employed=employed,
        sector=sector,
        employer=employer,
        bank=bank,
        income=income,
        deposits=deposits,
        debt=debt,
        mortgage_debt=mortgage_debt,
        equity_ownership=equity_ownership,
        behavior_rule=behavior_rule,
        expectation_rule=expectation_rule,
    )


def _draw_household_size(rng: SplitMix64) -> int:
    draw = rng.random()
    if draw < 0.40:
        return 1
    if draw < 0.75:
        return 2
    if draw < 0.90:
        return 3
    if draw < 0.98:
        return 4
    return 5


def _draw_age_group(rng: SplitMix64) -> int:
    draw = rng.random()
    if draw < 0.14:
        return 0
    if draw < 0.30:
        return 1
    if draw < 0.52:
        return 2
    if draw < 0.73:
        return 3
    if draw < 0.88:
        return 4
    return 5


def _draw_skill_group(rng: SplitMix64) -> int:
    draw = rng.random()
    if draw < 0.28:
        return 0
    if draw < 0.72:
        return 1
    return 2


def _draw_behavior_rule(rng: SplitMix64) -> int:
    draw = rng.random()
    if draw < 0.35:
        return 0
    if draw < 0.65:
        return 1
    if draw < 0.85:
        return 2
    return 3


def _draw_expectation_rule(rng: SplitMix64) -> int:
    draw = rng.random()
    if draw < 0.48:
        return 0
    if draw < 0.80:
        return 1
    if draw < 0.90:
        return 2
    return 3
