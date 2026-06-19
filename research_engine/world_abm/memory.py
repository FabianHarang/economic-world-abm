"""Memory estimates for research-scale runs."""

from __future__ import annotations

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
        4  # initial employer snapshot int32
        + 2  # bank id uint16
        + 8  # deposits float64
        + 8  # debt float64
        + 8  # mortgage debt float64
        + 4  # variable mortgage exposure float32
        + 1  # behavior rule int8
        + 1  # expectation rule int8
    )
    firm = scale.firms * (
        4  # worker count int32
        + 4  # baseline workers int32
        + 2  # sector uint16
        + 1  # stage int8
        + 4  # productivity float32
        + 8 * 9  # price, wage, output, baseline output, inventory, backlog, cash, debt, equity
    )
    bank = scale.banks * (
        8  # capital
        + 4  # credit tightness
    )
    network = scale.supplier_edges * (
        4  # supplier id
        + 4  # buyer id
        + 4  # weight
        + 4  # reliability
    ) + (scale.firms + 1) * 4
    aggregate_paths = scale.periods * (32 * 8 + scale.sectors * 6 * 8)
    persistent = household + firm + bank + network + aggregate_paths
    temporary_arrays = scale.firms * 8 * 8 + scale.sectors * 8 * 8
    runtime_overhead = int(persistent * 0.75)
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
