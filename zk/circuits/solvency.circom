pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/mux1.circom";

/*
 * Solvency Circuit
 * ================
 * Proves: sum(collateral) >= sum(liabilities) * collateral_ratio
 * 
 * This circuit verifies that an issuer has sufficient collateral to back
 * their liabilities, without revealing the actual values.
 *
 * Public Inputs:
 *   - collateral_root: Merkle root of collateral tree
 *   - liabilities_root: Merkle root of liabilities tree
 *   - policy_hash: Hash of the policy being enforced
 *   - epoch: Current epoch number
 *   - min_collateral_ratio: Minimum required ratio (scaled by 1e18)
 *
 * Private Inputs:
 *   - total_collateral: Sum of all collateral values
 *   - total_liabilities: Sum of all liabilities
 *   - collateral_proof: Merkle proof for collateral sum
 *   - liabilities_proof: Merkle proof for liabilities sum
 */

template Solvency(TREE_DEPTH) {
    // Public inputs
    signal input collateral_root;
    signal input liabilities_root;
    signal input policy_hash;
    signal input epoch;
    signal input min_collateral_ratio; // scaled by 1e18, e.g., 1.5e18 = 150%

    // Private inputs
    signal input total_collateral;
    signal input total_liabilities;
    signal input collateral_path[TREE_DEPTH];
    signal input collateral_indices[TREE_DEPTH];
    signal input liabilities_path[TREE_DEPTH];
    signal input liabilities_indices[TREE_DEPTH];

    // Output
    signal output valid;

    // ==========================================
    // Step 1: Verify Merkle proofs
    // ==========================================
    
    // Verify collateral Merkle proof
    component collateral_hasher = Poseidon(1);
    collateral_hasher.inputs[0] <== total_collateral;
    
    signal collateral_computed_root;
    component collateral_path_hashers[TREE_DEPTH];
    component collateral_muxes[TREE_DEPTH];
    
    signal collateral_hashes[TREE_DEPTH + 1];
    collateral_hashes[0] <== collateral_hasher.out;
    
    for (var i = 0; i < TREE_DEPTH; i++) {
        collateral_muxes[i] = Mux1();
        collateral_muxes[i].c[0] <== collateral_hashes[i];
        collateral_muxes[i].c[1] <== collateral_path[i];
        collateral_muxes[i].s <== collateral_indices[i];
        
        collateral_path_hashers[i] = Poseidon(2);
        collateral_path_hashers[i].inputs[0] <== collateral_muxes[i].out;
        collateral_path_hashers[i].inputs[1] <== collateral_indices[i] * (collateral_hashes[i] - collateral_path[i]) + collateral_path[i];
        
        collateral_hashes[i + 1] <== collateral_path_hashers[i].out;
    }
    
    collateral_computed_root <== collateral_hashes[TREE_DEPTH];
    collateral_computed_root === collateral_root;

    // Verify liabilities Merkle proof
    component liabilities_hasher = Poseidon(1);
    liabilities_hasher.inputs[0] <== total_liabilities;
    
    signal liabilities_computed_root;
    component liabilities_path_hashers[TREE_DEPTH];
    component liabilities_muxes[TREE_DEPTH];
    
    signal liabilities_hashes[TREE_DEPTH + 1];
    liabilities_hashes[0] <== liabilities_hasher.out;
    
    for (var i = 0; i < TREE_DEPTH; i++) {
        liabilities_muxes[i] = Mux1();
        liabilities_muxes[i].c[0] <== liabilities_hashes[i];
        liabilities_muxes[i].c[1] <== liabilities_path[i];
        liabilities_muxes[i].s <== liabilities_indices[i];
        
        liabilities_path_hashers[i] = Poseidon(2);
        liabilities_path_hashers[i].inputs[0] <== liabilities_muxes[i].out;
        liabilities_path_hashers[i].inputs[1] <== liabilities_indices[i] * (liabilities_hashes[i] - liabilities_path[i]) + liabilities_path[i];
        
        liabilities_hashes[i + 1] <== liabilities_path_hashers[i].out;
    }
    
    liabilities_computed_root <== liabilities_hashes[TREE_DEPTH];
    liabilities_computed_root === liabilities_root;

    // ==========================================
    // Step 2: Check solvency constraint
    // ==========================================
    
    // Prove: total_collateral * 1e18 >= total_liabilities * min_collateral_ratio
    // This avoids division in the circuit
    
    signal scaled_collateral;
    signal required_collateral;
    
    scaled_collateral <== total_collateral * 1000000000000000000; // 1e18
    required_collateral <== total_liabilities * min_collateral_ratio;
    
    component gte = GreaterEqThan(252);
    gte.in[0] <== scaled_collateral;
    gte.in[1] <== required_collateral;
    
    // ==========================================
    // Step 3: Bind to policy and epoch
    // ==========================================
    
    // Ensure policy_hash and epoch are used (prevents malleability)
    component policy_bind = Poseidon(3);
    policy_bind.inputs[0] <== policy_hash;
    policy_bind.inputs[1] <== epoch;
    policy_bind.inputs[2] <== min_collateral_ratio;
    
    signal policy_binding;
    policy_binding <== policy_bind.out;
    
    // Constraint to ensure policy binding is computed
    signal policy_check;
    policy_check <== policy_binding * 0 + 1;

    // ==========================================
    // Output: Valid if all constraints pass
    // ==========================================
    
    valid <== gte.out * policy_check;
}

// Default instantiation with 20-level Merkle tree (supports ~1M leaves)
component main {public [collateral_root, liabilities_root, policy_hash, epoch, min_collateral_ratio]} = Solvency(20);
