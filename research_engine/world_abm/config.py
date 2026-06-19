"""Configuration loading for the research-scale engine."""

from __future__ import annotations

from dataclasses import asdict, dataclass, replace
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class ResearchScaleConfig:
    scenario_name: str = "research_scale_baseline"
    model_version: str = "0.9.0"
    economy_context: str = "Norway"
    calibration_status: str = "staged"
    households: int = 1_000_000
    firms: int = 5_000
    banks: int = 25
    sectors: int = 25
    periods: int = 120
    supplier_edges_target: int = 75_000
    period_unit: str = "month"
    seed: int = 12_345
    policy_rate_annual: float = 0.04
    treatment_shock_bps: float = 0.0
    treatment_start_period: int = 3
    treatment_duration_periods: int = 12
    initial_unemployment_rate: float = 0.06
    variable_mortgage_share: float = 0.90
    mortgage_spread_bps: float = 185.0
    fixed_mortgage_repricing_speed: float = 0.08
    housing_supply_elasticity: float = 0.28
    wealth_effect_strength: float = 0.16
    supplier_rewire_rate: float = 0.08
    max_memory_gb: float = 24.0

    def with_overrides(self, **overrides: Any) -> "ResearchScaleConfig":
        clean = {key: value for key, value in overrides.items() if value is not None}
        return replace(self, **clean)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def load_config(path: str | Path | None = None) -> ResearchScaleConfig:
    if path is None:
        return ResearchScaleConfig()

    config_path = Path(path)
    if not config_path.exists():
        raise FileNotFoundError(config_path)

    if config_path.suffix.lower() == ".json":
        import json

        mapping = json.loads(config_path.read_text(encoding="utf-8"))
    else:
        mapping = _load_yaml_like(config_path)

    return config_from_mapping(mapping)


def config_from_mapping(mapping: dict[str, Any]) -> ResearchScaleConfig:
    scale = _as_mapping(mapping.get("scale"))
    seed_policy = _as_mapping(mapping.get("seed_policy"))
    policy = _as_mapping(mapping.get("policy"))
    memory = _as_mapping(mapping.get("memory"))
    economy = _as_mapping(mapping.get("economy_context"))
    credit = _as_mapping(mapping.get("credit_housing_equity"))

    economy_context = str(economy.get("primary", mapping.get("economy_context", "Norway")))

    return ResearchScaleConfig(
        scenario_name=str(mapping.get("scenario_name", "research_scale_baseline")),
        model_version=str(mapping.get("model_version", "0.9.0")),
        economy_context=economy_context,
        calibration_status=str(economy.get("calibration_status", "staged")),
        households=int(scale.get("households", 1_000_000)),
        firms=int(scale.get("firms", 5_000)),
        banks=int(scale.get("banks", 25)),
        sectors=int(scale.get("sectors", 25)),
        periods=int(scale.get("periods", 120)),
        supplier_edges_target=int(scale.get("supplier_edges_target", 75_000)),
        period_unit=str(scale.get("period_unit", "month")),
        seed=int(seed_policy.get("master_seed", mapping.get("seed", 12_345))),
        policy_rate_annual=float(policy.get("baseline_policy_rate_annual", 0.04)),
        treatment_shock_bps=float(policy.get("treatment_shock_bps", 0.0)),
        treatment_start_period=int(policy.get("treatment_start_period", 3)),
        treatment_duration_periods=int(policy.get("treatment_duration_periods", 12)),
        variable_mortgage_share=float(credit.get("variable_mortgage_share", 0.90)),
        mortgage_spread_bps=float(credit.get("mortgage_spread_bps", 185.0)),
        fixed_mortgage_repricing_speed=float(
            credit.get("fixed_mortgage_repricing_speed", 0.08)
        ),
        housing_supply_elasticity=float(credit.get("housing_supply_elasticity", 0.28)),
        wealth_effect_strength=float(credit.get("wealth_effect_strength", 0.16)),
        supplier_rewire_rate=float(
            mapping.get("supplier_rewire_rate", policy.get("supplier_rewire_rate", 0.08))
        ),
        max_memory_gb=float(memory.get("default_max_memory_gb", 24.0)),
    )


def _load_yaml_like(path: Path) -> dict[str, Any]:
    try:
        import yaml  # type: ignore[import-untyped]
    except ImportError:
        return _parse_simple_yaml(path.read_text(encoding="utf-8"))

    loaded = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(loaded, dict):
        raise ValueError(f"Expected mapping in {path}")
    return loaded


def _parse_simple_yaml(text: str) -> dict[str, Any]:
    lines = text.splitlines()
    root: dict[str, Any] = {}
    stack: list[tuple[int, dict[str, Any]]] = [(-1, root)]
    index = 0

    while index < len(lines):
        raw_line = lines[index]
        index += 1
        if not raw_line.strip() or raw_line.lstrip().startswith("#"):
            continue

        indent = len(raw_line) - len(raw_line.lstrip(" "))
        line = raw_line.strip()
        if line.startswith("- "):
            continue
        if ":" not in line:
            continue

        key, raw_value = line.split(":", 1)
        key = key.strip()
        raw_value = raw_value.strip()
        while stack and indent <= stack[-1][0]:
            stack.pop()
        parent = stack[-1][1]

        if raw_value in {">", "|"}:
            block_lines: list[str] = []
            while index < len(lines):
                next_line = lines[index]
                next_indent = len(next_line) - len(next_line.lstrip(" "))
                if next_line.strip() and next_indent <= indent:
                    break
                block_lines.append(next_line.strip())
                index += 1
            parent[key] = " ".join(part for part in block_lines if part)
        elif raw_value == "":
            child: dict[str, Any] = {}
            parent[key] = child
            stack.append((indent, child))
        else:
            parent[key] = _parse_scalar(raw_value)

    return root


def _parse_scalar(value: str) -> Any:
    lowered = value.lower()
    if lowered == "true":
        return True
    if lowered == "false":
        return False
    if lowered == "null":
        return None
    if (value.startswith('"') and value.endswith('"')) or (
        value.startswith("'") and value.endswith("'")
    ):
        return value[1:-1]
    try:
        return int(value)
    except ValueError:
        pass
    try:
        return float(value)
    except ValueError:
        return value


def _as_mapping(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}
