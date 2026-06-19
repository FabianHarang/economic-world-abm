"""Sparse production-network representation."""

from __future__ import annotations

from array import array
from dataclasses import dataclass

from .rng import SplitMix64


@dataclass(frozen=True)
class SparseProductionNetwork:
    buyer_ptr: array
    supplier_id: array
    buyer_id: array
    contract_weight: array
    reliability: array

    @property
    def edges(self) -> int:
        return len(self.supplier_id)

    @property
    def firms(self) -> int:
        return len(self.buyer_ptr) - 1


def generate_sparse_network(
    *,
    firms: int,
    sectors: int,
    target_edges: int,
    rng: SplitMix64,
) -> SparseProductionNetwork:
    if firms <= 0:
        raise ValueError("firms must be positive")
    if sectors <= 0:
        raise ValueError("sectors must be positive")
    edge_target = max(firms, target_edges)
    base_degree = max(1, edge_target // firms)
    remainder = edge_target % firms

    buyer_ptr = array("I", [0])
    supplier_id = array("I")
    buyer_id = array("I")
    contract_weight = array("f")
    reliability = array("f")

    for buyer in range(firms):
        degree = base_degree + (1 if buyer < remainder else 0)
        raw_weights: list[float] = []
        suppliers: list[int] = []
        buyer_sector = buyer % sectors
        for edge_index in range(degree):
            sector_offset = 1 + ((edge_index + buyer_sector) % sectors)
            sector_anchor = (buyer_sector - sector_offset) % sectors
            supplier = sector_anchor
            if supplier < firms:
                supplier += sectors * int(rng.randrange(max(1, (firms - supplier + sectors - 1) // sectors)))
                supplier %= firms
            else:
                supplier = int(rng.randrange(firms))
            if supplier == buyer:
                supplier = (supplier + 1) % firms
            weight = 0.4 + rng.random()
            suppliers.append(supplier)
            raw_weights.append(weight)

        weight_sum = sum(raw_weights) or 1.0
        for supplier, raw_weight in zip(suppliers, raw_weights, strict=True):
            supplier_id.append(supplier)
            buyer_id.append(buyer)
            contract_weight.append(raw_weight / weight_sum)
            reliability.append(0.86 + 0.12 * rng.random())
        buyer_ptr.append(len(supplier_id))

    return SparseProductionNetwork(
        buyer_ptr=buyer_ptr,
        supplier_id=supplier_id,
        buyer_id=buyer_id,
        contract_weight=contract_weight,
        reliability=reliability,
    )


def validate_sparse_network(network: SparseProductionNetwork) -> bool:
    if len(network.buyer_ptr) != network.firms + 1:
        return False
    if not (
        len(network.supplier_id)
        == len(network.buyer_id)
        == len(network.contract_weight)
        == len(network.reliability)
    ):
        return False
    if network.buyer_ptr[0] != 0 or network.buyer_ptr[-1] != network.edges:
        return False
    previous = 0
    for buyer, pointer in enumerate(network.buyer_ptr[1:]):
        if pointer < previous:
            return False
        for edge_index in range(previous, pointer):
            if network.buyer_id[edge_index] != buyer:
                return False
            if network.supplier_id[edge_index] >= network.firms:
                return False
            if network.contract_weight[edge_index] <= 0:
                return False
            if not 0 <= network.reliability[edge_index] <= 1:
                return False
        previous = pointer
    return True


def summarize_network(network: SparseProductionNetwork) -> dict[str, float | int | str]:
    degrees = [network.buyer_ptr[index + 1] - network.buyer_ptr[index] for index in range(network.firms)]
    return {
        "representation": "compressed_sparse_row_by_buyer",
        "firms": network.firms,
        "supplier_edges": network.edges,
        "average_in_degree": network.edges / max(1, network.firms),
        "max_in_degree": max(degrees) if degrees else 0,
    }
