"""
Mizan Subnet Validator
======================
Aggregates miner scores and distributes TAO rewards.
"""
import asyncio
import logging
from typing import Optional, List, Dict
from dataclasses import dataclass
import time

import bittensor as bt

from ..common.types import (
    EpochProof,
    MinerAnalysis,
    ValidatorRanking,
    SlashingEvent,
    ProofStatus,
)
from ..common.scoring import rank_miners, compute_tao_distribution
from ..common.policies import PolicyRegistry, DEFAULT_POLICY_V1


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class ValidatorConfig:
    """Configuration for the validator."""
    wallet_name: str = "validator"
    hotkey_name: str = "default"
    netuid: int = 1
    network: str = "test"
    epoch_length_seconds: int = 3600  # 1 hour
    min_miners_per_epoch: int = 3
    top_k_rewards: int = 10


class EpochManager:
    """
    Manages epoch lifecycle and proof collection.
    """

    def __init__(self, config: ValidatorConfig):
        self.config = config
        self.current_epoch: int = 0
        self.epoch_proofs: Dict[int, List[EpochProof]] = {}
        self.epoch_analyses: Dict[int, List[MinerAnalysis]] = {}
        self.epoch_results: Dict[int, ValidatorRanking] = {}

    def next_epoch(self) -> int:
        """Advance to next epoch."""
        self.current_epoch += 1
        self.epoch_proofs[self.current_epoch] = []
        self.epoch_analyses[self.current_epoch] = []
        logger.info(f"Started epoch {self.current_epoch}")
        return self.current_epoch

    def add_proof(self, proof: EpochProof) -> bool:
        """Add proof to current epoch."""
        if proof.epoch != self.current_epoch:
            logger.warning(f"Proof epoch {proof.epoch} != current {self.current_epoch}")
            return False
        self.epoch_proofs[self.current_epoch].append(proof)
        return True

    def add_analysis(self, analysis: MinerAnalysis) -> bool:
        """Add miner analysis to current epoch."""
        if analysis.epoch != self.current_epoch:
            return False
        self.epoch_analyses[self.current_epoch].append(analysis)
        return True

    def finalize_epoch(self) -> Optional[ValidatorRanking]:
        """Finalize current epoch and compute rankings."""
        analyses = self.epoch_analyses.get(self.current_epoch, [])
        
        if len(analyses) < self.config.min_miners_per_epoch:
            logger.warning(
                f"Not enough miners ({len(analyses)}) for epoch {self.current_epoch}"
            )
            return None

        rankings = rank_miners(analyses)
        
        result = ValidatorRanking(
            epoch=self.current_epoch,
            rankings=rankings,
            total_miners=len(analyses),
            timestamp=int(time.time()),
        )
        
        self.epoch_results[self.current_epoch] = result
        return result


