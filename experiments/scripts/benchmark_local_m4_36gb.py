"""Local benchmark protocol for the Milestone 6 research engine."""

from __future__ import annotations

import argparse
import json
import os
import platform
import sys
import time
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "research_engine"))

from world_abm.config import load_config  # noqa: E402
from world_abm.engine import run_research_simulation  # noqa: E402
from world_abm.memory import Scale, estimate_bytes, gb  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="experiments/configs/research_scale_baseline.yaml")
    parser.add_argument("--households", type=int, default=50_000)
    parser.add_argument("--firms", type=int, default=250)
    parser.add_argument("--banks", type=int, default=10)
    parser.add_argument("--sectors", type=int, default=10)
    parser.add_argument("--periods", type=int, default=24)
    parser.add_argument("--supplier-edges", type=int, default=2_500)
    parser.add_argument("--seed", type=int, default=12_345)
    parser.add_argument("--out", default="experiments/results/local_m4_benchmark")
    args = parser.parse_args()

    config = load_config(args.config).with_overrides(
        scenario_name="local_m4_36gb_benchmark",
        households=args.households,
        firms=args.firms,
        banks=args.banks,
        sectors=args.sectors,
        periods=args.periods,
        supplier_edges_target=args.supplier_edges,
        seed=args.seed,
    )
    scale = Scale(
        households=config.households,
        firms=config.firms,
        banks=config.banks,
        sectors=config.sectors,
        supplier_edges=config.supplier_edges_target,
        periods=config.periods,
    )
    estimate = estimate_bytes(scale)

    print("Economic World ABM local benchmark")
    print(f"platform: {platform.platform()}")
    print(f"machine: {platform.machine()}")
    print(f"python: {sys.version.split()[0]}")
    print(f"cpu_threads_detected: {os.cpu_count()}")
    print(f"memory_estimate_gb: {gb(estimate['recommended_budget']):.3f}")
    print(f"households: {config.households}")
    print(f"firms: {config.firms}")
    print(f"banks: {config.banks}")
    print(f"sectors: {config.sectors}")
    print(f"supplier_edges: {config.supplier_edges_target}")
    print(f"periods: {config.periods}")

    start = time.perf_counter()
    result = run_research_simulation(config, output_dir=REPO_ROOT / args.out)
    elapsed = time.perf_counter() - start
    agent_periods = config.households * config.periods
    report = {
        "elapsedSeconds": elapsed,
        "secondsPerPeriod": elapsed / config.periods,
        "agentPeriodsPerSecond": agent_periods / max(elapsed, 1e-9),
        "diagnosticsPassed": result.diagnostics["accountingChecksPassed"],
        "summary": result.summary,
        "artifacts": result.artifacts,
    }
    print(json.dumps(report, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
