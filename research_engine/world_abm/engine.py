"""Offline research-scale simulation engine."""

from __future__ import annotations

import hashlib
import json
import math
from array import array
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .artifacts import write_json, write_jsonl_gz
from .config import ResearchScaleConfig
from .network import (
    SparseProductionNetwork,
    generate_sparse_network,
    summarize_network,
    validate_sparse_network,
)
from .rng import SplitMix64


@dataclass
class ResearchState:
    household_employer: array
    household_bank: array
    household_deposits: array
    household_debt: array
    household_mortgage_debt: array
    household_variable_mortgage_exposure: array
    household_behavior: array
    household_expectation: array
    firm_worker_count: array
    firm_baseline_workers: array
    firm_sector: array
    firm_stage: array
    firm_productivity: array
    firm_price: array
    firm_wage: array
    firm_output: array
    firm_baseline_output: array
    firm_inventory: array
    firm_backlog: array
    firm_cash: array
    firm_debt: array
    firm_equity_value: array
    bank_capital: array
    bank_credit_tightness: array
    network: SparseProductionNetwork
    unemployed_count: int
    baseline_output: float
    baseline_household_deposits: float
    baseline_household_debt: float
    baseline_mortgage_debt: float
    cpi: float
    housing_price_index: float
    equity_price_index: float
    deposits_index: float
    consumption_index: float
    input_inventory_index: float
    bank_tightness: float


@dataclass
class ResearchRunResult:
    metadata: dict[str, Any]
    path: list[dict[str, Any]]
    sectors: list[dict[str, Any]]
    network: dict[str, Any]
    diagnostics: dict[str, Any]
    summary: dict[str, Any]
    artifacts: dict[str, str]

    def to_dict(self) -> dict[str, Any]:
        return {
            "metadata": self.metadata,
            "path": self.path,
            "sectors": self.sectors,
            "network": self.network,
            "diagnostics": self.diagnostics,
            "summary": self.summary,
            "artifacts": self.artifacts,
        }