class Validator:
    """
    Bittensor subnet validator for proof verification and miner ranking.
    """

    def __init__(self, config: ValidatorConfig):
        self.config = config
        self.policy_registry = PolicyRegistry()
        self.epoch_manager = EpochManager(config)
        self.slashing_events: List[SlashingEvent] = []
        
        # Initialize default policy
        self.policy_registry.register_policy(DEFAULT_POLICY_V1)
        
        # Bittensor components
        self.wallet: Optional[bt.wallet] = None
        self.subtensor: Optional[bt.subtensor] = None
        self.dendrite: Optional[bt.dendrite] = None
        self.metagraph: Optional[bt.metagraph] = None

    def setup(self):
        """Initialize Bittensor components."""
        logger.info("Setting up validator...")
        
        # Initialize wallet
        self.wallet = bt.wallet(
            name=self.config.wallet_name,
            hotkey=self.config.hotkey_name,
        )
        logger.info(f"Wallet: {self.wallet}")

        # Connect to subtensor
        self.subtensor = bt.subtensor(network=self.config.network)
        logger.info(f"Subtensor: {self.subtensor}")

        # Initialize dendrite for calling miners
        self.dendrite = bt.dendrite(wallet=self.wallet)
        logger.info(f"Dendrite: {self.dendrite}")

        # Get metagraph
        self.metagraph = self.subtensor.metagraph(netuid=self.config.netuid)
        logger.info(f"Metagraph: {len(self.metagraph.uids)} neurons")

    async def query_miners(self, proof: EpochProof) -> List[MinerAnalysis]:
        """
        Query all miners for proof analysis.
        
        Args:
            proof: Proof to analyze
        
        Returns:
            List of miner analyses
        """
        if self.metagraph is None:
            raise RuntimeError("Validator not setup")

        # Get all miner axons
        miner_uids = self.metagraph.uids.tolist()
        miner_axons = [self.metagraph.axons[uid] for uid in miner_uids]

        logger.info(f"Querying {len(miner_axons)} miners for epoch {proof.epoch}")

        # Create synapse with proof data
        synapse = self._create_analysis_synapse(proof)

        # Query all miners
        responses = await self.dendrite.forward(
            axons=miner_axons,
            synapse=synapse,
            timeout=30.0,
        )

        # Collect valid responses
        analyses = []
        for uid, response in zip(miner_uids, responses):
            if response is not None and hasattr(response, "scores"):
                analyses.append(response)
                logger.info(f"Miner {uid} responded with score {response.scores.weighted_score}")
            else:
                logger.warning(f"Miner {uid} failed to respond")

        return analyses

    def _create_analysis_synapse(self, proof: EpochProof):
        """Create synapse for miner analysis request."""
        # This would be a proper Bittensor synapse class
        class AnalysisSynapse:
            def __init__(self, proof):
                self.epoch = proof.epoch
                self.issuer_id = proof.issuer_id
                self.merkle_root = proof.merkle_root.hex()
                self.proof = proof.proof.hex()
                self.policy_hash = proof.policy_hash.hex()
                self.timestamp = proof.timestamp
                self.status = proof.status.value
        
        return AnalysisSynapse(proof)

    async def verify_proof(self, proof: EpochProof) -> bool:
        """
        Verify ZK proof cryptographically.
        
        In production, this calls the on-chain verifier.
        """
        # TODO: Call on-chain Groth16Verifier
        # For now, assume valid if proof bytes exist
        return len(proof.proof) > 0

    async def process_epoch(self):
        """
        Process a single epoch.
        
        1. Collect proofs from issuers
        2. Verify proofs
        3. Query miners
        4. Rank miners
        5. Distribute rewards
        """
        epoch = self.epoch_manager.next_epoch()
        logger.info(f"Processing epoch {epoch}")

        # In production, proofs come from on-chain events
        # For now, we simulate receiving proofs
        proofs = await self._collect_proofs()

        for proof in proofs:
            # Verify proof
            is_valid = await self.verify_proof(proof)
            proof.status = ProofStatus.VERIFIED if is_valid else ProofStatus.REJECTED
            
            if not is_valid:
                logger.warning(f"Proof for issuer {proof.issuer_id} invalid")
                continue

            self.epoch_manager.add_proof(proof)

            # Query miners for analysis
            analyses = await self.query_miners(proof)
            for analysis in analyses:
                self.epoch_manager.add_analysis(analysis)

        # Finalize epoch and compute rankings
        ranking = self.epoch_manager.finalize_epoch()
        
        if ranking:
            logger.info(f"Epoch {epoch} rankings: {ranking.rankings[:5]}")
            
            # Distribute rewards
            await self._distribute_rewards(ranking)

    async def _collect_proofs(self) -> List[EpochProof]:
        """
        Collect proofs for current epoch.
        
        In production, this listens to on-chain events.
        """
        # Placeholder - would query IntegrityRegistry contract
        return []

    async def _distribute_rewards(self, ranking: ValidatorRanking):
        """
        Distribute TAO rewards to top miners.
        """
        # Compute distribution
        # In production, get total TAO from subtensor
        total_tao = 1.0  # Placeholder
        
        distribution = compute_tao_distribution(
            rankings=ranking.rankings,
            total_tao=total_tao,
            top_k=self.config.top_k_rewards,
        )

        logger.info(f"Reward distribution: {distribution}")

        # In production, set weights on-chain
        if self.subtensor and self.metagraph:
            weights = self._compute_weights(distribution)
            # self.subtensor.set_weights(...)

    def _compute_weights(self, distribution: Dict[str, float]) -> List[float]:
        """Convert distribution to subnet weights."""
        if self.metagraph is None:
            return []
        
        weights = [0.0] * len(self.metagraph.uids)
        for miner_id, reward in distribution.items():
            try:
                uid = int(miner_id)
                if 0 <= uid < len(weights):
                    weights[uid] = reward
            except ValueError:
                continue
        return weights

    async def run(self):
        """Main validator loop."""
        self.setup()

        logger.info("Starting validator...")

        try:
            while True:
                # Process epoch
                await self.process_epoch()
                
                # Wait for next epoch
                logger.info(f"Waiting {self.config.epoch_length_seconds}s for next epoch")
                await asyncio.sleep(self.config.epoch_length_seconds)
                
                # Refresh metagraph
                self.metagraph.sync()
                
        except KeyboardInterrupt:
            logger.info("Shutting down validator...")


async def main():
    """Entry point for validator."""
    config = ValidatorConfig()
    validator = Validator(config)
    await validator.run()


if __name__ == "__main__":
    asyncio.run(main())
