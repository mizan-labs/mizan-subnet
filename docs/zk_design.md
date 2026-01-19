# ZK Circuit Design

This document details the Zero-Knowledge circuits used in the Mizan Subnet. We use **Circom 2.1** and **Groth16** proofs.

## Core Philosophy

1.  **Privacy**: No asset values or user balances are ever revealed.
2.  **Soundness**: Invalid states (insolvency, unauthorized minting) cannot generate valid proofs.
3.  **Binding**: All proofs are bound to a specific **Policy Hash** and **Epoch**.

## Circuit Architecture

### 1. Solvency Circuit (`solvency.circom`)

Proves that total collateral value exceeds total liability value by a specific ratio, without revealing the totals.

**Constraints:**
$$ \sum(Collateral_i) \ge \sum(Liabilities_i) \times MinRatio $$

**Public Inputs:**
*   `collateral_root`: Merkle root of collateral commitments
*   `liabilities_root`: Merkle root of liability commitments
*   `policy_hash`: Hash of the active policy
*   `epoch`: Current epoch number
*   `min_collateral_ratio`: Enforced ratio (e.g., 1.5e18)

**Private Inputs:**
*   `total_collateral`
*   `total_liabilities`
*   `collateral_proofs` (Merkle pathways)
*   `liabilities_proofs` (Merkle pathways)

**Risk Mitigation:**
*   Uses 252-bit field arithmetic (bn128).
*   Checks for overflow/underflow implicitly via field size (requires careful range checks for huge numbers, though supply is capped by practical limits).

### 2. Supply Circuit (`supply.circom`)

Proves that the minted stablecoin supply does not exceed the authorized limits.

**Constraints:**
$$ MintedSupply \le AuthorizedSupply $$

**Public Inputs:**
*   `supply_commitment`: Hash(Minted, Authorized, Nonce)
*   `policy_hash`
*   `epoch`

### 3. Risk Bounds Circuit (`risk_bounds.circom`)

Ensures that the portfolio composition adheres to risk policies (e.g., "No more than 20% in Asset X").

**Constraints:**
For each asset class $k$:
$$ AssetValue_k \ge Liability_k \times MinRatio_{policy} $$
$$ AssetValue_k \le Liability_k \times MaxRatio_{policy} $$

### 4. Epoch Circuit (`epoch.circom`)

The top-level aggregator. It verifies that:
1.  Solvency Proof is valid
2.  Supply Proof is valid
3.  Risk Bounds Proof is valid
4.  All proofs correspond to the *same* epoch and policy.

**Aggregation Strategy:**
Currently implemented as input aggregation (proving knowledge of valid sub-proofs/signals). In a production recursive SNARK setup, this would verify the actual proofs inside the circuit. For Groth16, we typically use the smart contract to verify `Solvency`, `Supply`, and `Risk` proofs individually or aggregated via a batch verifier, but `epoch.circom` serves as the logical "one proof to rule them all" conceptual model or can be implemented using SNARK recursion (e.g., pairing-friendly curves inside the circuit) if gas costs demand it.

*Current Implementation*: Logic aggregation. The smart contract `IntegrityRegistry` verifies the individual proofs (or a batch) and ensures the signals match. The `epoch.circom` in the repo demonstrates the *logical* grouping.

---

## Hashing & Merkle Trees

*   **Hash Function**: Poseidon (optimized for ZK circuits).
*   **Tree Depth**: 20 levels.
*   **Capacity**: $2^{20} \approx 1,000,000$ accounts/assets.
*   **Leaves**: Poseidon(Value).

## Proving System via SnarkJS

1.  **Setup**: Powers of Tau (Phase 1) + Circuit-specific ZKey (Phase 2).
2.  **Witness**: Calculated via C++ or WASM witness generator.
3.  **Proof**: Groth16 (succinct, constant size).
4.  **Verification**: Solidity contract `Groth16Verifier.sol`.

## Policy Binding

Every circuit includes `policy_hash` as a public input.
$$ PublicSignal_{policy} == ExpectedPolicyHash $$
This prevents an issuer from generating a proof against a weaker policy (e.g., 100% collateral) and presenting it as a proof for a strong policy (e.g., 150% collateral).
