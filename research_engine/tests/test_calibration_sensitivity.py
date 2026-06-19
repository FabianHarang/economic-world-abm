from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from world_abm.config import ResearchScaleConfig
from world_abm.firm_network import FirmNetworkConfig, generate_firm_population
from world_abm.moments import run_moment_matching
from world_abm.population import SyntheticPopulationConfig, generate_synthetic_population
from world_abm.sensitivity import run_sensitivity_sweep


class CalibrationSensitivityTest(unittest.TestCase):
    def test_synthetic_population_has_consistent_lengths_and_summary(self) -> None:
        population = generate_synthetic_population(
            SyntheticPopulationConfig(households=1_000, firms=40, banks=5, sectors=8, seed=11)
        )
        summary = population.summary()

        self.assertEqual(len(population.employer), 1_000)
        self.assertEqual(summary["households"], 1_000)
        self.assertGreater(summary["employmentRate"], 0.65)
        self.assertGreater(summary["debtToIncome"], 0)

    def test_firm_network_generator_returns_sparse_network_summary(self) -> None:
        firms = generate_firm_population(
            FirmNetworkConfig(firms=80, sectors=8, banks=5, supplier_edges=480, seed=22)
        )
        summary = firms.summary()

        self.assertEqual(summary["firms"], 80)
        self.assertEqual(summary["supplier_edges"], 480)
        self.assertEqual(summary["representation"], "compressed_sparse_row_by_buyer")
        self.assertGreater(summary["meanWorkforce"], 0)

    def test_moment_matching_and_sensitivity_write_artifacts(self) -> None:
        config = ResearchScaleConfig(
            scenario_name="calibration_test",
            households=2_000,
            firms=60,
            banks=5,
            sectors=6,
            periods=4,
            supplier_edges_target=360,
            seed=33,
        )
        with tempfile.TemporaryDirectory() as tmpdir:
            moment_path = Path(tmpdir) / "moments.json"
            moment_result = run_moment_matching(config, output_path=moment_path)
            self.assertTrue(moment_path.exists())
            self.assertTrue(moment_result.diagnostics_passed)
            self.assertGreater(moment_result.loss, 0)

            sensitivity = run_sensitivity_sweep(
                config,
                grid_size=2,
                output_dir=Path(tmpdir) / "sensitivity",
            )
            self.assertEqual(len(sensitivity.rows), 4)
            self.assertTrue(Path(sensitivity.artifacts["phaseDiagram"]).exists())
            self.assertTrue(sensitivity.summary["diagnosticsPassed"])


if __name__ == "__main__":
    unittest.main()
