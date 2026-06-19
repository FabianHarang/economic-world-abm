"""Small deterministic RNG shared by the research engine."""

from __future__ import annotations


MASK_64 = (1 << 64) - 1


class SplitMix64:
    """Deterministic 64-bit generator with stable cross-platform output."""

    def __init__(self, seed: int) -> None:
        self.state = seed & MASK_64

    def next_u64(self) -> int:
        self.state = (self.state + 0x9E3779B97F4A7C15) & MASK_64
        z = self.state
        z = ((z ^ (z >> 30)) * 0xBF58476D1CE4E5B9) & MASK_64
        z = ((z ^ (z >> 27)) * 0x94D049BB133111EB) & MASK_64
        return (z ^ (z >> 31)) & MASK_64

    def random(self) -> float:
        return (self.next_u64() >> 11) * (1.0 / (1 << 53))

    def randrange(self, stop: int) -> int:
        if stop <= 0:
            raise ValueError("stop must be positive")
        return self.next_u64() % stop

    def uniform(self, low: float, high: float) -> float:
        return low + (high - low) * self.random()

    def bounded_int_delta(self, span: int) -> int:
        if span <= 0:
            return 0
        return int(self.randrange(span * 2 + 1)) - span
