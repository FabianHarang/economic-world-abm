"""Estimate memory for array-based Economic World ABM runs.

This is deliberately conservative. It estimates persistent simulation state and
adds overhead for temporary arrays, aggregation buffers, and Python/runtime
bookkeeping. The first million-agent benchmark should only be attempted after
this estimate fits inside WORLD_ABM_MAX_MEMORY_GB.
"""

from __future__ import annotations

import argparse
import os
from dataclasses import dataclass


BYTES_PER_GB = 1024**3


@dataclass(frozen=True)
class Scale:
    households: int
    firms: int
    banks: int
    sectors: int
    supplier_edges: int
    periods: int


def estimate_bytes(scale: Scale) -> dict[str, int]:
    household = scale.households * (
        4  # employer_id int32
        + 2  # bank_id int16
        + 8  # deposits float64
        + 8  # wage float64
        + 8  # debt float64
        + 8  # mortgage float64
        + 1  # housing_status int8
        + 1  # behavior_type int8
        + 1  # expectation_type int8
        + 4  # inflation_expectation float32
        + 8  # consumption habit/reference float64
        + 4  # region/skill packed fields
        + 8 * 10  # budget, tax, debt-service, consumption, portfolio working fields
        + 4 * 8  # expectations, probabilities, rule weights, scores
        + 1 * 8  # categorical flags and statuses
    )
    firm = scale.firms * (
        2  # sector_id int16
        + 1  # stage_id int8
        + 2  # bank_id int16
        + 8  # price float64
        + 4  # productivity float32
        + 8  # capital float64
        + 4  # labor_count int32
        + 8  # cash float64
        + 8  # debt float64
        + 8  # output float64
        + 8  # inventory float64
        + 8  # wage_bill float64
        + 8  # expected_demand float64
        + 8  # markup/marginal cost fields
        + 8 * 24  # cashflow, credit, pricing, demand, inventory, and diagnostics
        + 4 * 16  # sectoral coefficients and working float32 fields
        + 2 * 8  # packed categorical fields
    )
    bank = scale.banks * 8 * 64
    network = scale.supplier_edges * (
        4  # supplier_id int32
        + 4  # buyer_id int32
        + 2  # input_sector int16
        + 4  # contract_weight float32
        + 1  # delivery_delay int8
        + 4  # reliability float32
        + 8  # price float64
        + 8 * 8  # quantities, invoices, credit, delays, and temporary edge fields
    ) + (scale.firms + 1) * 8
    aggregate_paths = scale.periods * (60 * 8 + scale.sectors * 20 * 8)
    persistent = household + firm + bank + network + aggregate_paths
    temporary_arrays = int(persistent * 1.25)
    runtime_overhead = int(persistent * 1.50)
    return {
        "households": household,
        "firms": firm,
        "banks": bank,
        "network": network,
        "aggregate_paths": aggregate_paths,
        "persistent_state": persistent,
        "temporary_arrays": temporary_arrays,
        "runtime_overhead": runtime_overhead,
        "recommended_budget": persistent + temporary_arrays + runtime_overhead,
    }


def gb(value: int) -> float:
    return value / BYTES_PER_GB


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--households", type=int, default=1_000_000)
    parser.add_argument("--firms", type=int, default=5_000)
    parser.add_argument("--banks", type=int, default=25)
    parser.add_argument("--sectors", type=int, default=25)
    parser.add_argument("--supplier-edges", type=int, default=75_000)
    parser.add_argument("--periods", type=int, default=120)
    parser.add_argument(
        "--max-memory-gb",
        type=float,
        default=float(os.getenv("WORLD_ABM_MAX_MEMORY_GB", "24")),
    )
    args = parser.parse_args()
    scale = Scale(
        households=args.households,
        firms=args.firms,
        banks=args.banks,
        sectors=args.sectors,
        supplier_edges=args.supplier_edges,
        periods=args.periods,
    )
    estimates = estimate_bytes(scale)
    print("Economic World ABM memory estimate")
    for key, value in estimates.items():
        print(f"{key:>20}: {gb(value):8.3f} GB")
    fits = gb(estimates["recommended_budget"]) <= args.max_memory_gb
    print(f"{'configured cap':>20}: {args.max_memory_gb:8.3f} GB")
    print(f"{'fits cap':>20}: {str(fits).lower()}")


if __name__ == "__main__":
    main()
