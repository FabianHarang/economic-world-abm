"""Moment matching helpers for calibration scaffolding."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Mapping

from .artifacts import write_json
from .config import ResearchScaleConfig, load_config
from .engine import run_research_simulation


DEFAULT_TARGET_MOMENTS = {
    "finalInflationAnnualized": {"target": 0.02, "weight": 1.0},
    "finalUnemploymentRate": {"target": 0.04, "weight": 0.8},
    "finalOutputIndex": {"target": 100.0, "weight": 0.45},
    "finalBankCreditTightness": {"target": 0.12, "weight": 0.35},
}


@dataclass(frozen=True)
class MomentMatchResult:
    scenario_name: str
    loss: float
    moments: dict[str, dict[str, float]]
    diagnostics_passed: bool

    def to_dict(self) -> dict[str, Any]:
        return {
            "scenarioName": self.scenario_name,
            "loss": self.loss,
            "moments": self.moments,
            "diagnosticsPassed": self.diagnostics_passed,
        }


def run_moment_matching(
    config: ResearchScaleConfig,
    *,
    targets: Mapping[str, Mapping[str, float]] | None = None,
    output_path: str | Path | None = None,
) -> MomentMatchResult:
    moment_targets = targets or DEFAULT_TARGET_MOMENTS
    result = run_research_simulation(config, write_artifacts=False)
    moments: dict[str, dict[str, float]] = {}
    loss = 0.0
    for name, target_spec in moment_targets.items():
        simulated = float(result.summary[name])
        target = float(target_spec["target"])
        weight = float(target_spec.get("weight", 1.0))
        scale = abs(target) if abs(target) > 1e-9 else 1.0
        normalized_error = (simulated - target) / scale
        contribution = weight * normalized_error * normalized_error
        loss += contribution
        moments[name] = {
            "simulated": simulated,
            "target": target,
            "weight": weight,
            "normalizedError": normalized_error,
            "lossContribution": contribution,
        }
    payload = MomentMatchResult(
        scenario_name=config.scenario_name,
        loss=loss,
        moments=moments,
        diagnostics_passed=bool(result.diagnostics["accountingChecksPassed"]),
    )
    if output_path is not None:
        write_json(Path(output_path), payload.to_dict())
    return payload


def load_target_moments(path: str | Path | None) -> dict[str, dict[str, float]]:
    if path is None:
        return DEFAULT_TARGET_MOMENTS
    loaded = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(loaded, dict):
        raise ValueError("target moments file must contain a JSON object")
    return {
        str(name): {
            "target": float(spec["target"]),
            "weight": float(spec.get("weight", 1.0)),
        }
        for name, spec in loaded.items()
    }


def main(argv: list[str] | None = None) -> int:
    import argparse

    parser = argparse.ArgumentParser(description="Run a moment-matching loss check.")
    parser.add_argument("--config", default="experiments/configs/research_scale_baseline.yaml")
    parser.add_argument("--targets", default=None)
    parser.add_argument("--out", default="experiments/results/moment_matching.json")
    parser.add_argument("--households", type=int, default=20_000)
    parser.add_argument("--firms", type=int, default=100)
    parser.add_argument("--periods", type=int, default=24)
    args = parser.parse_args(argv)

    config = load_config(args.config).with_overrides(
        scenario_name="moment_matching_probe",
        households=args.households,
        firms=args.firms,
        supplier_edges_target=max(args.firms * 8, args.firms),
        periods=args.periods,
    )
    result = run_moment_matching(
        config,
        targets=load_target_moments(args.targets),
        output_path=args.out,
    )
    print(json.dumps(result.to_dict(), indent=2, sort_keys=True))
    return 0 if result.diagnostics_passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
