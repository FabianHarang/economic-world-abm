"""Curated static-site result artifact builder."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from .artifacts import write_json
from .config import load_config
from .engine import ResearchRunResult, run_research_simulation


FINAL_PERIOD_FIELDS = (
    "period",
    "policyRateAnnual",
    "mortgageRateAnnual",
    "inflationAnnualized",
    "outputIndex",
    "unemploymentRate",
    "hires",
    "layoffs",
    "consumptionIndex",
    "housingPriceIndex",
    "equityPriceIndex",
    "bankCreditTightness",
    "supplyChainStress",
    "deliveryFailureRate",
    "backlogIndex",
    "inputInventoryIndex",
    "wageGrowthAnnualized",
)


def build_static_site_summary(
    result: ResearchRunResult,
    *,
    source_label: str = "offline_research_engine",
    artifact_kind: str = "milestone_10_static_results",
    top_sector_count: int = 8,
) -> dict[str, Any]:
    """Return a small, website-safe summary from a research-engine run."""

    final_period = _select_fields(result.path[-1] if result.path else {}, FINAL_PERIOD_FIELDS)
    sector_stress = _rank_sector_stress(result.sectors, limit=top_sector_count)
    metadata = result.metadata
    scale = metadata.get("scale", {})
    is_research_scale = int(scale.get("households", 0)) >= 1_000_000

    return {
        "schemaVersion": metadata.get("modelVersion", "0.11.0"),
        "artifactKind": artifact_kind,
        "source": source_label,
        "scenarioName": metadata.get("scenarioName"),
        "economyContext": metadata.get("economyContext"),
        "calibrationStatus": metadata.get("calibrationStatus"),
        "parameterHash": metadata.get("parameterHash"),
        "seedPolicy": metadata.get("seedPolicy"),
        "scale": scale,
        "generatedAt": metadata.get("generatedAt"),
        "diagnosticsPassed": result.diagnostics.get("accountingChecksPassed", False),
        "summary": result.summary,
        "finalPeriod": final_period,
        "network": _select_fields(
            result.network,
            (
                "representation",
                "supplier_edges",
                "average_in_degree",
                "max_in_degree",
                "delivery_failure_rate",
                "supplier_rewire_share",
                "rewired_edges",
            ),
        ),
        "sectorStressTop": sector_stress,
        "economyAssumptions": {
            "primary": "Norway",
            "secondary": "EU / Euro area",
            "mortgagePassThrough": "Norway-first stylized assumption; variable-rate mortgage share is high and must be calibrated against official sources.",
            "interpretation": "The artifact supports model-debugging and presentation until Norway/EU calibration and sensitivity runs are complete.",
        },
        "artifactPolicy": {
            "rawMicrostateIncluded": False,
            "researchScaleRun": is_research_scale,
            "committedPayload": "metadata_summary_final_period_network_and_ranked_sector_stress",
            "intendedUse": "Static website display, reproducibility checks, and manuscript traceability.",
            "limitations": [
                "This artifact is not a forecast and not policy advice.",
                "Smoke artifacts generated below one million households are computational checks, not final research results.",
                "Economic interpretation requires calibrated Norway-first moments, EU comparison runs, and paired-seed sensitivity analysis.",
            ],
        },
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Build a curated static-site artifact from the research engine.")
    parser.add_argument("--config", type=str, default="experiments/configs/research_scale_baseline.yaml")
    parser.add_argument("--out", type=str, default="data/static-site/milestone10_results.json")
    parser.add_argument("--households", type=int, default=None)
    parser.add_argument("--firms", type=int, default=None)
    parser.add_argument("--banks", type=int, default=None)
    parser.add_argument("--sectors", type=int, default=None)
    parser.add_argument("--periods", type=int, default=None)
    parser.add_argument("--supplier-edges", type=int, default=None)
    parser.add_argument("--seed", type=int, default=None)
    parser.add_argument("--artifact-kind", type=str, default="milestone_10_static_results")
    parser.add_argument("--source-label", type=str, default="offline_research_engine")
    args = parser.parse_args(argv)

    config = load_config(args.config).with_overrides(
        households=args.households,
        firms=args.firms,
        banks=args.banks,
        sectors=args.sectors,
        periods=args.periods,
        supplier_edges_target=args.supplier_edges,
        seed=args.seed,
    )
    result = run_research_simulation(config, write_artifacts=False)
    artifact = build_static_site_summary(
        result,
        source_label=args.source_label,
        artifact_kind=args.artifact_kind,
    )
    write_json(Path(args.out), artifact)
    print(
        json.dumps(
            {
                "out": args.out,
                "scenarioName": artifact["scenarioName"],
                "parameterHash": artifact["parameterHash"],
                "scale": artifact["scale"],
                "diagnosticsPassed": artifact["diagnosticsPassed"],
                "rawMicrostateIncluded": artifact["artifactPolicy"]["rawMicrostateIncluded"],
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


def _select_fields(row: dict[str, Any], fields: tuple[str, ...]) -> dict[str, Any]:
    return {field: row[field] for field in fields if field in row}


def _rank_sector_stress(rows: list[dict[str, Any]], *, limit: int) -> list[dict[str, Any]]:
    if not rows:
        return []
    final_period = max(int(row.get("period", 0)) for row in rows)
    final_rows = [row for row in rows if int(row.get("period", 0)) == final_period]
    ranked = sorted(final_rows, key=_sector_stress_score, reverse=True)
    return [
        {
            "period": int(row.get("period", final_period)),
            "sectorId": int(row.get("sectorId", -1)),
            "firms": int(row.get("firms", 0)),
            "stressScore": round(_sector_stress_score(row), 8),
            "outputIndex": row.get("outputIndex", 0.0),
            "backlogIndex": row.get("backlogIndex", 0.0),
            "deliveryFailureRate": row.get("deliveryFailureRate", 0.0),
        }
        for row in ranked[:limit]
    ]


def _sector_stress_score(row: dict[str, Any]) -> float:
    output_gap = max(0.0, 100.0 - float(row.get("outputIndex", 100.0))) / 100.0
    backlog = float(row.get("backlogIndex", 0.0))
    failure = float(row.get("deliveryFailureRate", 0.0))
    return output_gap + backlog + failure


if __name__ == "__main__":
    raise SystemExit(main())
