"""Research-scale offline engine for the Economic World ABM."""

from .config import ResearchScaleConfig, load_config
from .engine import ResearchRunResult, run_research_simulation
from .firm_network import FirmNetworkConfig, generate_firm_population
from .population import SyntheticPopulationConfig, generate_synthetic_population
from .validation import run_cross_scale_validation

__all__ = [
    "ResearchRunResult",
    "ResearchScaleConfig",
    "FirmNetworkConfig",
    "SyntheticPopulationConfig",
    "generate_firm_population",
    "generate_synthetic_population",
    "load_config",
    "run_cross_scale_validation",
    "run_research_simulation",
]

__version__ = "0.8.0"
