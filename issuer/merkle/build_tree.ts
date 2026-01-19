/**
 * Merkle Tree Builder
 * ===================
 * Builds Poseidon Merkle trees from ledger data.
 */

import { poseidon } from 'poseidon-lite';
import * as fs from 'fs';

export interface MerkleTree {
    root: bigint;
    leaves: bigint[];
    depth: number;
    layers: bigint[][];
}

export interface MerkleProof {
    root: bigint;
    leaf: bigint;
    path: bigint[];
    indices: number[];
}

/**
 * Hash a single value using Poseidon
 */
export function hashLeaf(value: bigint): bigint {
    return poseidon([value]);
}

/**
 * Hash two values using Poseidon
 */
export function hashPair(left: bigint, right: bigint): bigint {
    return poseidon([left, right]);
}

/**
 * Build a Merkle tree from leaves
 */
export function buildTree(values: bigint[], depth: number): MerkleTree {
    const size = 2 ** depth;

    // Pad leaves to power of 2
    const leaves = [...values];
    while (leaves.length < size) {
        leaves.push(0n);
    }

    // Hash all leaves
    const layers: bigint[][] = [];
    layers[0] = leaves.map((v) => hashLeaf(v));

    // Build tree bottom-up
    for (let d = 1; d <= depth; d++) {
        const prevLayer = layers[d - 1];
        const currentLayer: bigint[] = [];

        for (let i = 0; i < prevLayer.length; i += 2) {
            currentLayer.push(hashPair(prevLayer[i], prevLayer[i + 1]));
        }

        layers[d] = currentLayer;
    }

    return {
        root: layers[depth][0],
        leaves,
        depth,
        layers,
    };
}

/**
 * Get Merkle proof for a leaf
 */
export function getProof(tree: MerkleTree, index: number): MerkleProof {
    if (index >= tree.leaves.length) {
        throw new Error(`Index ${index} out of bounds`);
    }

    const path: bigint[] = [];
    const indices: number[] = [];
    let idx = index;

    for (let d = 0; d < tree.depth; d++) {
        const layer = tree.layers[d];
        const siblingIdx = idx % 2 === 0 ? idx + 1 : idx - 1;

        path.push(layer[siblingIdx]);
        indices.push(idx % 2);

        idx = Math.floor(idx / 2);
    }

    return {
        root: tree.root,
        leaf: tree.leaves[index],
        path,
        indices,
    };
}

/**
 * Verify a Merkle proof
 */
export function verifyProof(proof: MerkleProof): boolean {
    let hash = hashLeaf(proof.leaf);

    for (let i = 0; i < proof.path.length; i++) {
        if (proof.indices[i] === 0) {
            hash = hashPair(hash, proof.path[i]);
        } else {
            hash = hashPair(proof.path[i], hash);
        }
    }

    return hash === proof.root;
}

/**
 * Build trees from ledger file
 */
export function buildFromLedger(ledgerPath: string, depth = 20): {
    collateral: MerkleTree;
    liabilities: MerkleTree;
    totals: { collateral: bigint; liabilities: bigint };
} {
    const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf-8'));

    // Extract values as bigints
    const collateralValues = Object.values(ledger.collateral).map((v) =>
        BigInt(v as string)
    );
    const liabilityValues = Object.values(ledger.liabilities).map((v) =>
        BigInt(v as string)
    );

    // Calculate totals
    const totalCollateral = collateralValues.reduce((a, b) => a + b, 0n);
    const totalLiabilities = liabilityValues.reduce((a, b) => a + b, 0n);

    // Build trees with totals as first leaf
    const collateralTree = buildTree([totalCollateral, ...collateralValues], depth);
    const liabilitiesTree = buildTree([totalLiabilities, ...liabilityValues], depth);

    return {
        collateral: collateralTree,
        liabilities: liabilitiesTree,
        totals: {
            collateral: totalCollateral,
            liabilities: totalLiabilities,
        },
    };
}

/**
 * Export tree data for witness generation
 */
export function exportForWitness(tree: MerkleTree, index: number): {
    root: string;
    path: string[];
    indices: number[];
} {
    const proof = getProof(tree, index);

    return {
        root: proof.root.toString(),
        path: proof.path.map((p) => p.toString()),
        indices: proof.indices,
    };
}

// CLI
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'build': {
            const [, ledgerPath, outputPath] = args;
            if (!ledgerPath) {
                console.log('Usage: build <ledger.json> [output.json]');
                process.exit(1);
            }

            const result = buildFromLedger(ledgerPath);

            const output = {
                collateral: {
                    root: result.collateral.root.toString(),
                    total: result.totals.collateral.toString(),
                },
                liabilities: {
                    root: result.liabilities.root.toString(),
                    total: result.totals.liabilities.toString(),
                },
            };

            if (outputPath) {
                fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
                console.log(`Trees saved to: ${outputPath}`);
            } else {
                console.log(JSON.stringify(output, null, 2));
            }
            break;
        }

        case 'proof': {
            const [, ledgerPath, index] = args;
            if (!ledgerPath) {
                console.log('Usage: proof <ledger.json> [index]');
                process.exit(1);
            }

            const result = buildFromLedger(ledgerPath);
            const idx = parseInt(index || '0');

            console.log('Collateral proof:');
            console.log(JSON.stringify(exportForWitness(result.collateral, idx), null, 2));

            console.log('Liabilities proof:');
            console.log(JSON.stringify(exportForWitness(result.liabilities, idx), null, 2));
            break;
        }

        default:
            console.log('Commands:');
            console.log('  build <ledger.json> [output.json]  Build Merkle trees');
            console.log('  proof <ledger.json> [index]        Generate proofs');
    }
}

if (require.main === module) {
    main().catch(console.error);
}
