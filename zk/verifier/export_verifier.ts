/**
 * Verifier Export
 * ===============
 * Exports Solidity verifier from circuit zkey.
 */

import * as snarkjs from 'snarkjs';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Export Solidity verifier contract from zkey
 */
export async function exportVerifier(
    zkeyPath: string,
    outputPath: string,
    contractName = 'Groth16Verifier'
): Promise<void> {
    console.log(`Exporting verifier from: ${zkeyPath}`);

    // Generate Solidity code
    const solidityCode = await snarkjs.zKey.exportSolidityVerifier(
        zkeyPath,
        { groth16: true }
    );

    // Replace contract name if needed
    let code = solidityCode;
    if (contractName !== 'Verifier') {
        code = code.replace(/contract Verifier/g, `contract ${contractName}`);
    }

    // Write to file
    fs.writeFileSync(outputPath, code);
    console.log(`Verifier exported to: ${outputPath}`);
}

/**
 * Export verification key as JSON
 */
export async function exportVkey(
    zkeyPath: string,
    outputPath: string
): Promise<void> {
    console.log(`Exporting vkey from: ${zkeyPath}`);

    const vkey = await snarkjs.zKey.exportVerificationKey(zkeyPath);
    fs.writeFileSync(outputPath, JSON.stringify(vkey, null, 2));
    console.log(`Vkey exported to: ${outputPath}`);
}

// CLI
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'solidity': {
            const [, circuit, outputPath] = args;
            if (!circuit) {
                console.log('Usage: solidity <circuit> [outputPath]');
                process.exit(1);
            }

            const zkeyPath = `./keys/${circuit}.zkey`;
            const outPath = outputPath || `../contracts/verifier/${circuit}Verifier.sol`;

            await exportVerifier(zkeyPath, outPath, `${circuit.charAt(0).toUpperCase() + circuit.slice(1)}Verifier`);
            break;
        }

        case 'vkey': {
            const [, circuit, outputPath] = args;
            if (!circuit) {
                console.log('Usage: vkey <circuit> [outputPath]');
                process.exit(1);
            }

            const zkeyPath = `./keys/${circuit}.zkey`;
            const outPath = outputPath || `./keys/${circuit}_vkey.json`;

            await exportVkey(zkeyPath, outPath);
            break;
        }

        case 'all': {
            const circuits = ['solvency', 'supply', 'risk_bounds', 'epoch'];

            for (const circuit of circuits) {
                const zkeyPath = `./keys/${circuit}.zkey`;
                if (!fs.existsSync(zkeyPath)) {
                    console.log(`Skipping ${circuit}: zkey not found`);
                    continue;
                }

                await exportVerifier(
                    zkeyPath,
                    `../contracts/verifier/${circuit}Verifier.sol`,
                    `${circuit.charAt(0).toUpperCase() + circuit.slice(1)}Verifier`
                );
                await exportVkey(zkeyPath, `./keys/${circuit}_vkey.json`);
            }
            break;
        }

        default:
            console.log('Commands:');
            console.log('  solidity <circuit> [outputPath]  Export Solidity verifier');
            console.log('  vkey <circuit> [outputPath]      Export verification key');
            console.log('  all                              Export all circuits');
    }
}

if (require.main === module) {
    main().catch(console.error);
}