def run_research_simulation(
    config: ResearchScaleConfig,
    *,
    output_dir: str | Path | None = None,
    write_artifacts: bool = True,
) -> ResearchRunResult:
    _validate_config(config)
    rng = SplitMix64(config.seed)
    state = _initialize_state(config, rng)
    parameter_hash = _parameter_hash(config)
    path: list[dict[str, Any]] = []
    sector_rows: list[dict[str, Any]] = []
    cumulative_delivery_attempts = 0.0
    cumulative_delivery_failures = 0.0
    cumulative_rewired_edges = 0
    cumulative_layoffs = 0
    cumulative_hires = 0

    previous_cpi = state.cpi
    previous_output_index = 100.0

    for period in range(config.periods):
        policy_rate = _policy_rate_for_period(config, period)
        loan_rate = policy_rate + 0.018 + 0.002 * math.sin(period / 8)
        policy_shock = max(0.0, policy_rate - config.policy_rate_annual)
        mortgage_rate = policy_rate + config.mortgage_spread_bps / 10_000

        unemployment_rate = state.unemployed_count / config.households
        mortgage_stress = max(0.0, mortgage_rate - 0.035) * config.variable_mortgage_share
        credit_pressure = policy_shock * 6.0 + mortgage_stress * 2.5
        state.bank_tightness = _clamp(0.08 + credit_pressure + unemployment_rate * 0.18, 0.0, 0.85)
        _update_bank_tightness(state, config.banks)

        wealth_gap = (state.housing_price_index - 1.0) * 0.45 + (state.equity_price_index - 1.0) * 0.18
        consumption_target = (
            1.015
            - unemployment_rate * 0.85
            - mortgage_stress * 5.0
            - state.bank_tightness * 0.11
            + config.wealth_effect_strength * wealth_gap
        )
        state.consumption_index = _clamp(
            state.consumption_index + 0.22 * (consumption_target - state.consumption_index),
            0.45,
            1.35,
        )

        network_period = _evaluate_network(config, state, policy_shock)
        firm_period = _update_firms(config, state, period, loan_rate, policy_shock, network_period)
        asset_period = _update_asset_markets(config, state, mortgage_rate, policy_shock, firm_period)

        cumulative_delivery_attempts += network_period["delivery_attempts"]
        cumulative_delivery_failures += network_period["delivery_failures"]
        cumulative_rewired_edges += int(network_period["rewired_edges"])
        cumulative_layoffs += int(firm_period["layoffs"])
        cumulative_hires += int(firm_period["hires"])

        cpi = max(0.01, firm_period["cpi"])
        inflation_annualized = math.log(cpi / previous_cpi) * 12
        previous_cpi = cpi
        state.cpi = cpi

        employed_households = config.households - state.unemployed_count
        output_index = firm_period["output_index"]
        output_growth_annualized = math.log(max(0.01, output_index) / max(0.01, previous_output_index)) * 12
        previous_output_index = output_index
        wage_growth_annualized = firm_period["wage_growth_monthly"] * 12
        debt_service_ratio = mortgage_rate * config.variable_mortgage_share * 0.42
        state.deposits_index = _clamp(
            state.deposits_index
            + 0.015 * (employed_households / config.households - 0.93)
            - debt_service_ratio * 0.012
            - state.bank_tightness * 0.002,
            0.35,
            1.8,
        )

        aggregate_row = {
            "period": period,
            "policyRateAnnual": round(policy_rate, 8),
            "loanRateAnnual": round(loan_rate, 8),
            "mortgageRateAnnual": round(mortgage_rate, 8),
            "variableMortgageShare": round(config.variable_mortgage_share, 6),
            "cpi": round(cpi, 8),
            "inflationAnnualized": round(inflation_annualized, 8),
            "outputIndex": round(output_index, 6),
            "outputGrowthAnnualized": round(output_growth_annualized, 8),
            "employedHouseholds": employed_households,
            "unemploymentRate": round(state.unemployed_count / config.households, 8),
            "hires": int(firm_period["hires"]),
            "layoffs": int(firm_period["layoffs"]),
            "consumptionIndex": round(state.consumption_index * 100, 6),
            "householdDepositsIndex": round(state.deposits_index * 100, 6),
            "mortgageDebtServiceRatio": round(debt_service_ratio, 8),
            "housingPriceIndex": round(state.housing_price_index * 100, 6),
            "housingPriceGrowthAnnualized": round(asset_period["housing_growth_annualized"], 8),
            "equityPriceIndex": round(state.equity_price_index * 100, 6),
            "equityReturnAnnualized": round(asset_period["equity_return_annualized"], 8),
            "bankCreditTightness": round(state.bank_tightness, 8),
            "supplyChainStress": round(network_period["supply_chain_stress"], 8),
            "deliveryFailureRate": round(network_period["delivery_failure_rate"], 8),
            "supplierRewireShare": round(network_period["rewire_share"], 8),
            "backlogIndex": round(firm_period["backlog_index"], 8),
            "inputInventoryIndex": round(state.input_inventory_index * 100, 6),
            "wageGrowthAnnualized": round(wage_growth_annualized, 8),
        }
        path.append(aggregate_row)

        for sector_row in firm_period["sectors"]:
            sector_rows.append({"period": period, **sector_row})

    metadata = _metadata(config, parameter_hash)
    network_summary = {
        **summarize_network(state.network),
        "delivery_attempts": round(cumulative_delivery_attempts, 6),
        "delivery_failures": round(cumulative_delivery_failures, 6),
        "delivery_failure_rate": round(
            cumulative_delivery_failures / max(1.0, cumulative_delivery_attempts), 8
        ),
        "rewired_edges": cumulative_rewired_edges,
        "supplier_rewire_share": round(cumulative_rewired_edges / max(1, state.network.edges), 8),
    }
    diagnostics = _diagnostics(config, state)
    final = path[-1] if path else {}
    summary = {
        "finalInflationAnnualized": final.get("inflationAnnualized", 0.0),
        "finalUnemploymentRate": final.get("unemploymentRate", 0.0),
        "finalOutputIndex": final.get("outputIndex", 0.0),
        "finalConsumptionIndex": final.get("consumptionIndex", 0.0),
        "finalHousingPriceIndex": final.get("housingPriceIndex", 0.0),
        "finalEquityPriceIndex": final.get("equityPriceIndex", 0.0),
        "finalBankCreditTightness": final.get("bankCreditTightness", 0.0),
        "supplierEdges": state.network.edges,
        "cumulativeHires": cumulative_hires,
        "cumulativeLayoffs": cumulative_layoffs,
        "workerRepresentation": "firm_counts_with_initial_household_assignment",
        "outputArtifactPolicy": "aggregate_and_sector_jsonl_gzip_no_raw_microstate",
    }

    artifact_paths: dict[str, str] = {}
    if output_dir is not None and write_artifacts:
        artifact_paths = _write_artifacts(Path(output_dir), metadata, path, sector_rows, network_summary, diagnostics, summary)

    return ResearchRunResult(
        metadata=metadata,
        path=path,
        sectors=sector_rows,
        network=network_summary,
        diagnostics=diagnostics,
        summary=summary,
        artifacts=artifact_paths,
    )


