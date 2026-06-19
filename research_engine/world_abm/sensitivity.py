"""Sensitivity sweeps and phase-diagram outputs."""

from __future__ import annotations

import csv
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .artifacts import write_json, write_jsonl_gz
from .config import ResearchScaleConfig, load_config
from .engine import run_research_simulation


PARAMETER_RANGES = {
    "variable_mortgage_share": (0.55, 0.95),
    "supplier_rewire_rate": (0.02, 0.24),
    "policy_rate_annual": (0.02, 0.065),
    "wealth_effect_strength": (0.04, 0.26),
}


@dataclass(frozen=True)
class SensitivityResult:
    rows: list[dict[str, Any]]
    summary: dict[str, Any]
    artifacts: dict[str, str]


def run_sensitivity_sweep(
    base_config: ResearchScaleConfig,
    *,
    x_parameter: str = "variable_mortgage_share",
    y_parameter: str = "supplier_rewire_rate",
    grid_size: int = 5,
    output_dir: str | Path | None = None,
) -> SensitivityResult:
    if x_parameter not in PARAMETER_RANGES:
        raise ValueError(f"Unsupported x parameter: {x_parameter}")
    if y_parameter not in PARAMETER_RANGES:
        raise ValueError(f"Unsupported y parameter: {y_parameter}")
    if grid_size < 2:
        raise ValueError("grid_size must be at least 2")

    rows: list[dict[str, Any]] = []
    x_values = _linspace(*PARAMETER_RANGES[x_parameter], grid_size)
    y_values = _linspace(*PARAMETER_RANGES[y_parameter], grid_size)
    for x_index, x_value in enumerate(x_values):
        for y_index, y_value in enumerate(y_values):
            config = base_config.with_overrides(
                scenario_name=f"sensitivity_{x_parameter}_{x_index}_{y_parameter}_{y_index}",
                **{x_parameter: x_value, y_parameter: y_value},
            )
            result = run_research_simulation(config, write_artifacts=False)
            rows.append(
                {
                    x_parameter: x_value,
                    y_parameter: y_value,
                    "finalInflationAnnualized": result.summary["finalInflationAnnualized"],
                    "finalUnemploymentRate": result.summary["finalUnemploymentRate"],
                    "finalOutputIndex": result.summary["finalOutputIndex"],
                    "finalHousingPriceIndex": result.summary["finalHousingPriceIndex"],
                    "finalBankCreditTightness": result.summary["finalBankCreditTightness"],
                    "lossProxy": _loss_proxy(result.summary),
                    "diagnosticsPassed": result.diagnostics["accountingChecksPassed"],
                }
            )

    summary = _summarize(rows, x_parameter, y_parameter)
    artifacts: dict[str, str] = {}
    if output_dir is not None:
        artifacts = _write_sensitivity_artifacts(Path(output_dir), rows, summary, x_parameter, y_parameter)
    return SensitivityResult(rows=rows, summary=summary, artifacts=artifacts)


def _loss_proxy(summary: dict[str, Any]) -> float:
    inflation_gap = (float(summary["finalInflationAnnualized"]) - 0.02) / 0.02
    unemployment_gap = (float(summary["finalUnemploymentRate"]) - 0.04) / 0.04
    output_gap = (float(summary["finalOutputIndex"]) - 100.0) / 100.0
    return inflation_gap * inflation_gap + 0.6 * unemployment_gap * unemployment_gap + 0.4 * output_gap * output_gap


def _summarize(rows: list[dict[str, Any]], x_parameter: str, y_parameter: str) -> dict[str, Any]:
    best = min(rows, key=lambda row: row["lossProxy"])
    worst_unemployment = max(rows, key=lambda row: row["finalUnemploymentRate"])
    inflation_values = [row["finalInflationAnnualized"] for row in rows]
    output_values = [row["finalOutputIndex"] for row in rows]
    return {
        "gridPoints": len(rows),
        "xParameter": x_parameter,
        "yParameter": y_parameter,
        "bestLossProxy": best,
        "highestUnemployment": worst_unemployment,
        "inflationRange": [min(inflation_values), max(inflation_values)],
        "outputRange": [min(output_values), max(output_values)],
        "diagnosticsPassed": all(row["diagnosticsPassed"] for row in rows),
    }


def _write_sensitivity_artifacts(
    output_dir: Path,
    rows: list[dict[str, Any]],
    summary: dict[str, Any],
    x_parameter: str,
    y_parameter: str,
) -> dict[str, str]:
    output_dir.mkdir(parents=True, exist_ok=True)
    results_path = output_dir / "sensitivity_results.jsonl.gz"
    summary_path = output_dir / "sensitivity_summary.json"
    phase_path = output_dir / "phase_diagram.csv"
    write_jsonl_gz(results_path, rows)
    write_json(summary_path, summary)
    with phase_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                x_parameter,
                y_parameter,
                "finalInflationAnnualized",
                "finalUnemploymentRate",
                "finalOutputIndex",
                "lossProxy",
            ],
        )
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row[field] for field in writer.fieldnames})
    return {
        "results": str(results_path),
        "summary": str(summary_path),
        "phaseDiagram": str(phase_path),
    }


def _linspace(start: float, stop: float, count: int) -> list[float]:
    if count == 1:
        return [start]
    step = (stop - start) / (count - 1)
    return [start + step * index for index in range(count)]


def main(argv: list[str] | None = None) -> int:
    import argparse

    parser = argparse.ArgumentParser(description="Run sensitivity and phase-diagram sweeps.")
    parser.add_argument("--config", default="experiments/configs/research_scale_baseline.yaml")
    parser.add_argument("--out", default="experiments/results/sensitivity")
    parser.add_argument("--x", default="variable_mortgage_share")
    parser.add_argument("--y", default="supplier_rewire_rate")
    parser.add_argument("--grid-size", type=int, default=5)
    parser.add_argument("--households", type=int, default=10_000)
    parser.add_argument("--firms", type=int, default=100)
    parser.add_argument("--periods", type=int, default=18)
    args = parser.parse_args(argv)

    base_config = load_config(args.config).with_overrides(
        scenario_name="sensitivity_probe",
        households=args.households,
        firms=args.firms,
        banks=max(5, min(25, args.firms // 10)),
        sectors=min(25, max(5, args.firms // 10)),
        supplier_edges_target=max(args.firms * 8, args.firms),
        periods=args.periods,
    )
    result = run_sensitivity_sweep(
        base_config,
        x_parameter=args.x,
        y_parameter=args.y,
        grid_size=args.grid_size,
        output_dir=args.out,
    )
    print(json.dumps({"summary": result.summary, "artifacts": result.artifacts}, indent=2, sort_keys=True))
    return 0 if result.summary["diagnosticsPassed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
