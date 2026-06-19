"""Cross-scale validation utilities."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Iterable

from .artifacts import write_json
from .config import ResearchScaleConfig
from .engine import run_research_simulation


DEFAULT_TOLERANCES = {
    "finalInflationAnnualized": 0.45,
    "finalUnemploymentRate": 0.08,
    "finalOutputIndex": 0.28,
    "finalBankCreditTightness": 0.20,
}


def run_cross_scale_validation(
    base_config: ResearchScaleConfig,
    *,
    scales: Iterable[int] = (10_000, 50_000, 100_000),
    periods: int | None = None,
    output_path: str | Path | None = None,
) -> dict[str, Any]:
    reports: list[dict[str, Any]] = []
    for households in scales:
        scale_config = _scaled_config(base_config, households, periods)
        result = run_research_simulation(scale_config, write_artifacts=False)
        reports.append(
            {
                "households": scale_config.households,
                "firms": scale_config.firms,
                "banks": scale_config.banks,
                "sectors": scale_config.sectors,
                "supplierEdges": scale_config.supplier_edges_target,
                "summary": result.summary,
                "diagnostics": result.diagnostics,
            }
        )

    metric_spreads = _metric_spreads(reports)
    passed = all(
        metric_spreads[metric] <= DEFAULT_TOLERANCES[metric]
        for metric in DEFAULT_TOLERANCES
    ) and all(report["diagnostics"]["accountingChecksPassed"] for report in reports)
    payload = {
        "validation": "cross_scale",
        "baseScenario": base_config.scenario_name,
        "periods": periods if periods is not None else base_config.periods,
        "tolerances": DEFAULT_TOLERANCES,
        "metricSpreads": metric_spreads,
        "passed": passed,
        "runs": reports,
    }
    if output_path is not None:
        write_json(Path(output_path), payload)
    return payload


def _scaled_config(
    base_config: ResearchScaleConfig,
    households: int,
    periods: int | None,
) -> ResearchScaleConfig:
    firm_ratio = max(1, round(base_config.households / max(1, base_config.firms)))
    firms = max(25, households // firm_ratio)
    banks = max(5, min(base_config.banks, firms // 10))
    supplier_edges = max(firms * 6, int(firms * base_config.supplier_edges_target / base_config.firms))
    return base_config.with_overrides(
        scenario_name=f"{base_config.scenario_name}_scale_{households}",
        households=households,
        firms=firms,
        banks=banks,
        periods=periods if periods is not None else min(base_config.periods, 36),
        supplier_edges_target=supplier_edges,
    )


def _metric_spreads(reports: list[dict[str, Any]]) -> dict[str, float]:
    spreads: dict[str, float] = {}
    for metric in DEFAULT_TOLERANCES:
        values = [float(report["summary"][metric]) for report in reports]
        mean = sum(values) / max(1, len(values))
        denominator = abs(mean) if abs(mean) > 1e-9 else 1.0
        spreads[metric] = (max(values) - min(values)) / denominator
    return spreads
