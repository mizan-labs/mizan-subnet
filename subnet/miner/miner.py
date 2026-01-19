"""
Mizan Subnet Miner
==================
Analyzes ZK proofs and generates integrity scores.
"""
import asyncio
import logging
from typing import Optional
from dataclasses import dataclass

import bittensor as bt

from ..common.types import EpochProof, IntegrityScore, MinerAnalysis, ProofStatus
from ..common.scoring import compute_integrity_score, ScoringWeights
from ..common.policies import PolicyRegistry


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class MinerConfig:
    """Configuration for the miner."""
    wallet_name: str = "miner"
    hotkey_name: str = "default"
    netuid: int = 1  # Will be assigned by Bittensor
    network: str = "test"  # test, finney, local
    axon_port: int = 8091


class ProofAnalyzer:
    """
    Analyzes ZK proofs for integrity scoring.
    
    Miners use this to evaluate proofs without seeing private data.
    """

    def __init__(self, policy_registry: PolicyRegistry):
        self.policy_registry = policy_registry

    async def analyze_proof(
        self,
        proof: EpochProof,
        previous_scores: list[IntegrityScore],
    ) -> MinerAnalysis:
        """
        Analyze a proof and generate integrity scores.
        
        Args:
            proof: The epoch proof to analyze
            previous_scores: Historical scores for this issuer
        
        Returns:
            MinerAnalysis with scoring details
        """
        # Get active policy
        policy = self.policy_registry.get_active_policy()
        if policy is None:
            raise ValueError("No active policy found")

        # Verify proof against policy
        policy_valid = self.policy_registry.validate_proof_policy(proof.policy_hash)
        if not policy_valid:
            logger.warning(f"Proof policy {proof.policy_hash.hex()} not valid")

        # Compute integrity score
        scores = compute_integrity_score(
            proof=proof,
            policy=policy,
            previous_scores=previous_scores,
            weights=ScoringWeights(),
        )

        # Compute analysis confidence
        confidence = self._compute_confidence(proof, scores)

        # Create analysis
        import hashlib
        import time
        
        analysis_data = f"{proof.epoch}:{proof.issuer_id}:{scores.weighted_score}"
        analysis_hash = hashlib.sha256(analysis_data.encode()).digest()

        return MinerAnalysis(
            miner_id="",  # Will be set by miner
            epoch=proof.epoch,
            issuer_id=proof.issuer_id,
            scores=scores,
            analysis_hash=analysis_hash,
            confidence=confidence,
            timestamp=int(time.time()),
        )

    def _compute_confidence(
        self,
        proof: EpochProof,
        scores: IntegrityScore
    ) -> float:
        """
        Compute confidence in the analysis.
        
        Higher confidence when:
        - Proof is verified
        - Policy matches active
        - Historical data is consistent
        """
        base_confidence = 0.5

        # Boost for verified proof
        if proof.status == ProofStatus.VERIFIED:
            base_confidence += 0.3

        # Boost for matching policy
        policy = self.policy_registry.get_active_policy()
        if policy and proof.policy_hash == policy.policy_hash:
            base_confidence += 0.1

        # Boost for high integrity score
        if scores.weighted_score > 0.8:
            base_confidence += 0.1

        return min(base_confidence, 1.0)


class Miner:
    """
    Bittensor subnet miner for proof analysis.
    """

    def __init__(self, config: MinerConfig):
        self.config = config
        self.policy_registry = PolicyRegistry()
        self.analyzer = ProofAnalyzer(self.policy_registry)
        
        # Will be initialized on start
        self.wallet: Optional[bt.wallet] = None
        self.subtensor: Optional[bt.subtensor] = None
        self.axon: Optional[bt.axon] = None
        self.miner_uid: Optional[int] = None

    def setup(self):
        """Initialize Bittensor components."""
        logger.info("Setting up miner...")
        
        # Initialize wallet
        self.wallet = bt.wallet(
            name=self.config.wallet_name,
            hotkey=self.config.hotkey_name,
        )
        logger.info(f"Wallet: {self.wallet}")

        # Connect to subtensor
        self.subtensor = bt.subtensor(network=self.config.network)
        logger.info(f"Subtensor: {self.subtensor}")

        # Get miner UID
        self.miner_uid = self.subtensor.get_uid_for_hotkey_on_subnet(
            hotkey_ss58=self.wallet.hotkey.ss58_address,
            netuid=self.config.netuid,
        )
        logger.info(f"Miner UID: {self.miner_uid}")

        # Setup axon for receiving requests
        self.axon = bt.axon(
            wallet=self.wallet,
            port=self.config.axon_port,
        )
        logger.info(f"Axon: {self.axon}")

    def register_handlers(self):
        """Register request handlers on axon."""
        
        # Handler for proof analysis requests
        @self.axon.attach(
            forward_fn=self.forward_analyze,
            blacklist_fn=self.blacklist,
        )
        def analyze_proof():
            pass

    async def forward_analyze(self, synapse) -> MinerAnalysis:
        """
        Handle proof analysis request from validator.
        
        Args:
            synapse: Bittensor synapse containing proof data
        
        Returns:
            MinerAnalysis result
        """
        logger.info(f"Received analysis request for epoch {synapse.epoch}")
        
        # Parse proof from synapse
        proof = EpochProof(
            epoch=synapse.epoch,
            issuer_id=synapse.issuer_id,
            merkle_root=bytes.fromhex(synapse.merkle_root),
            proof=bytes.fromhex(synapse.proof),
            policy_hash=bytes.fromhex(synapse.policy_hash),
            timestamp=synapse.timestamp,
            status=ProofStatus(synapse.status),
        )

        # Analyze proof
        analysis = await self.analyzer.analyze_proof(
            proof=proof,
            previous_scores=synapse.get("previous_scores", []),
        )
        
        # Set miner ID
        analysis.miner_id = str(self.miner_uid)

        return analysis

    async def blacklist(self, synapse) -> bool:
        """
        Determine if request should be blacklisted.
        
        Only accept requests from registered validators.
        """
        caller_uid = synapse.dendrite.hotkey
        # In production, verify caller is a registered validator
        return False

    async def run(self):
        """Main miner loop."""
        self.setup()
        self.register_handlers()

        logger.info("Starting miner...")
        self.axon.start()

        try:
            while True:
                # Keep alive
                await asyncio.sleep(60)
                
                # Log status
                logger.info(f"Miner {self.miner_uid} running...")
                
        except KeyboardInterrupt:
            logger.info("Shutting down miner...")
        finally:
            self.axon.stop()


async def main():
    """Entry point for miner."""
    config = MinerConfig()
    miner = Miner(config)
    await miner.run()


if __name__ == "__main__":
    asyncio.run(main())
