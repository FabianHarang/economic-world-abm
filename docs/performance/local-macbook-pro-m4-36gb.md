# Local MacBook Pro M4 / 36 GB Profile

Fabian's primary local development machine is a MacBook Pro with Apple M4 and 36 GB unified memory. This repository treats that machine as the first serious development target, while keeping all memory and thread assumptions configurable.

## Default Environment Variables

```bash
WORLD_ABM_MAX_MEMORY_GB=24
WORLD_ABM_THREADS=auto
WORLD_ABM_PROFILE=local_m4_36gb
```

The 24 GB default is a conservative cap, leaving memory headroom for macOS, browser, editor, file cache, and background processes.

## Run Tiers

| Profile | Households | Firms | Banks | Use |
| --- | ---: | ---: | ---: | --- |
| `toy_browser` | 1,000-10,000 | 50-300 | 3-20 | Interactive browser demos |
| `browser_medium` | 10,000-100,000 | 300-2,000 | 10-50 | Browser/Web Worker stress testing |
| `local_dev` | 50,000-200,000 | 500-2,000 | 10-25 | Local research development |
| `local_large` | 500,000-1,000,000 | 2,000-5,000 | 25-50 | Only after memory estimation |
| `external_research` | Millions | Many thousands | 25-100+ | HPC/cloud/university cluster |

## Benchmark Protocol

Before attempting a million-household run locally:

1. Run `experiments/scripts/estimate_memory.py`.
2. Confirm projected memory is below `WORLD_ABM_MAX_MEMORY_GB`.
3. Run a smaller benchmark with the same model mechanisms enabled.
4. Record peak memory, runtime per period, agent-periods per second, and diagnostics.
5. If memory or runtime is unsafe, downscale locally and prepare an external compute plan.

Milestone 6 commands:

```bash
python3 experiments/scripts/estimate_memory.py
python3 experiments/scripts/benchmark_local_m4_36gb.py
PYTHONPATH=research_engine python3 -m world_abm.run \
  --config experiments/configs/research_scale_baseline.yaml \
  --out experiments/results/research_scale_baseline
```

Use a smaller benchmark first, for example:

```bash
python3 experiments/scripts/benchmark_local_m4_36gb.py \
  --households 50000 \
  --firms 250 \
  --banks 10 \
  --sectors 10 \
  --periods 24 \
  --supplier-edges 2500
```

## What To Record

The benchmark report must record:

- operating system version;
- CPU architecture;
- Python version and package versions;
- Node version;
- Rust version if used;
- detected CPU thread count;
- BLAS/accelerator backend when relevant;
- peak memory usage;
- runtime per period;
- agent-periods per second;
- number of households, firms, banks, sectors, supplier edges, and periods;
- engine used: Python, Rust, TypeScript/Node, or WebAssembly.

## Apple Silicon Notes

- Prefer native ARM64 tooling.
- Avoid Rosetta/x86 environments unless documented.
- Benchmark NumPy/Polars/Numba/Rust alternatives rather than assuming one is best.
- Do not use GPU/Metal acceleration unless a benchmark demonstrates a clear benefit.
