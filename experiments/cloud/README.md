# Cloud Runs

Cloud scaffolding is optional and approval-gated.

Do not start paid compute, create paid resources, or store credentials here without Fabian's explicit approval.

Any future cloud plan must document:

- job size;
- memory requirement;
- estimated runtime;
- expected cost range;
- storage location;
- reproducibility environment;
- credential/security handling;
- commands Fabian can approve or run.

## Milestone 6 Escalation Gate

Use cloud only after:

1. `python3 experiments/scripts/estimate_memory.py` fits the requested scale.
2. Local cross-scale validation passes.
3. A local benchmark records runtime per period and agent-periods per second.
4. The proposed cloud run states provider, instance family, vCPU count, memory, storage, expected runtime, and expected cost range.
5. Fabian explicitly approves the specific paid-resource action.

Portable run command once an approved machine is prepared:

```bash
PYTHONPATH=research_engine python3 -m world_abm.run \
  --config experiments/configs/research_scale_baseline.yaml \
  --out experiments/results/research_scale_baseline_cloud
```

No credentials, access keys, bucket secrets, or private account identifiers belong in this repository.
