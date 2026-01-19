"""
Common types for the Mizan Subnet.
"""
from dataclasses import dataclass
from typing import List, Optional
from enum import Enum


class ProofStatus(Enum):
    """Status of a proof submission."""
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"
    EXPIRED = "expired"


@dataclass
class EpochProof:
    """Represents a single epoch proof submission."""
    epoch: int
    issuer_id: str
    merkle_root: bytes
    proof: bytes
    policy_hash: bytes
    timestamp: int
    status: ProofStatus = ProofStatus.PENDING

    def to_dict(self) -> dict:
        return {
            "epoch": self.epoch,
            "issuer_id": self.issuer_id,
            "merkle_root": self.merkle_root.hex(),
            "proof": self.proof.hex(),
            "policy_hash": self.policy_hash.hex(),
            "timestamp": self.timestamp,
            "status": self.status.value,
        }


@dataclass
class IntegrityScore:
    """Integrity score for an issuer at a given epoch."""
    issuer_id: str
    epoch: int
    score: float  # 0.0 to 1.0
    proof_valid: bool
    policy_adherence: float
    constraint_coverage: float
    edge_case_score: float
    stability_score: float

    @property
    def weighted_score(self) -> float:
        """Compute time-weighted integrity score."""
        weights = {
            "proof_valid": 0.4,
            "policy_adherence": 0.2,
            "constraint_coverage": 0.2,
            "edge_case_score": 0.1,
            "stability_score": 0.1,
        }
        return (
            (1.0 if self.proof_valid else 0.0) * weights["proof_valid"]
            + self.policy_adherence * weights["policy_adherence"]
            + self.constraint_coverage * weights["constraint_coverage"]
            + self.edge_case_score * weights["edge_case_score"]
            + self.stability_score * weights["stability_score"]
        )


@dataclass
class MinerAnalysis:
    """Analysis result from a miner."""
    miner_id: str
    epoch: int
    issuer_id: str
    scores: IntegrityScore
    analysis_hash: bytes
    confidence: float  # 0.0 to 1.0
    timestamp: int


@dataclass
class Policy:
    """Integrity policy definition."""
    policy_hash: bytes
    version: int
    min_collateral_ratio: float  # e.g., 1.5 = 150%
    max_collateral_ratio: float  # e.g., 2.0 = 200%
    min_supply_coverage: float
    allowed_asset_classes: List[str]
    epoch_deadline_seconds: int
    is_active: bool = True

    def to_dict(self) -> dict:
        return {
            "policy_hash": self.policy_hash.hex(),
            "version": self.version,
            "min_collateral_ratio": self.min_collateral_ratio,
            "max_collateral_ratio": self.max_collateral_ratio,
            "min_supply_coverage": self.min_supply_coverage,
            "allowed_asset_classes": self.allowed_asset_classes,
            "epoch_deadline_seconds": self.epoch_deadline_seconds,
            "is_active": self.is_active,
        }


@dataclass
class ValidatorRanking:
    """Ranking result from validator."""
    epoch: int
    rankings: List[tuple[str, float]]  # (miner_id, score)
    total_miners: int
    timestamp: int


@dataclass 
class SlashingEvent:
    """Record of a slashing event."""
    epoch: int
    target_id: str  # miner or issuer
    reason: str
    severity: float  # 0.0 to 1.0
    evidence_hash: bytes
    timestamp: int
