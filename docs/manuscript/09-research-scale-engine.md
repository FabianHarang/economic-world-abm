# 09. Research-Scale Engine

Milestone 6 separates the interactive browser companion from the offline research engine. The browser remains useful for mechanism inspection, while the Python engine targets larger runs and reproducible compressed artifacts.

## Computational Representation

The engine uses typed arrays for household, firm, bank, and production-network state. The default target is one million households, five thousand firms, twenty-five banks, twenty-five sectors, and seventy-five thousand sparse supplier edges.

The employer-worker structure is represented by period-level firm worker counts plus an initial household-employer snapshot. This avoids per-firm worker rosters while preserving a deterministic synthetic population structure.

## Artifacts

Research-scale runs write metadata, summary, diagnostics, network summary, aggregate time series, and sector time series. Aggregate and sector paths are gzipped JSONL files. Raw household microstate is not written by default.

## Validation

The model must pass cross-scale validation before a million-household output is interpreted. The first validation compares final inflation, unemployment, output, and bank-credit tightness across smaller scales and records diagnostics for each run.

This validation does not make the model empirically calibrated. It only checks that the computational representation is stable enough to support the later calibration and sensitivity milestones.
