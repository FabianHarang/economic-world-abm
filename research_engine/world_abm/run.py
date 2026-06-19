"""CLI for the research-scale engine."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from .config import load_config
from .engine import run_research_simulation
from .memory import Scale, estimate_bytes, gb


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run the Economic World ABM research engine.")
    parser.add_argument("--config", type=str, default=None)
    parser.add_argument("--out", type=str, default="experiments/results/research_scale_baseline")
    parser.add_argument("--households", type=int, default=None)
    parser.add_argument("--firms", type=int, default=None)
    parser.add_argument("--banks", type=int, default=None)
    parser.add_argument("--sectors", type=int, default=None)
    parser.add_argument("--periods", type=int, default=None)
    parser.add_argument("--supplier-edges", type=int, default=None)
    parser.add_argument("--seed", type=int, default=None)
    parser.add_argument("--policy-rate-annual", type=float, default=None)
    parser.add_argument("--treatment-shock-bps", type=float, default=None)
    parser.add_argument("--max-memory-gb", type=float, default=None)
    parser.add_argument("--skip-memory-check", action="store_true")
    args = parser.parse_args(argv)

    config = load_config(args.config).with_overrides(
        households=args.households,
        firms=args.firms,
        banks=args.banks,
        sectors=args.sectors,
        periods=args.periods,
        supplier_edges_target=args.supplier_edges,
        seed=args.seed,
        policy_rate_annual=args.policy_rate_annual,
        treatment_shock_bps=args.treatment_shock_bps,
        max_memory_gb=args.max_memory_gb,
    )
    memory_cap = args.max_memory_gb
    if memory_cap is None:
        memory_cap = float(os.getenv("WORLD_ABM_MAX_MEMORY_GB", config.max_memory_gb))
    scale = Scale(
        households=config.households,
        firms=config.firms,
        banks=config.banks,
        sectors=config.sectors,
        supplier_edges=config.supplier_edges_target,
        periods=config.periods,
    )
    estimate = estimate_bytes(scale)
    recommended_gb = gb(estimate["recommended_budget"])
    if not args.skip_memory_check and recommended_gb > memory_cap:
        print(
            json.dumps(
                {
                    "error": "memory_estimate_exceeds_cap",
                    "recommendedGb": round(recommended_gb, 3),
                    "memoryCapGb": memory_cap,
                    "hint": "Raise WORLD_ABM_MAX_MEMORY_GB or pass --skip-memory-check after reviewing the estimate.",
                },
                indent=2,
            ),
            file=sys.stderr,
        )
        return 2

    result = run_research_simulation(config, output_dir=Path(args.out))
    print(
        json.dumps(
            {
                "scenarioName": result.metadata["scenarioName"],
                "parameterHash": result.metadata["parameterHash"],
                "scale": result.metadata["scale"],
                "memoryEstimateGb": round(recommended_gb, 3),
                "diagnosticsPassed": result.diagnostics["accountingChecksPassed"],
                "summary": result.summary,
                "artifacts": result.artifacts,
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
