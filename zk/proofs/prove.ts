/**
 * Proof Generation CLI
 * ====================
 * Generates Groth16 proofs using snarkjs.
 */

import * as snarkjs from 'snarkjs';
import * as fs from 'fs';
import * as path from 'path';

export interface ProofOutput {
    proof: object;
    publicSignals: string[];
}

/**
 * Generate a Groth16 proof
 */
export async function generateProof(
    wasmPath: string,
    zkeyPath: string,
    inputPath: string,
    outputDir: string
): Promise<ProofOutput> {
    console.log('Loading input...');
    const input = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

    console.log('Generating proof...');
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        wasmPath,
        zkeyPath
    );

    // Save proof
    const proofPath = path.join(outputDir, 'proof.json');
    fs.writeFileSync(proofPath, JSON.stringify(proof, null, 2));
    console.log(`Proof saved to: ${proofPath}`);

    // Save public signals
    const publicPath = path.join(outputDir, 'public.json');
    fs.writeFileSync(publicPath, JSON.stringify(publicSignals, null, 2));
    console.log(`Public signals saved to: ${publicPath}`);

    return { proof, publicSignals };
}

/**
 * Verify a proof locally
 */
export async function verifyProof(
    vkeyPath: string,
    proofPath: string,
    publicPath: string
): Promise<boolean> {
    const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));
    const proof = JSON.parse(fs.readFileSync(proofPath, 'utf-8'));
    const publicSignals = JSON.parse(fs.readFileSync(publicPath, 'utf-8'));

    console.log('Verifying proof...');
    const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);

    console.log(`Verification result: ${isValid ? 'VALID' : 'INVALID'}`);
    return isValid;
}

/**
 * Export Solidity calldata for on-chain verification
 */
export async function exportCalldata(
    proofPath: string,
    publicPath: string
): Promise<string> {
    const proof = JSON.parse(fs.readFileSync(proofPath, 'utf-8'));
    const publicSignals = JSON.parse(fs.readFileSync(publicPath, 'utf-8'));

    const calldata = await snarkjs.groth16.exportSolidityCallData(
        proof,
        publicSignals
    );

    return calldata;
}

// CLI
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'prove': {
            const [, circuit, inputPath, outputDir] = args;
            if (!circuit || !inputPath) {
                console.log('Usage: prove <circuit> <input.json> [outputDir]');
                console.log('Example: prove solvency ./input.json ./output');
                process.exit(1);
            }

            const wasmPath = `./build/${circuit}_js/${circuit}.wasm`;
            const zkeyPath = `./keys/${circuit}.zkey`;
            const outDir = outputDir || './output';

            if (!fs.existsSync(outDir)) {
                fs.mkdirSync(outDir, { recursive: true });
            }

            await generateProof(wasmPath, zkeyPath, inputPath, outDir);
            break;
        }

        case 'verify': {
            const [, circuit, proofDir] = args;
            if (!circuit) {
                console.log('Usage: verify <circuit> [proofDir]');
                process.exit(1);
            }

            const dir = proofDir || './output';
            const vkeyPath = `./keys/${circuit}_vkey.json`;

            const isValid = await verifyProof(
                vkeyPath,
                path.join(dir, 'proof.json'),
                path.join(dir, 'public.json')
            );

            process.exit(isValid ? 0 : 1);
        }

        case 'calldata': {
            const [, proofDir] = args;
            const dir = proofDir || './output';

            const calldata = await exportCalldata(
                path.join(dir, 'proof.json'),
                path.join(dir, 'public.json')
            );

            console.log('Solidity calldata:');
            console.log(calldata);
            break;
        }

        default:
            console.log('Commands:');
            console.log('  prove <circuit> <input.json> [outputDir]');
            console.log('  verify <circuit> [proofDir]');
            console.log('  calldata [proofDir]');
    }
}

if (require.main === module) {
    main().catch(console.error);
}
