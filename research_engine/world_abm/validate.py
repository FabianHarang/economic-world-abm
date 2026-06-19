"""CLI for cross-scale validation."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from .config import load_config
from .validation import run_cross_scale_validation


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run cross-scale validation.")
    parser.add_argument("--config", type=str, default=None)
    parser.add_argument("--scales", type=str, default="10000,50000,100000")
    parser.add_argument("--periods", type=int, default=24)
    parser.add_argument("--out", type=str, default="experiments/results/cross_scale_validation.json")
    args = parser.parse_args(argv)

    scales = [int(value.strip()) for value in args.scales.split(",") if value.strip()]
    config = load_config(args.config)
    report = run_cross_scale_validation(
        config,
        scales=scales,
        periods=args.periods,
        output_path=Path(args.out),
    )
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
