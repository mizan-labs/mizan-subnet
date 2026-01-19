"""
Scoring logic for the Mizan Subnet.
Defines how miners are scored and how integrity scores are computed.
"""
from typing import List, Dict, Optional
from dataclasses import dataclass
import math

from .types import EpochProof, IntegrityScore, MinerAnalysis, Policy


@dataclass
class ScoringWeights:
    """Configurable weights for scoring components."""
    proof_validity: float = 0.40
    policy_adherence: float = 0.20
    constraint_coverage: float = 0.20
    edge_case_handling: float = 0.10
    stability: float = 0.10

    def validate(self) -> bool:
        """Ensure weights sum to 1.0."""
        total = (
            self.proof_validity
            + self.policy_adherence
            + self.constraint_coverage
            + self.edge_case_handling
            + self.stability
        )
        return abs(total - 1.0) < 0.001


def compute_integrity_score(
    proof: EpochProof,
    policy: Policy,
    previous_scores: List[IntegrityScore],
    weights: Optional[ScoringWeights] = None,
) -> IntegrityScore:
    """
    Compute integrity score for a proof submission.
    
    Args:
        proof: The epoch proof to score
        policy: Active policy for this epoch
        previous_scores: Historical scores for stability calculation
        weights: Optional custom weights
    
    Returns:
        IntegrityScore with all component scores
    """
    if weights is None:
        weights = ScoringWeights()

    # 1. Proof validity (binary for now)
    proof_valid = proof.status.value == "verified"

    # 2. Policy adherence (check policy hash matches)
    policy_adherence = 1.0 if proof.policy_hash == policy.policy_hash else 0.0

    # 3. Constraint coverage (placeholder - would analyze circuit constraints)
    constraint_coverage = _compute_constraint_coverage(proof, policy)

    # 4. Edge case handling (placeholder - would analyze edge cases)
    edge_case_score = _compute_edge_case_score(proof)

    # 5. Stability (compare with previous epochs)
    stability_score = _compute_stability_score(previous_scores)

    return IntegrityScore(
        issuer_id=proof.issuer_id,
        epoch=proof.epoch,
        score=0.0,  # Will be computed by weighted_score property
        proof_valid=proof_valid,
        policy_adherence=policy_adherence,
        constraint_coverage=constraint_coverage,
        edge_case_score=edge_case_score,
        stability_score=stability_score,
    )


def _compute_constraint_coverage(proof: EpochProof, policy: Policy) -> float:
    """
    Compute how well the proof covers required constraints.
    
    For now, this is a placeholder. In production, this would:
    - Parse the circuit constraints
    - Verify all policy requirements are covered
    - Check for completeness
    """
    # Placeholder: return 0.9 if proof exists
    if proof.proof:
        return 0.9
    return 0.0


def _compute_edge_case_score(proof: EpochProof) -> float:
    """
    Compute how well the proof handles edge cases.
    
    Placeholder implementation. Would check:
    - Zero balance handling
    - Maximum value handling
    - Boundary conditions
    """
    return 0.85


def _compute_stability_score(previous_scores: List[IntegrityScore]) -> float:
    """
    Compute stability based on historical scores.
    
    Penalizes large swings in score between epochs.
    """
    if len(previous_scores) < 2:
        return 1.0

    # Compute variance of recent scores
    recent = previous_scores[-5:]  # Last 5 epochs
    scores = [s.weighted_score for s in recent]
    
    mean = sum(scores) / len(scores)
    variance = sum((s - mean) ** 2 for s in scores) / len(scores)
    std_dev = math.sqrt(variance)

    # Lower std_dev = higher stability
    # Map 0.0-0.5 std_dev to 1.0-0.0 stability
    stability = max(0.0, 1.0 - (std_dev * 2))
    return stability


def rank_miners(analyses: List[MinerAnalysis]) -> List[tuple[str, float]]:
    """
    Rank miners based on their analysis quality.
    
    Args:
        analyses: List of miner analyses for an epoch
    
    Returns:
        Sorted list of (miner_id, score) tuples, highest first
    """
    if not analyses:
        return []

    # Score each miner based on:
    # 1. Accuracy of their scoring
    # 2. Confidence calibration
    # 3. Consistency with other miners
    
    miner_scores: Dict[str, float] = {}
    
    for analysis in analyses:
        # Base score from weighted integrity score
        base_score = analysis.scores.weighted_score
        
        # Adjust by confidence (penalize overconfidence)
        confidence_penalty = _compute_confidence_penalty(
            analysis.confidence,
            analysis.scores.weighted_score
        )
        
        final_score = base_score * (1 - confidence_penalty)
        miner_scores[analysis.miner_id] = final_score

    # Apply consensus bonus/penalty
    miner_scores = _apply_consensus_adjustment(miner_scores, analyses)

    # Sort by score descending
    ranked = sorted(miner_scores.items(), key=lambda x: x[1], reverse=True)
    return ranked


def _compute_confidence_penalty(confidence: float, actual_score: float) -> float:
    """
    Penalize miners whose confidence doesn't match reality.
    
    If a miner is very confident (0.9) but their score is low (0.3),
    they should be penalized for overconfidence.
    """
    # Expected: high confidence should correlate with high scores
    expected_confidence = actual_score  # Simplified model
    error = abs(confidence - expected_confidence)
    
    # Quadratic penalty for overconfidence
    penalty = error ** 2 * 0.5
    return min(penalty, 0.3)  # Cap at 30% penalty


def _apply_consensus_adjustment(
    scores: Dict[str, float],
    analyses: List[MinerAnalysis]
) -> Dict[str, float]:
    """
    Adjust scores based on consensus with other miners.
    
    Miners who agree with the majority get a bonus.
    Outliers get a penalty (but not too much - they might be right).
    """
    if len(analyses) < 3:
        return scores

    # Compute median score for each issuer
    issuer_scores: Dict[str, List[float]] = {}
    for analysis in analyses:
        issuer_id = analysis.issuer_id
        if issuer_id not in issuer_scores:
            issuer_scores[issuer_id] = []
        issuer_scores[issuer_id].append(analysis.scores.weighted_score)

    issuer_medians = {
        issuer: sorted(s)[len(s) // 2]
        for issuer, s in issuer_scores.items()
    }

    # Adjust scores based on deviation from median
    adjusted = {}
    for analysis in analyses:
        median = issuer_medians.get(analysis.issuer_id, 0.5)
        their_score = analysis.scores.weighted_score
        deviation = abs(their_score - median)

        # Small bonus for being close to median
        consensus_factor = 1.0 + (0.1 * (1 - deviation))
        
        adjusted[analysis.miner_id] = scores[analysis.miner_id] * consensus_factor

    return adjusted


def compute_tao_distribution(
    rankings: List[tuple[str, float]],
    total_tao: float,
    top_k: int = 10
) -> Dict[str, float]:
    """
    Distribute TAO rewards based on miner rankings.
    
    Uses a power-law distribution favoring top performers.
    """
    if not rankings:
        return {}

    # Take top K miners
    top_miners = rankings[:top_k]
    
    # Compute weights (exponential decay)
    weights = []
    for i, (miner_id, score) in enumerate(top_miners):
        # Rank-based weight with score multiplier
        weight = (1 / (i + 1)) * score
        weights.append((miner_id, weight))

    # Normalize weights
    total_weight = sum(w for _, w in weights)
    if total_weight == 0:
        return {}

    distribution = {
        miner_id: (weight / total_weight) * total_tao
        for miner_id, weight in weights
    }

    return distribution
