# Subnet Economics & Incentives

This document outlines the game theory and economic incentives powering the Mizan Subnet.

## Analysis: The "Truth Market"

Stablecoin integrity is a **Market for Truth**.
*   **Sellers (Miners)**: Sell analysis of integrity proofs.
*   **Buyers (Validators)**: Buy analysis on behalf of the network to distribute rewards.
*   **Subject (Issuers)**: Provide the raw material (proofs) to gain legitimacy.

## Tokens & Rewards

*   **Token**: TAO (Bittensor native token).
*   **Emission**: Standard Bittensor subnet emission curve.
*   **Distribution**:
    *   **Miners (41%)**: Paid for accurate, high-confidence analysis.
    *   **Validators (41%)**: Paid for consensus ranking and verification.
    *   **Subnet Owner (18%)**: Protocol maintenance (standard).

## Miner Scoring Game

Miners compete to be the most "accurate" auditor of ZK proofs.

$$ Score_{miner} = \alpha(Acc) + \beta(Conf) + \gamma(Cons) $$

1.  **Accuracy ($Acc$)**: Does the miner's validation verdict match the cryptographic reality?
    *   If Proof is INVALID on-chain but Miner says VALID -> **Slash / Zero Score**.
    *   If Proof is VALID but Miner says INVALID -> **Low Score**.

2.  **Confidence ($Conf$)**: Miners attach a confidence interval.
    *   High confidence + Correct = **Max Reward**.
    *   Low confidence + Correct = **Lower Reward**.
    *   High confidence + Incorrect = **Heavy Penalty**.

3.  **Consensus ($Cons$)**: Measures agreement with the weighted majority of validators (Yuma Consensus).

## Validation Mechanism

Validators do NOT trust miners blindly. They perform a 2-step verification:

1.  **Hard Verification (Crypto)**: Validators run the `Groth16Verifier` (or check the on-chain registry). This is binary.
2.  **Soft Verification (Quality)**: Validators use miner output to assess "quality" metrics (timeliness of proof, adherence to policy version, historical stability).

## Slashing Conditions

*   **For Issuers**:
    *   **Missed Epoch**: Score decay.
    *   **Invalid Proof Submission**: Contract revert (cost of gas), reputation loss.
*   **For Miners**:
    *   **False Positive**: Claiming an invalid proof is valid.
    *   **Plagiarism**: Copying analysis hashes from other miners (commit-reveal scheme mitigates this).

## Issuer Incentives

Why would an issuer participate?

1.  **Legitimacy**: "Verified by Bittensor" badge.
2.  **Liquidity**: DeFi protocols can prefer assets with high Mizan Integrity Scores.
3.  **Cost**: Cheaper than Big 4 audit firms, faster (real-time).

## Future Economics: "Audit-as-a-Service"

Future versions may require Issuers to pay TAO / locked tokens to the subnet to be tracked, creating a revenue stream burned or distributed to miners.
