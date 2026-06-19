from __future__ import annotations

import gzip
import json
import tempfile
import unittest
from pathlib import Path

from world_abm.config import ResearchScaleConfig, load_config
from world_abm.engine import run_research_simulation
from world_abm.validation import run_cross_scale_validation


class ResearchEngineTest(unittest.TestCase):
    def test_small_run_is_deterministic_and_writes_compressed_artifacts(self) -> None:
        config = ResearchScaleConfig(
            scenario_name="test_research_engine_small",
            households=2_000,
            firms=80,
            banks=5,
            sectors=8,
            periods=8,
            supplier_edges_target=400,
            seed=20260619,
        )
        with tempfile.TemporaryDirectory() as first_dir, tempfile.TemporaryDirectory() as second_dir:
            first = run_research_simulation(config, output_dir=first_dir)
            second = run_research_simulation(config, output_dir=second_dir)

            self.assertEqual(first.summary, second.summary)
            self.assertEqual(first.path, second.path)
            self.assertTrue(first.diagnostics["accountingChecksPassed"])
            self.assertEqual(first.network["representation"], "compressed_sparse_row_by_buyer")
            self.assertEqual(first.network["supplier_edges"], 400)

            aggregate_path = Path(first.artifacts["aggregate"])
            self.assertTrue(aggregate_path.name.endswith(".jsonl.gz"))
            with gzip.open(aggregate_path, "rt", encoding="utf-8") as handle:
                first_row = json.loads(handle.readline())
            self.assertEqual(first_row["period"], 0)
            self.assertIn("outputIndex", first_row)

    def test_yaml_config_loader_reads_research_scale_target(self) -> None:
        config = load_config("experiments/configs/research_scale_baseline.yaml")

        self.assertEqual(config.households, 1_000_000)
        self.assertEqual(config.firms, 5_000)
        self.assertEqual(config.economy_context, "Norway")
        self.assertGreaterEqual(config.variable_mortgage_share, 0.85)

    def test_cross_scale_validation_report_has_metric_spreads(self) -> None:
        config = ResearchScaleConfig(
            scenario_name="test_cross_scale",
            households=100_000,
            firms=500,
            banks=10,
            sectors=10,
            periods=6,
            supplier_edges_target=3_000,
            seed=77,
        )
        report = run_cross_scale_validation(config, scales=(2_000, 4_000), periods=4)

        self.assertIn("finalOutputIndex", report["metricSpreads"])
        self.assertEqual(len(report["runs"]), 2)
        self.assertTrue(all(run["diagnostics"]["accountingChecksPassed"] for run in report["runs"]))


if __name__ == "__main__":
    unittest.main()
