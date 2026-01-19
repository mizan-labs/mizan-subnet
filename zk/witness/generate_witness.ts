/**
 * Witness Generator
 * =================
 * Builds witness data from issuer ledger for ZK proof generation.
 */

import { poseidon } from 'poseidon-lite';

export interface LedgerData {
    collateral: Record<string, bigint>;
    liabilities: Record<string, bigint>;
    mintedSupply: bigint;
    authorizedSupply: bigint;
}

export interface MerkleProof {
    root: bigint;
    path: bigint[];
    indices: number[];
}

export interface SolvencyWitness {
    // Public inputs
    collateral_root: bigint;
    liabilities_root: bigint;
    policy_hash: bigint;
    epoch: bigint;
    min_collateral_ratio: bigint;
    // Private inputs
    total_collateral: bigint;
    total_liabilities: bigint;
    collateral_path: bigint[];
    collateral_indices: number[];
    liabilities_path: bigint[];
    liabilities_indices: number[];
}

export interface SupplyWitness {
    // Public inputs
    supply_commitment: bigint;
    policy_hash: bigint;
    epoch: bigint;
    // Private inputs
    minted_supply: bigint;
    authorized_supply: bigint;
    nonce: bigint;
}

/**
 * Build a Merkle tree and return the root and proof for a value
 */
export function buildMerkleTree(
    values: bigint[],
    depth: number
): { root: bigint; leaves: bigint[] } {
    // Pad to power of 2
    const size = 2 ** depth;
    const leaves = [...values];
    while (leaves.length < size) {
        leaves.push(0n);
    }

    // Hash leaves
    let level = leaves.map((v) => poseidon([v]));

    // Build tree
    while (level.length > 1) {
        const nextLevel: bigint[] = [];
        for (let i = 0; i < level.length; i += 2) {
            nextLevel.push(poseidon([level[i], level[i + 1]]));
        }
        level = nextLevel;
    }

    return { root: level[0], leaves };
}

/**
 * Generate Merkle proof for a leaf
 */
export function getMerkleProof(
    leaves: bigint[],
    index: number,
    depth: number
): MerkleProof {
    const path: bigint[] = [];
    const indices: number[] = [];

    let level = leaves.map((v) => poseidon([v]));
    let idx = index;

    for (let i = 0; i < depth; i++) {
        const siblingIdx = idx % 2 === 0 ? idx + 1 : idx - 1;
        path.push(level[siblingIdx] || 0n);
        indices.push(idx % 2);

        // Move to next level
        const nextLevel: bigint[] = [];
        for (let j = 0; j < level.length; j += 2) {
            nextLevel.push(poseidon([level[j], level[j + 1]]));
        }
        level = nextLevel;
        idx = Math.floor(idx / 2);
    }

    return {
        root: level[0],
        path,
        indices,
    };
}

/**
 * Generate solvency witness from ledger data
 */
export function generateSolvencyWitness(
    ledger: LedgerData,
    policyHash: bigint,
    epoch: bigint,
    minCollateralRatio: bigint,
    treeDepth = 20
): SolvencyWitness {
    // Calculate totals
    const totalCollateral = Object.values(ledger.collateral).reduce(
        (a, b) => a + b,
        0n
    );
    const totalLiabilities = Object.values(ledger.liabilities).reduce(
        (a, b) => a + b,
        0n
    );

    // Build Merkle trees
    const collateralTree = buildMerkleTree([totalCollateral], treeDepth);
    const liabilitiesTree = buildMerkleTree([totalLiabilities], treeDepth);

    // Get proofs for the totals (at index 0)
    const collateralProof = getMerkleProof(
        collateralTree.leaves,
        0,
        treeDepth
    );
    const liabilitiesProof = getMerkleProof(
        liabilitiesTree.leaves,
        0,
        treeDepth
    );

    return {
        collateral_root: collateralProof.root,
        liabilities_root: liabilitiesProof.root,
        policy_hash: policyHash,
        epoch,
        min_collateral_ratio: minCollateralRatio,
        total_collateral: totalCollateral,
        total_liabilities: totalLiabilities,
        collateral_path: collateralProof.path,
        collateral_indices: collateralProof.indices,
        liabilities_path: liabilitiesProof.path,
        liabilities_indices: liabilitiesProof.indices,
    };
}

/**
 * Generate supply witness from ledger data
 */
export function generateSupplyWitness(
    ledger: LedgerData,
    policyHash: bigint,
    epoch: bigint
): SupplyWitness {
    // Generate random nonce for hiding
    const nonce = BigInt(
        '0x' +
        Array.from({ length: 32 }, () =>
            Math.floor(Math.random() * 16).toString(16)
        ).join('')
    );

    // Compute commitment
    const commitment = poseidon([
        ledger.mintedSupply,
        ledger.authorizedSupply,
        nonce,
    ]);

    return {
        supply_commitment: commitment,
        policy_hash: policyHash,
        epoch,
        minted_supply: ledger.mintedSupply,
        authorized_supply: ledger.authorizedSupply,
        nonce,
    };
}

/**
 * Convert witness to JSON for snarkjs
 */
export function witnessToJson(witness: Record<string, unknown>): string {
    const converted: Record<string, string> = {};
    for (const [key, value] of Object.entries(witness)) {
        if (typeof value === 'bigint') {
            converted[key] = value.toString();
        } else if (Array.isArray(value)) {
            converted[key] = value.map((v) =>
                typeof v === 'bigint' ? v.toString() : String(v)
            ) as unknown as string;
        } else {
            converted[key] = String(value);
        }
    }
    return JSON.stringify(converted, null, 2);
}
