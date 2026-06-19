"""Research-scale offline engine for the Economic World ABM."""

from .config import ResearchScaleConfig, load_config
from .engine import ResearchRunResult, run_research_simulation
from .validation import run_cross_scale_validation

__all__ = [
    "ResearchRunResult",
    "ResearchScaleConfig",
    "load_config",
    "run_cross_scale_validation",
    "run_research_simulation",
]

__version__ = "0.7.0"
