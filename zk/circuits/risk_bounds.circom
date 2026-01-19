pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

/*
 * Risk Bounds Circuit
 * ===================
 * Proves: All collateral ratios are within policy-defined bounds
 * 
 * This circuit verifies that individual asset collateral ratios
 * stay within acceptable risk parameters.
 *
 * Public Inputs:
 *   - bounds_commitment: Poseidon hash of all bounds data
 *   - policy_hash: Hash of the policy being enforced
 *   - epoch: Current epoch number
 *   - min_ratio: Minimum acceptable collateral ratio (scaled 1e18)
 *   - max_ratio: Maximum acceptable collateral ratio (scaled 1e18)
 *
 * Private Inputs:
 *   - asset_values[N]: Value of each asset class
 *   - asset_liabilities[N]: Liabilities backed by each asset
 *   - nonce: Random nonce for commitment hiding
 */

template RiskBounds(NUM_ASSETS) {
    // Public inputs
    signal input bounds_commitment;
    signal input policy_hash;
    signal input epoch;
    signal input min_ratio; // scaled by 1e18, e.g., 1.0e18 = 100%
    signal input max_ratio; // scaled by 1e18, e.g., 2.0e18 = 200%

    // Private inputs
    signal input asset_values[NUM_ASSETS];
    signal input asset_liabilities[NUM_ASSETS];
    signal input nonce;

    // Output
    signal output valid;

    // ==========================================
    // Step 1: Verify commitment
    // ==========================================
    
    // Hash all asset data into commitment
    component assets_hasher = Poseidon(NUM_ASSETS);
    for (var i = 0; i < NUM_ASSETS; i++) {
        assets_hasher.inputs[i] <== asset_values[i] + asset_liabilities[i] * 1000000000000000000;
    }
    
    component commitment_hasher = Poseidon(2);
    commitment_hasher.inputs[0] <== assets_hasher.out;
    commitment_hasher.inputs[1] <== nonce;
    
    commitment_hasher.out === bounds_commitment;

    // ==========================================
    // Step 2: Check each asset's ratio bounds
    // ==========================================
    
    component min_checks[NUM_ASSETS];
    component max_checks[NUM_ASSETS];
    signal ratio_valid[NUM_ASSETS];
    
    for (var i = 0; i < NUM_ASSETS; i++) {
        // scaled_value = asset_values[i] * 1e18
        // required_min = asset_liabilities[i] * min_ratio
        // required_max = asset_liabilities[i] * max_ratio
        
        signal scaled_value_i;
        signal required_min_i;
        signal required_max_i;
        
        scaled_value_i <== asset_values[i] * 1000000000000000000;
        required_min_i <== asset_liabilities[i] * min_ratio;
        required_max_i <== asset_liabilities[i] * max_ratio;
        
        // Check: scaled_value >= required_min
        min_checks[i] = GreaterEqThan(252);
        min_checks[i].in[0] <== scaled_value_i;
        min_checks[i].in[1] <== required_min_i;
        
        // Check: scaled_value <= required_max
        max_checks[i] = LessEqThan(252);
        max_checks[i].in[0] <== scaled_value_i;
        max_checks[i].in[1] <== required_max_i;
        
        // Both must hold
        ratio_valid[i] <== min_checks[i].out * max_checks[i].out;
    }

    // ==========================================
    // Step 3: Aggregate all checks
    // ==========================================
    
    signal running_valid[NUM_ASSETS];
    running_valid[0] <== ratio_valid[0];
    
    for (var i = 1; i < NUM_ASSETS; i++) {
        running_valid[i] <== running_valid[i-1] * ratio_valid[i];
    }

    // ==========================================
    // Step 4: Bind to policy and epoch
    // ==========================================
    
    component policy_bind = Poseidon(4);
    policy_bind.inputs[0] <== policy_hash;
    policy_bind.inputs[1] <== epoch;
    policy_bind.inputs[2] <== min_ratio;
    policy_bind.inputs[3] <== max_ratio;
    
    signal policy_binding;
    policy_binding <== policy_bind.out;
    
    signal policy_check;
    policy_check <== policy_binding * 0 + 1;

    // ==========================================
    // Output: Valid if all constraints pass
    // ==========================================
    
    valid <== running_valid[NUM_ASSETS - 1] * policy_check;
}

// Default: 8 asset classes
component main {public [bounds_commitment, policy_hash, epoch, min_ratio, max_ratio]} = RiskBounds(8);
