"""
Policy management for the Mizan Subnet.
"""
from typing import Dict, List, Optional
from dataclasses import dataclass
import hashlib
import json

from .types import Policy


# Default policies
DEFAULT_POLICY_V1 = Policy(
    policy_hash=b"",  # Will be computed
    version=1,
    min_collateral_ratio=1.5,  # 150%
    max_collateral_ratio=2.0,  # 200%
    min_supply_coverage=1.0,   # 100%
    allowed_asset_classes=["FIAT", "TBILL", "CRYPTO_STABLE"],
    epoch_deadline_seconds=86400,  # 24 hours
    is_active=True,
)


def compute_policy_hash(policy: Policy) -> bytes:
    """Compute deterministic hash for a policy."""
    policy_data = {
        "version": policy.version,
        "min_collateral_ratio": str(policy.min_collateral_ratio),
        "max_collateral_ratio": str(policy.max_collateral_ratio),
        "min_supply_coverage": str(policy.min_supply_coverage),
        "allowed_asset_classes": sorted(policy.allowed_asset_classes),
        "epoch_deadline_seconds": policy.epoch_deadline_seconds,
    }
    json_str = json.dumps(policy_data, sort_keys=True)
    return hashlib.sha256(json_str.encode()).digest()


class PolicyRegistry:
    """
    Registry for managing active and historical policies.
    """

    def __init__(self):
        self._policies: Dict[bytes, Policy] = {}
        self._active_policy: Optional[bytes] = None
        self._policy_versions: List[bytes] = []

    def register_policy(self, policy: Policy) -> bytes:
        """
        Register a new policy.
        
        Returns:
            Policy hash
        """
        policy_hash = compute_policy_hash(policy)
        policy.policy_hash = policy_hash
        
        self._policies[policy_hash] = policy
        self._policy_versions.append(policy_hash)
        
        # If this is the first policy or it's newer, make it active
        if self._active_policy is None or policy.version > self.get_active_policy().version:
            self._active_policy = policy_hash
            
        return policy_hash

    def get_policy(self, policy_hash: bytes) -> Optional[Policy]:
        """Get policy by hash."""
        return self._policies.get(policy_hash)

    def get_active_policy(self) -> Optional[Policy]:
        """Get currently active policy."""
        if self._active_policy is None:
            return None
        return self._policies.get(self._active_policy)

    def set_active_policy(self, policy_hash: bytes) -> bool:
        """
        Set active policy by hash.
        
        Returns:
            True if successful, False if policy not found
        """
        if policy_hash not in self._policies:
            return False
        self._active_policy = policy_hash
        return True

    def get_policy_history(self) -> List[Policy]:
        """Get all policies in registration order."""
        return [self._policies[h] for h in self._policy_versions]

    def validate_proof_policy(self, proof_policy_hash: bytes) -> bool:
        """
        Check if proof's policy is currently valid.
        
        A policy is valid if:
        1. It exists in the registry
        2. It's either the active policy OR a recent previous version
        """
        if proof_policy_hash not in self._policies:
            return False
            
        policy = self._policies[proof_policy_hash]
        active = self.get_active_policy()
        
        if active is None:
            return False
            
        # Allow current version and one version back
        return policy.version >= active.version - 1


def validate_policy(policy: Policy) -> tuple[bool, List[str]]:
    """
    Validate a policy definition.
    
    Returns:
        (is_valid, list of error messages)
    """
    errors = []
    
    # Collateral ratio checks
    if policy.min_collateral_ratio < 1.0:
        errors.append("min_collateral_ratio must be >= 1.0 (100%)")
    
    if policy.max_collateral_ratio < policy.min_collateral_ratio:
        errors.append("max_collateral_ratio must be >= min_collateral_ratio")
    
    if policy.max_collateral_ratio > 10.0:
        errors.append("max_collateral_ratio must be <= 10.0 (1000%)")
    
    # Supply coverage
    if policy.min_supply_coverage < 1.0:
        errors.append("min_supply_coverage must be >= 1.0 (100%)")
    
    # Asset classes
    if not policy.allowed_asset_classes:
        errors.append("allowed_asset_classes cannot be empty")
    
    # Epoch deadline
    if policy.epoch_deadline_seconds < 3600:  # 1 hour minimum
        errors.append("epoch_deadline_seconds must be >= 3600 (1 hour)")
    
    if policy.epoch_deadline_seconds > 604800:  # 1 week maximum
        errors.append("epoch_deadline_seconds must be <= 604800 (1 week)")
    
    return len(errors) == 0, errors


def create_fork_policy(
    base_policy: Policy,
    overrides: Dict,
    new_version: int
) -> Policy:
    """
    Create a forked policy based on an existing one.
    
    Useful for private deployments with custom parameters.
    """
    return Policy(
        policy_hash=b"",  # Will be computed
        version=new_version,
        min_collateral_ratio=overrides.get(
            "min_collateral_ratio", base_policy.min_collateral_ratio
        ),
        max_collateral_ratio=overrides.get(
            "max_collateral_ratio", base_policy.max_collateral_ratio
        ),
        min_supply_coverage=overrides.get(
            "min_supply_coverage", base_policy.min_supply_coverage
        ),
        allowed_asset_classes=overrides.get(
            "allowed_asset_classes", base_policy.allowed_asset_classes
        ),
        epoch_deadline_seconds=overrides.get(
            "epoch_deadline_seconds", base_policy.epoch_deadline_seconds
        ),
        is_active=overrides.get("is_active", True),
    )
