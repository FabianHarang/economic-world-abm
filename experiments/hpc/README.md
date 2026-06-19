# HPC Runs

HPC execution is optional and approval-gated. Use it when local cross-scale validation passes but runtime, memory, or Monte Carlo sweep size makes local execution impractical.

HPC jobs must be reproducible from:

- scenario config;
- seed policy;
- code commit hash;
- Python version and environment file or container;
- exact command line;
- output metadata.

No cluster-specific secrets, private credentials, account names, or private storage paths belong in git.

## Slurm Template

See `slurm_research_scale_template.sh`. Before submitting, fill in the account, partition, time, memory, and repository path according to the target cluster.

Minimal command inside a prepared job:

```bash
PYTHONPATH=research_engine python3 -m world_abm.run \
  --config experiments/configs/research_scale_baseline.yaml \
  --out experiments/results/research_scale_baseline_hpc
```

Run cross-scale validation first:

```bash
PYTHONPATH=research_engine python3 -m world_abm.validate \
  --config experiments/configs/research_scale_baseline.yaml \
  --scales 10000,50000,100000 \
  --periods 24 \
  --out experiments/results/cross_scale_validation_hpc.json
```
