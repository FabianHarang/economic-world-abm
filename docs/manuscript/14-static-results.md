# Static Result Artifacts

Milestone 10 introduces a static artifact path for publishing model outputs on a static website.

The artifact is generated from the offline engine, then reduced to metadata, diagnostics, final-period aggregate outcomes, production-network summaries, and ranked sector stress. It intentionally excludes raw household, firm, bank, and network microstate.

The first committed artifact is `data/static-site/milestone10_results.json`. It is a smoke-scale artifact used to verify the exporter and website contract. It should not be interpreted as a calibrated Norway or EU result.

Future result artifacts should be produced from paired-seed runs after:

- Norway-specific calibration targets are documented;
- EU / Euro area comparison assumptions are separated from Norway assumptions;
- sensitivity sweeps show whether conclusions are robust;
- the manuscript records parameter hashes, seeds, scale, diagnostics, and known limitations.