def _initialize_state(config: ResearchScaleConfig, rng: SplitMix64) -> ResearchState:
    firm_sector = array("H", (index % config.sectors for index in range(config.firms)))
    firm_stage = array("b", (index % 5 for index in range(config.firms)))
    firm_productivity = array("f", (0.82 + 0.34 * rng.random() for _ in range(config.firms)))
    firm_price = array("d", (0.96 + 0.08 * rng.random() for _ in range(config.firms)))
    firm_wage = array("d", (1.0 + 0.16 * rng.random() for _ in range(config.firms)))

    baseline_workers = _allocate_initial_workers(config, firm_productivity)
    firm_worker_count = array("i", baseline_workers)
    household_employer = _build_initial_employer_snapshot(config.households, firm_worker_count)
    household_state = _build_household_state(config, household_employer, rng)
    unemployed_count = config.households - sum(firm_worker_count)

    firm_baseline_output = array(
        "d",
        (
            max(1.0, firm_productivity[index] * max(1, firm_worker_count[index]))
            for index in range(config.firms)
        ),
    )
    firm_output = array("d", firm_baseline_output)
    firm_inventory = array("d", (firm_baseline_output[index] * 1.4 for index in range(config.firms)))
    firm_backlog = array("d", [0.0]) * config.firms
    firm_cash = array("d", (firm_baseline_output[index] * 1.8 for index in range(config.firms)))
    firm_debt = array("d", (firm_baseline_output[index] * (0.35 + 0.25 * rng.random()) for index in range(config.firms)))
    firm_equity_value = array("d", (firm_baseline_output[index] * 8.0 for index in range(config.firms)))
    bank_capital = array("d", (2_000.0 + 250.0 * rng.random() for _ in range(config.banks)))
    bank_credit_tightness = array("f", [0.08]) * config.banks
    network = generate_sparse_network(
        firms=config.firms,
        sectors=config.sectors,
        target_edges=config.supplier_edges_target,
        rng=rng,
    )
    baseline_output = sum(firm_baseline_output)
    cpi = sum(firm_price) / max(1, config.firms)

    return ResearchState(
        household_employer=household_employer,
        household_bank=household_state["bank"],
        household_deposits=household_state["deposits"],
        household_debt=household_state["debt"],
        household_mortgage_debt=household_state["mortgage_debt"],
        household_variable_mortgage_exposure=household_state["variable_mortgage_exposure"],
        household_behavior=household_state["behavior"],
        household_expectation=household_state["expectation"],
        firm_worker_count=firm_worker_count,
        firm_baseline_workers=firm_worker_count[:],
        firm_sector=firm_sector,
        firm_stage=firm_stage,
        firm_productivity=firm_productivity,
        firm_price=firm_price,
        firm_wage=firm_wage,
        firm_output=firm_output,
        firm_baseline_output=firm_baseline_output,
        firm_inventory=firm_inventory,
        firm_backlog=firm_backlog,
        firm_cash=firm_cash,
        firm_debt=firm_debt,
        firm_equity_value=firm_equity_value,
        bank_capital=bank_capital,
        bank_credit_tightness=bank_credit_tightness,
        network=network,
        unemployed_count=unemployed_count,
        baseline_output=baseline_output,
        baseline_household_deposits=sum(household_state["deposits"]),
        baseline_household_debt=sum(household_state["debt"]),
        baseline_mortgage_debt=sum(household_state["mortgage_debt"]),
        cpi=cpi,
        housing_price_index=1.0,
        equity_price_index=1.0,
        deposits_index=1.0,
        consumption_index=1.0,
        input_inventory_index=1.0,
        bank_tightness=0.08,
    )


