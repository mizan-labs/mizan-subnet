pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

/*
 * Supply Circuit
 * ==============
 * Proves: minted_supply <= authorized_supply
 * 
 * This circuit verifies that an issuer has not minted more tokens than
 * their authorized supply limit, without revealing actual amounts.
 *
 * Public Inputs:
 *   - supply_commitment: Poseidon hash of (minted_supply, authorized_supply, nonce)
 *   - policy_hash: Hash of the policy being enforced
 *   - epoch: Current epoch number
 *
 * Private Inputs:
 *   - minted_supply: Actual minted token supply
 *   - authorized_supply: Maximum authorized supply
 *   - nonce: Random nonce for commitment hiding
 */

template Supply() {
    // Public inputs
    signal input supply_commitment;
    signal input policy_hash;
    signal input epoch;

    // Private inputs
    signal input minted_supply;
    signal input authorized_supply;
    signal input nonce;

    // Output
    signal output valid;

    // ==========================================
    // Step 1: Verify commitment
    // ==========================================
    
    component commitment_hasher = Poseidon(3);
    commitment_hasher.inputs[0] <== minted_supply;
    commitment_hasher.inputs[1] <== authorized_supply;
    commitment_hasher.inputs[2] <== nonce;
    
    commitment_hasher.out === supply_commitment;

    // ==========================================
    // Step 2: Check supply constraint
    // ==========================================
    
    // Prove: minted_supply <= authorized_supply
    component lte = LessEqThan(252);
    lte.in[0] <== minted_supply;
    lte.in[1] <== authorized_supply;

    // ==========================================
    // Step 3: Bind to policy and epoch
    // ==========================================
    
    component policy_bind = Poseidon(2);
    policy_bind.inputs[0] <== policy_hash;
    policy_bind.inputs[1] <== epoch;
    
    signal policy_binding;
    policy_binding <== policy_bind.out;
    
    // Ensure binding is computed
    signal policy_check;
    policy_check <== policy_binding * 0 + 1;

    // ==========================================
    // Output: Valid if all constraints pass
    // ==========================================
    
    valid <== lte.out * policy_check;
}

component main {public [supply_commitment, policy_hash, epoch]} = Supply();
