"""Estimate memory for Milestone 6 research-engine runs."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "research_engine"))

from world_abm.memory import Scale, estimate_bytes, gb  # noqa: E402


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
    print("Economic World ABM Milestone 6 memory estimate")
    for key, value in estimates.items():
        print(f"{key:>20}: {gb(value):8.3f} GB")
    fits = gb(estimates["recommended_budget"]) <= args.max_memory_gb
    print(f"{'configured cap':>20}: {args.max_memory_gb:8.3f} GB")
    print(f"{'fits cap':>20}: {str(fits).lower()}")


if __name__ == "__main__":
    main()
