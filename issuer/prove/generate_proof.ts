/**
 * Proof Generation Module
 * =======================
 * Generates ZK proofs from ledger data and witness.
 */

import * as snarkjs from 'snarkjs';
import * as fs from 'fs';
import * as path from 'path';
import {
    generateSolvencyWitness,
    generateSupplyWitness,
    witnessToJson,
    LedgerData
} from '../../zk/witness/generate_witness';

export interface ProofResult {
    proof: snarkjs.Groth16Proof;
    publicSignals: string[];
    proofJson: string;
}

export interface ProofConfig {
    circuitWasm: string;
    zkeyPath: string;
    outputDir: string;
}

/**
 * Generate Groth16 proof for solvency circuit
 */
export async function generateSolvencyProof(
    ledger: LedgerData,
    policyHash: bigint,
    epoch: bigint,
    minCollateralRatio: bigint,
    config: ProofConfig
): Promise<ProofResult> {
    console.log('Generating solvency witness...');

    // Generate witness
    const witness = generateSolvencyWitness(
        ledger,
        policyHash,
        epoch,
        minCollateralRatio
    );

    // Write witness to temp file
    const witnessJson = witnessToJson(witness);
    const inputPath = path.join(config.outputDir, 'solvency_input.json');
    fs.writeFileSync(inputPath, witnessJson);

    console.log('Computing proof...');

    // Generate proof
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        witness,
        config.circuitWasm,
        config.zkeyPath
    );

    // Format proof for Solidity
    const proofJson = JSON.stringify(proof, null, 2);

    // Save outputs
    fs.writeFileSync(
        path.join(config.outputDir, 'solvency_proof.json'),
        proofJson
    );
    fs.writeFileSync(
        path.join(config.outputDir, 'solvency_public.json'),
        JSON.stringify(publicSignals, null, 2)
    );

    console.log('Solvency proof generated successfully!');

    return { proof, publicSignals, proofJson };
}

/**
 * Generate Groth16 proof for supply circuit
 */
export async function generateSupplyProof(
    ledger: LedgerData,
    policyHash: bigint,
    epoch: bigint,
    config: ProofConfig
): Promise<ProofResult> {
    console.log('Generating supply witness...');

    // Generate witness
    const witness = generateSupplyWitness(ledger, policyHash, epoch);

    // Write witness to temp file
    const witnessJson = witnessToJson(witness);
    const inputPath = path.join(config.outputDir, 'supply_input.json');
    fs.writeFileSync(inputPath, witnessJson);

    console.log('Computing proof...');

    // Generate proof
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        witness,
        config.circuitWasm,
        config.zkeyPath
    );

    const proofJson = JSON.stringify(proof, null, 2);

    // Save outputs
    fs.writeFileSync(
        path.join(config.outputDir, 'supply_proof.json'),
        proofJson
    );
    fs.writeFileSync(
        path.join(config.outputDir, 'supply_public.json'),
        JSON.stringify(publicSignals, null, 2)
    );

    console.log('Supply proof generated successfully!');

    return { proof, publicSignals, proofJson };
}

/**
 * Verify a proof locally before submission
 */
export async function verifyProof(
    proof: snarkjs.Groth16Proof,
    publicSignals: string[],
    vkeyPath: string
): Promise<boolean> {
    const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));
    return await snarkjs.groth16.verify(vkey, publicSignals, proof);
}

/**
 * Generate calldata for on-chain verification
 */
export async function generateCalldata(
    proof: snarkjs.Groth16Proof,
    publicSignals: string[]
): Promise<string> {
    const calldata = await snarkjs.groth16.exportSolidityCallData(
        proof,
        publicSignals
    );
    return calldata;
}

/**
 * Full proof generation pipeline
 */
export async function generateEpochProofs(
    ledgerPath: string,
    epoch: number,
    policyHash: string,
    outputDir: string
): Promise<{
    solvency: ProofResult;
    supply: ProofResult;
    merkleRoots: { collateral: string; liabilities: string };
}> {
    // Load ledger
    const ledger: LedgerData = JSON.parse(
        fs.readFileSync(ledgerPath, 'utf-8'),
        (key, value) => {
            // Convert string numbers to bigint
            if (typeof value === 'string' && /^\d+$/.test(value)) {
                return BigInt(value);
            }
            return value;
        }
    );

    const policyHashBigInt = BigInt(policyHash);
    const epochBigInt = BigInt(epoch);
    const minRatio = BigInt('1500000000000000000'); // 1.5e18 = 150%

    // Create output directory
    const epochDir = path.join(outputDir, `epoch_${epoch}`);
    if (!fs.existsSync(epochDir)) {
        fs.mkdirSync(epochDir, { recursive: true });
    }

    // Generate solvency proof
    const solvency = await generateSolvencyProof(
        ledger,
        policyHashBigInt,
        epochBigInt,
        minRatio,
        {
            circuitWasm: '../zk/build/solvency_js/solvency.wasm',
            zkeyPath: '../zk/keys/solvency.zkey',
            outputDir: epochDir,
        }
    );

    // Generate supply proof
    const supply = await generateSupplyProof(
        ledger,
        policyHashBigInt,
        epochBigInt,
        {
            circuitWasm: '../zk/build/supply_js/supply.wasm',
            zkeyPath: '../zk/keys/supply.zkey',
            outputDir: epochDir,
        }
    );

    // Extract merkle roots from public signals
    const merkleRoots = {
        collateral: solvency.publicSignals[0],
        liabilities: solvency.publicSignals[1],
    };

    console.log(`\nEpoch ${epoch} proofs generated:`);
    console.log(`  Output: ${epochDir}`);
    console.log(`  Collateral root: ${merkleRoots.collateral}`);
    console.log(`  Liabilities root: ${merkleRoots.liabilities}`);

    return { solvency, supply, merkleRoots };
}
