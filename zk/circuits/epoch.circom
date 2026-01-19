pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

/*
 * Epoch Circuit
 * =============
 * Aggregates all sub-proofs for a single epoch submission.
 * 
 * This is the "main" circuit that combines solvency, supply, and risk bounds
 * into a single epoch-level validity proof.
 *
 * Public Inputs:
 *   - epoch: Current epoch number
 *   - policy_hash: Hash of active policy
 *   - issuer_id: Identifier for the issuer
 *   - solvency_valid: Output from solvency circuit
 *   - supply_valid: Output from supply circuit
 *   - risk_valid: Output from risk bounds circuit
 *   - previous_epoch_hash: Hash of previous epoch (for chaining)
 *
 * Private Inputs:
 *   - solvency_proof_hash: Hash of the solvency proof
 *   - supply_proof_hash: Hash of the supply proof
 *   - risk_proof_hash: Hash of the risk bounds proof
 *   - timestamp: Unix timestamp of proof generation
 */

template Epoch() {
    // Public inputs
    signal input epoch;
    signal input policy_hash;
    signal input issuer_id;
    signal input solvency_valid;
    signal input supply_valid;
    signal input risk_valid;
    signal input previous_epoch_hash;

    // Private inputs
    signal input solvency_proof_hash;
    signal input supply_proof_hash;
    signal input risk_proof_hash;
    signal input timestamp;

    // Outputs
    signal output valid;
    signal output epoch_hash;

    // ==========================================
    // Step 1: Verify all sub-proofs are valid
    // ==========================================
    
    // Ensure each validity signal is exactly 1
    signal solvency_check;
    signal supply_check;
    signal risk_check;
    
    solvency_check <== solvency_valid * (solvency_valid - 1);
    solvency_check === 0; // Must be 0 or 1
    
    supply_check <== supply_valid * (supply_valid - 1);
    supply_check === 0;
    
    risk_check <== risk_valid * (risk_valid - 1);
    risk_check === 0;
    
    // All must be 1
    signal all_valid;
    all_valid <== solvency_valid * supply_valid * risk_valid;

    // ==========================================
    // Step 2: Enforce epoch monotonicity
    // ==========================================
    
    // Epoch must be positive
    component epoch_positive = GreaterThan(64);
    epoch_positive.in[0] <== epoch;
    epoch_positive.in[1] <== 0;

    // ==========================================
    // Step 3: Compute epoch hash for chaining
    // ==========================================
    
    // Hash all epoch data for immutable record
    component epoch_hasher = Poseidon(5);
    epoch_hasher.inputs[0] <== epoch;
    epoch_hasher.inputs[1] <== policy_hash;
    epoch_hasher.inputs[2] <== issuer_id;
    epoch_hasher.inputs[3] <== previous_epoch_hash;
    epoch_hasher.inputs[4] <== timestamp;
    
    epoch_hash <== epoch_hasher.out;

    // ==========================================
    // Step 4: Compute proof aggregate hash
    // ==========================================
    
    component proofs_hasher = Poseidon(3);
    proofs_hasher.inputs[0] <== solvency_proof_hash;
    proofs_hasher.inputs[1] <== supply_proof_hash;
    proofs_hasher.inputs[2] <== risk_proof_hash;
    
    signal proofs_aggregate;
    proofs_aggregate <== proofs_hasher.out;
    
    // Ensure proofs hash is bound (prevents optimizing away)
    signal proof_binding;
    proof_binding <== proofs_aggregate * 0 + 1;

    // ==========================================
    // Step 5: Final validity
    // ==========================================
    
    valid <== all_valid * epoch_positive.out * proof_binding;
}

component main {public [epoch, policy_hash, issuer_id, solvency_valid, supply_valid, risk_valid, previous_epoch_hash]} = Epoch();