def _allocate_initial_workers(config: ResearchScaleConfig, productivity: array) -> list[int]:
    employed = int(round(config.households * (1.0 - config.initial_unemployment_rate)))
    raw_weights = [float(productivity[index]) * (1.0 + 0.02 * (index % config.sectors)) for index in range(config.firms)]
    weight_sum = sum(raw_weights) or 1.0
    counts = [max(1, int(employed * weight / weight_sum)) for weight in raw_weights]
    difference = employed - sum(counts)
    cursor = 0
    while difference != 0:
        index = cursor % config.firms
        if difference > 0:
            counts[index] += 1
            difference -= 1
        elif counts[index] > 0:
            counts[index] -= 1
            difference += 1
        cursor += 1
    return counts


def _build_initial_employer_snapshot(households: int, firm_worker_count: array) -> array:
    employer = array("i", [-1]) * households
    cursor = 0
    for firm_id, workers in enumerate(firm_worker_count):
        for _ in range(workers):
            if cursor >= households:
                break
            employer[cursor] = firm_id
            cursor += 1
    return employer


def _build_household_state(
    config: ResearchScaleConfig,
    household_employer: array,
    rng: SplitMix64,
) -> dict[str, array]:
    bank = array("H")
    deposits = array("d")
    debt = array("d")
    mortgage_debt = array("d")
    variable_mortgage_exposure = array("f")
    behavior = array("b")
    expectation = array("b")

    for household in range(config.households):
        employed = household_employer[household] >= 0
        income_anchor = 1.0 + (0.35 if employed else -0.25) + rng.random() * 0.4
        has_mortgage = rng.random() < (0.58 if employed else 0.22)
        bank.append(household % config.banks)
        deposits.append(max(0.05, income_anchor * (0.8 + 1.8 * rng.random())))
        debt.append(max(0.0, income_anchor * (0.1 + 0.9 * rng.random())))
        mortgage_debt.append(income_anchor * (2.0 + 3.2 * rng.random()) if has_mortgage else 0.0)
        variable_mortgage_exposure.append(
            _clamp(config.variable_mortgage_share + (rng.random() - 0.5) * 0.16, 0.0, 1.0)
            if has_mortgage
            else 0.0
        )
        behavior.append(int(household % 4))
        expectation.append(int((household // 3) % 4))

    return {
        "bank": bank,
        "deposits": deposits,
        "debt": debt,
        "mortgage_debt": mortgage_debt,
        "variable_mortgage_exposure": variable_mortgage_exposure,
        "behavior": behavior,
        "expectation": expectation,
    }


def _evaluate_network(
    config: ResearchScaleConfig,
    state: ResearchState,
    policy_shock: float,
) -> dict[str, Any]:
    network = state.network
    edge_availability = array("d", [0.0]) * config.firms
    edge_cost = array("d", [0.0]) * config.firms
    delivery_attempts = 0.0
    delivery_failures = 0.0
    rewired_edges = 0

    for buyer in range(config.firms):
        start = network.buyer_ptr[buyer]
        end = network.buyer_ptr[buyer + 1]
        if start == end:
            edge_availability[buyer] = 1.0
            edge_cost[buyer] = 1.0
            continue
        availability = 0.0
        input_cost = 0.0
        for edge_index in range(start, end):
            supplier = network.supplier_id[edge_index]
            weight = float(network.contract_weight[edge_index])
            inventory_cover = state.firm_inventory[supplier] / max(1.0, state.firm_baseline_output[supplier])
            reliability = float(network.reliability[edge_index])
            failure_probability = _clamp(
                (1.0 - reliability) + state.bank_tightness * 0.035 + policy_shock * 0.35,
                0.0,
                0.95,
            )
            delivery_attempts += 1.0
            delivery_failures += failure_probability
            network.reliability[edge_index] = _clamp(
                reliability + 0.006 * (0.94 - reliability) - failure_probability * 0.004,
                0.35,
                0.99,
            )
            availability += weight * reliability * _clamp(inventory_cover, 0.25, 1.2)
            input_cost += weight * state.firm_price[supplier]
        if policy_shock > 0 and buyer % max(1, int(1 / max(0.001, config.supplier_rewire_rate))) == 0:
            rewired_edges += 1
        edge_availability[buyer] = _clamp(availability, 0.2, 1.2)
        edge_cost[buyer] = _clamp(input_cost, 0.4, 2.0)

    delivery_failure_rate = delivery_failures / max(1.0, delivery_attempts)
    supply_chain_stress = _clamp(delivery_failure_rate * 1.8 + (1.0 - _mean(edge_availability)) * 0.75, 0.0, 1.0)
    return {
        "edge_availability": edge_availability,
        "edge_cost": edge_cost,
        "delivery_attempts": delivery_attempts,
        "delivery_failures": delivery_failures,
        "delivery_failure_rate": delivery_failure_rate,
        "rewired_edges": rewired_edges,
        "rewire_share": rewired_edges / max(1, network.edges),
        "supply_chain_stress": supply_chain_stress,
    }


def _update_firms(
    config: ResearchScaleConfig,
    state: ResearchState,
    period: int,
    loan_rate: float,
    policy_shock: float,
    network_period: dict[str, Any],
) -> dict[str, Any]:
    edge_availability: array = network_period["edge_availability"]
    edge_cost: array = network_period["edge_cost"]
    available_unemployed = state.unemployed_count
    hires = 0
    layoffs = 0
    total_output = 0.0
    total_backlog = 0.0
    total_inventory = 0.0
    total_wage_bill = 0.0
    sector_output = [0.0] * config.sectors
    sector_price = [0.0] * config.sectors
    sector_backlog = [0.0] * config.sectors
    sector_failures = [0.0] * config.sectors
    sector_firms = [0] * config.sectors

    unemployment_rate = available_unemployed / config.households
    wage_growth_monthly = (0.018 + max(0.0, 0.075 - unemployment_rate) * 0.35) / 12

    for firm in range(config.firms):
        sector = int(state.firm_sector[firm])
        baseline_workers = max(1, state.firm_baseline_workers[firm])
        baseline_output = max(1.0, state.firm_baseline_output[firm])
        input_availability = float(edge_availability[firm])
        input_cost = float(edge_cost[firm])
        sector_cycle = 1.0 + 0.018 * math.sin((period + sector * 2) / 9)
        demand = _clamp(
            state.consumption_index * sector_cycle * (1.0 - state.bank_tightness * 0.07),
            0.35,
            1.45,
        )
        target_workers = max(0, int(round(baseline_workers * demand * input_availability)))
        current_workers = int(state.firm_worker_count[firm])
        max_adjustment = max(1, int(max(1, current_workers) * 0.045))
        if target_workers < current_workers:
            adjustment = -min(current_workers - target_workers, max_adjustment)
            state.firm_worker_count[firm] = current_workers + adjustment
            available_unemployed -= adjustment
            layoffs += -adjustment
        elif target_workers > current_workers and available_unemployed > 0:
            adjustment = min(target_workers - current_workers, max_adjustment, available_unemployed)
            state.firm_worker_count[firm] = current_workers + adjustment
            available_unemployed -= adjustment
            hires += adjustment

        workers = max(0, int(state.firm_worker_count[firm]))
        state.firm_wage[firm] *= 1.0 + wage_growth_monthly
        labor_scale = workers / baseline_workers
        output = baseline_output * labor_scale * input_availability * (1.0 - state.bank_tightness * 0.035)
        state.firm_output[firm] = max(0.0, output)
        expected_sales = baseline_output * demand
        state.firm_inventory[firm] = _clamp(
            state.firm_inventory[firm] * 0.90 + output - expected_sales * 0.82,
            0.0,
            baseline_output * 5.0,
        )
        backlog = _clamp(expected_sales / max(1.0, output + state.firm_inventory[firm] * 0.35) - 1.0, 0.0, 2.5)
        state.firm_backlog[firm] = backlog
        price_growth = (
            0.02 / 12
            + (input_cost - 1.0) * 0.018
            + backlog * 0.003
            + policy_shock * 0.025
            - state.bank_tightness * 0.001
        )
        state.firm_price[firm] = max(0.2, state.firm_price[firm] * _clamp(1.0 + price_growth, 0.96, 1.06))
        wage_bill = workers * state.firm_wage[firm]
        revenue = output * state.firm_price[firm]
        debt_service = state.firm_debt[firm] * loan_rate / 12
        cashflow = revenue - wage_bill - debt_service
        state.firm_cash[firm] = max(0.0, state.firm_cash[firm] + cashflow * 0.12)
        if cashflow < 0:
            state.firm_debt[firm] += -cashflow * 0.05
        else:
            state.firm_debt[firm] = max(0.0, state.firm_debt[firm] - cashflow * 0.015)
        state.firm_equity_value[firm] = max(0.0, revenue * 7.5 - state.firm_debt[firm])

        total_output += output
        total_backlog += backlog
        total_inventory += state.firm_inventory[firm] / baseline_output
        total_wage_bill += wage_bill
        sector_output[sector] += output
        sector_price[sector] += state.firm_price[firm]
        sector_backlog[sector] += backlog
        sector_failures[sector] += float(network_period["delivery_failure_rate"])
        sector_firms[sector] += 1

    state.unemployed_count = max(0, min(config.households, available_unemployed))
    output_index = total_output / max(1.0, state.baseline_output) * 100
    state.input_inventory_index = _clamp(total_inventory / max(1, config.firms), 0.0, 5.0)
    cpi = sum(state.firm_price) / max(1, config.firms)
    sectors = []
    for sector in range(config.sectors):
        firms = max(1, sector_firms[sector])
        baseline_sector_output = state.baseline_output / max(1, config.sectors)
        sectors.append(
            {
                "sectorId": sector,
                "firms": sector_firms[sector],
                "outputIndex": round(sector_output[sector] / max(1.0, baseline_sector_output) * 100, 6),
                "priceIndex": round(sector_price[sector] / firms, 8),
                "backlogIndex": round(sector_backlog[sector] / firms, 8),
                "deliveryFailureRate": round(sector_failures[sector] / firms, 8),
            }
        )

    return {
        "hires": hires,
        "layoffs": layoffs,
        "output_index": output_index,
        "cpi": cpi,
        "backlog_index": total_backlog / max(1, config.firms),
        "wage_growth_monthly": wage_growth_monthly,
        "total_wage_bill": total_wage_bill,
        "sectors": sectors,
    }


def _update_asset_markets(
    config: ResearchScaleConfig,
    state: ResearchState,
    mortgage_rate: float,
    policy_shock: float,
    firm_period: dict[str, Any],
) -> dict[str, float]:
    previous_housing = state.housing_price_index
    previous_equity = state.equity_price_index
    output_gap = firm_period["output_index"] / 100 - 1.0
    housing_growth_monthly = (
        0.018 / 12
        + output_gap * 0.012
        - policy_shock * 0.75
        - max(0.0, mortgage_rate - 0.035) * config.variable_mortgage_share * 0.38
        - config.housing_supply_elasticity * 0.0008
    )
    equity_growth_monthly = (
        0.035 / 12
        + output_gap * 0.025
        - policy_shock * 0.90
        - state.bank_tightness * 0.010
    )
    state.housing_price_index *= _clamp(1.0 + housing_growth_monthly, 0.94, 1.035)
    state.equity_price_index *= _clamp(1.0 + equity_growth_monthly, 0.90, 1.055)
    return {
        "housing_growth_annualized": math.log(state.housing_price_index / previous_housing) * 12,
        "equity_return_annualized": math.log(state.equity_price_index / previous_equity) * 12,
    }


def _update_bank_tightness(state: ResearchState, banks: int) -> None:
    for bank in range(banks):
        local_cycle = 0.01 * math.sin(bank / 3)
        state.bank_credit_tightness[bank] = _clamp(state.bank_tightness + local_cycle, 0.0, 1.0)


def _policy_rate_for_period(config: ResearchScaleConfig, period: int) -> float:
    treatment_end = config.treatment_start_period + config.treatment_duration_periods
    shock = (
        config.treatment_shock_bps / 10_000
        if config.treatment_start_period <= period < treatment_end
        else 0.0
    )
    return config.policy_rate_annual + shock


def _metadata(config: ResearchScaleConfig, parameter_hash: str) -> dict[str, Any]:
    return {
        "modelVersion": config.model_version,
        "scenarioName": config.scenario_name,
        "economyContext": config.economy_context,
        "calibrationStatus": config.calibration_status,
        "parameterHash": parameter_hash,
        "seedPolicy": "splitmix64_master_seed",
        "scale": {
            "households": config.households,
            "firms": config.firms,
            "banks": config.banks,
            "sectors": config.sectors,
            "periods": config.periods,
            "supplierEdges": config.supplier_edges_target,
        },
        "generatedAt": "deterministic-milestone-6",
    }


def _diagnostics(config: ResearchScaleConfig, state: ResearchState) -> dict[str, Any]:
    worker_total = sum(state.firm_worker_count) + state.unemployed_count
    initial_snapshot_known = len(state.household_employer) == config.households
    sample_consistent = all(
        -1 <= employer < config.firms
        for employer in state.household_employer[: min(10_000, config.households)]
    )
    household_state_consistent = (
        len(state.household_bank)
        == len(state.household_deposits)
        == len(state.household_debt)
        == len(state.household_mortgage_debt)
        == len(state.household_variable_mortgage_exposure)
        == len(state.household_behavior)
        == len(state.household_expectation)
        == config.households
    )
    checks = {
        "workerCountTotalConsistent": worker_total == config.households,
        "initialEmployerSnapshotPresent": initial_snapshot_known,
        "initialEmployerSnapshotSampleConsistent": sample_consistent,
        "householdStateArraysConsistent": household_state_consistent,
        "sparseNetworkConsistent": validate_sparse_network(state.network),
        "bankStateConsistent": len(state.bank_capital) == config.banks
        and len(state.bank_credit_tightness) == config.banks,
        "priceStateConsistent": all(price > 0 for price in state.firm_price),
        "rawMicrostateWritten": False,
    }
    return {
        **checks,
        "workerRepresentation": "firm_counts_plus_initial_household_employer_snapshot",
        "accountingChecksPassed": all(
            value for key, value in checks.items() if key != "rawMicrostateWritten"
        ),
    }


def _write_artifacts(
    output_dir: Path,
    metadata: dict[str, Any],
    path: list[dict[str, Any]],
    sectors: list[dict[str, Any]],
    network: dict[str, Any],
    diagnostics: dict[str, Any],
    summary: dict[str, Any],
) -> dict[str, str]:
    output_dir.mkdir(parents=True, exist_ok=True)
    artifacts = {
        "metadata": output_dir / "metadata.json",
        "summary": output_dir / "summary.json",
        "diagnostics": output_dir / "diagnostics.json",
        "network": output_dir / "network_summary.json",
        "aggregate": output_dir / "aggregate.jsonl.gz",
        "sectors": output_dir / "sectors.jsonl.gz",
    }
    write_json(artifacts["metadata"], metadata)
    write_json(artifacts["summary"], summary)
    write_json(artifacts["diagnostics"], diagnostics)
    write_json(artifacts["network"], network)
    write_jsonl_gz(artifacts["aggregate"], path)
    write_jsonl_gz(artifacts["sectors"], sectors)
    return {key: str(value) for key, value in artifacts.items()}


def _parameter_hash(config: ResearchScaleConfig) -> str:
    payload = json.dumps(config.to_dict(), sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()[:16]


def _validate_config(config: ResearchScaleConfig) -> None:
    if config.households <= 0:
        raise ValueError("households must be positive")
    if config.firms <= 0:
        raise ValueError("firms must be positive")
    if config.banks <= 0:
        raise ValueError("banks must be positive")
    if config.sectors <= 0:
        raise ValueError("sectors must be positive")
    if config.periods <= 0:
        raise ValueError("periods must be positive")
    if config.supplier_edges_target < config.firms:
        raise ValueError("supplier_edges_target must be at least the firm count")
    if not 0 <= config.initial_unemployment_rate < 1:
        raise ValueError("initial_unemployment_rate must be in [0, 1)")
    if not 0 <= config.variable_mortgage_share <= 1:
        raise ValueError("variable_mortgage_share must be in [0, 1]")


def _mean(values: array) -> float:
    return sum(values) / max(1, len(values))


def _clamp(value: float, low: float, high: float) -> float:
    return min(high, max(low, value))
