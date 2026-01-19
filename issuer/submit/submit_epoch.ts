/**
 * Epoch Submission Module
 * =======================
 * Submits epoch proofs to the on-chain IntegrityRegistry.
 */

import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

// Contract ABIs (would be generated from compilation)
const INTEGRITY_REGISTRY_ABI = [
    'function submitProof(uint256 epoch, bytes32 merkleRoot, bytes proof, uint256[] publicInputs)',
    'function latestEpoch(address issuer) view returns (uint256)',
    'function isRegisteredIssuer(address) view returns (bool)',
    'function registerIssuer()',
    'event IntegrityProven(address indexed issuer, uint256 indexed epoch, bytes32 merkleRoot, bytes32 proofHash, uint256 timestamp)',
];

export interface SubmissionConfig {
    rpcUrl: string;
    privateKey: string;
    registryAddress: string;
    chainId: number;
}

export interface EpochSubmission {
    epoch: number;
    merkleRoot: string;  // bytes32 hex string
    proof: Uint8Array;
    publicInputs: bigint[];
}

export class EpochSubmitter {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private registry: ethers.Contract;

    constructor(config: SubmissionConfig) {
        this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
        this.wallet = new ethers.Wallet(config.privateKey, this.provider);
        this.registry = new ethers.Contract(
            config.registryAddress,
            INTEGRITY_REGISTRY_ABI,
            this.wallet
        );
    }

    /**
     * Check if issuer is registered
     */
    async isRegistered(): Promise<boolean> {
        return await this.registry.isRegisteredIssuer(this.wallet.address);
    }

    /**
     * Register as an issuer
     */
    async register(): Promise<string> {
        const tx = await this.registry.registerIssuer();
        const receipt = await tx.wait();
        console.log(`Registered as issuer. TX: ${receipt.hash}`);
        return receipt.hash;
    }

    /**
     * Get latest submitted epoch
     */
    async getLatestEpoch(): Promise<number> {
        const latest = await this.registry.latestEpoch(this.wallet.address);
        return Number(latest);
    }

    /**
     * Submit an epoch proof
     */
    async submitEpoch(submission: EpochSubmission): Promise<string> {
        // Verify epoch is sequential
        const latestEpoch = await this.getLatestEpoch();
        if (submission.epoch !== latestEpoch + 1) {
            throw new Error(
                `Invalid epoch ${submission.epoch}. Expected ${latestEpoch + 1}`
            );
        }

        console.log(`Submitting proof for epoch ${submission.epoch}...`);

        // Convert proof to bytes
        const proofBytes = ethers.hexlify(submission.proof);

        // Convert public inputs to uint256[]
        const publicInputs = submission.publicInputs.map((x) => x.toString());

        // Submit transaction
        const tx = await this.registry.submitProof(
            submission.epoch,
            submission.merkleRoot,
            proofBytes,
            publicInputs
        );

        console.log(`TX submitted: ${tx.hash}`);

        // Wait for confirmation
        const receipt = await tx.wait();

        if (receipt.status === 0) {
            throw new Error('Transaction reverted');
        }

        console.log(`Epoch ${submission.epoch} submitted successfully!`);
        console.log(`  Block: ${receipt.blockNumber}`);
        console.log(`  Gas used: ${receipt.gasUsed}`);

        return receipt.hash;
    }

    /**
     * Submit epoch from proof files
     */
    async submitFromFiles(
        epoch: number,
        proofPath: string,
        publicInputsPath: string,
        merkleRoot: string
    ): Promise<string> {
        // Read proof bytes
        const proofData = fs.readFileSync(proofPath);

        // Read public inputs
        const publicInputsJson = JSON.parse(
            fs.readFileSync(publicInputsPath, 'utf-8')
        );
        const publicInputs = publicInputsJson.map((x: string) => BigInt(x));

        return await this.submitEpoch({
            epoch,
            merkleRoot,
            proof: proofData,
            publicInputs,
        });
    }
}

/**
 * CLI entry point
 */
async function main() {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.log('Usage: submit_epoch.ts <command> [args]');
        console.log('Commands:');
        console.log('  register              Register as issuer');
        console.log('  status                Get current status');
        console.log('  submit <epoch>        Submit epoch proof');
        process.exit(1);
    }

    // Load config from environment
    const config: SubmissionConfig = {
        rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
        privateKey: process.env.ISSUER_PRIVATE_KEY || '',
        registryAddress: process.env.REGISTRY_ADDRESS || '',
        chainId: parseInt(process.env.CHAIN_ID || '1'),
    };

    if (!config.privateKey) {
        console.error('ISSUER_PRIVATE_KEY not set');
        process.exit(1);
    }

    const submitter = new EpochSubmitter(config);
    const command = args[0];

    switch (command) {
        case 'register':
            await submitter.register();
            break;

        case 'status':
            const isRegistered = await submitter.isRegistered();
            const latestEpoch = await submitter.getLatestEpoch();
            console.log(`Registered: ${isRegistered}`);
            console.log(`Latest epoch: ${latestEpoch}`);
            break;

        case 'submit':
            const epoch = parseInt(args[1]);
            const proofPath = args[2] || `./proofs/epoch_${epoch}/proof.json`;
            const inputsPath = args[3] || `./proofs/epoch_${epoch}/public.json`;
            const merkleRoot = args[4] || '0x' + '0'.repeat(64);

            await submitter.submitFromFiles(epoch, proofPath, inputsPath, merkleRoot);
            break;

        default:
            console.error(`Unknown command: ${command}`);
            process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
