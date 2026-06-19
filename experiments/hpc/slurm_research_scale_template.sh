#!/usr/bin/env bash
# Generic Slurm template for Milestone 6 research-scale runs.
# Fill account, partition, and repository path before use.

#SBATCH --job-name=world-abm-research-scale
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=8
#SBATCH --mem=32G
#SBATCH --time=02:00:00
#SBATCH --output=world-abm-%j.out
#SBATCH --error=world-abm-%j.err

set -euo pipefail

REPO_DIR="${WORLD_ABM_REPO_DIR:-/path/to/economic-world-abm}"
cd "${REPO_DIR}"

python3 --version
git rev-parse HEAD

python3 experiments/scripts/estimate_memory.py
PYTHONPATH=research_engine python3 -m world_abm.validate \
  --config experiments/configs/research_scale_baseline.yaml \
  --scales 10000,50000,100000 \
  --periods 24 \
  --out experiments/results/cross_scale_validation_hpc.json
PYTHONPATH=research_engine python3 -m world_abm.run \
  --config experiments/configs/research_scale_baseline.yaml \
  --out experiments/results/research_scale_baseline_hpc
