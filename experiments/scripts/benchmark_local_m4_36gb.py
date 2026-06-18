"""Local benchmark scaffold for the Economic World ABM.

This script records local hardware metadata and performs a tiny deterministic
array-style update loop. It is not the final research engine benchmark; it is a
stable protocol placeholder that will be extended when the offline engine lands.
"""

from __future__ import annotations

import argparse
import os
import platform
import sys
import time
from array import array


def run_loop(households: int, periods: int) -> float:
    deposits = array("d", (1000.0 for _ in range(households)))
    wages = array("d", (50.0 for _ in range(households)))
    start = time.perf_counter()
    for t in range(periods):
        rate = 0.0001 * (1 + t % 4)
        for i in range(households):
            deposits[i] += wages[i] - deposits[i] * rate
    elapsed = time.perf_counter() - start
    checksum = sum(deposits[: min(1000, households)])
    print(f"checksum: {checksum:.6f}")
    return elapsed


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--households", type=int, default=50_000)
    parser.add_argument("--periods", type=int, default=24)
    args = parser.parse_args()

    print("Economic World ABM local benchmark scaffold")
    print(f"platform: {platform.platform()}")
    print(f"machine: {platform.machine()}")
    print(f"python: {sys.version.split()[0]}")
    print(f"cpu_threads_detected: {os.cpu_count()}")
    print(f"households: {args.households}")
    print(f"periods: {args.periods}")

    elapsed = run_loop(args.households, args.periods)
    agent_periods = args.households * args.periods
    print(f"elapsed_seconds: {elapsed:.6f}")
    print(f"seconds_per_period: {elapsed / args.periods:.6f}")
    print(f"agent_periods_per_second: {agent_periods / elapsed:.2f}")


if __name__ == "__main__":
    main()

