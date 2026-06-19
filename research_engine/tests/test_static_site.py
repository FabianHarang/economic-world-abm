from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from world_abm.config import ResearchScaleConfig
from world_abm.engine import run_research_simulation
from world_abm.static_site import build_static_site_summary, main as static_site_main


class StaticSiteArtifactTest(unittest.TestCase):
    def test_static_summary_keeps_curated_fields_only(self) -> None:
        config = ResearchScaleConfig(
            scenario_name="test_static_site_summary",
            households=1_500,
            firms=50,
            banks=5,
            sectors=5,
            periods=5,
            supplier_edges_target=250,
            seed=101,
        )
        result = run_research_simulation(config, write_artifacts=False)
        artifact = build_static_site_summary(result)

        self.assertEqual(artifact["artifactKind"], "milestone_10_static_results")
        self.assertTrue(artifact["diagnosticsPassed"])
        self.assertFalse(artifact["artifactPolicy"]["rawMicrostateIncluded"])
        self.assertEqual(artifact["scenarioName"], "test_static_site_summary")
        self.assertEqual(artifact["scale"]["households"], 1_500)
        self.assertIn("finalPeriod", artifact)
        self.assertIn("inflationAnnualized", artifact["finalPeriod"])
        self.assertLessEqual(len(artifact["sectorStressTop"]), 5)
        self.assertNotIn("path", artifact)
        self.assertNotIn("sectors", artifact)

    def test_static_site_cli_writes_json_artifact(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            output_path = Path(tmpdir) / "milestone10_results.json"
            exit_code = static_site_main(
                [
                    "--out",
                    str(output_path),
                    "--households",
                    "1000",
                    "--firms",
                    "40",
                    "--banks",
                    "5",
                    "--sectors",
                    "5",
                    "--periods",
                    "4",
                    "--supplier-edges",
                    "200",
                    "--seed",
                    "2026",
                ]
            )

            self.assertEqual(exit_code, 0)
            payload = json.loads(output_path.read_text(encoding="utf-8"))
            self.assertTrue(payload["diagnosticsPassed"])
            self.assertEqual(payload["scale"]["households"], 1_000)
            self.assertFalse(payload["artifactPolicy"]["rawMicrostateIncluded"])


if __name__ == "__main__":
    unittest.main()
