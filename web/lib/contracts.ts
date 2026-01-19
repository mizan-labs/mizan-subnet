/**
 * Contract interaction utilities.
 */

import { ethers } from 'ethers';

const INTEGRITY_REGISTRY_ABI = [
    'function latestEpoch(address issuer) view returns (uint256)',
    'function getEpochRecord(address issuer, uint256 epoch) view returns (tuple(uint256 epoch, bytes32 merkleRoot, bytes32 proofHash, address issuer, uint256 timestamp, bool verified))',
    'function isRegisteredIssuer(address) view returns (bool)',
    'event IntegrityProven(address indexed issuer, uint256 indexed epoch, bytes32 merkleRoot, bytes32 proofHash, uint256 timestamp)',
];

const POLICY_REGISTRY_ABI = [
    'function activePolicy() view returns (bytes32)',
    'function getActivePolicy() view returns (tuple(bytes32 policyHash, uint256 version, uint256 minCollateralRatio, uint256 maxCollateralRatio, uint256 minSupplyCoverage, uint256 epochDeadlineSeconds, bool isActive, uint256 createdAt))',
    'function getPolicyCount() view returns (uint256)',
];

export interface ContractConfig {
    rpcUrl: string;
    integrityRegistry: string;
    policyRegistry: string;
    epochManager: string;
}

export interface EpochRecord {
    epoch: number;
    merkleRoot: string;
    proofHash: string;
    issuer: string;
    timestamp: number;
    verified: boolean;
}

export interface PolicyInfo {
    policyHash: string;
    version: number;
    minCollateralRatio: number;
    maxCollateralRatio: number;
    minSupplyCoverage: number;
    epochDeadlineSeconds: number;
    isActive: boolean;
    createdAt: number;
}

export class ContractClient {
    private provider: ethers.JsonRpcProvider;
    private integrityRegistry: ethers.Contract;
    private policyRegistry: ethers.Contract;

    constructor(config: ContractConfig) {
        this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
        this.integrityRegistry = new ethers.Contract(
            config.integrityRegistry,
            INTEGRITY_REGISTRY_ABI,
            this.provider
        );
        this.policyRegistry = new ethers.Contract(
            config.policyRegistry,
            POLICY_REGISTRY_ABI,
            this.provider
        );
    }

    async getLatestEpoch(issuer: string): Promise<number> {
        return Number(await this.integrityRegistry.latestEpoch(issuer));
    }

    async getEpochRecord(issuer: string, epoch: number): Promise<EpochRecord> {
        const record = await this.integrityRegistry.getEpochRecord(issuer, epoch);
        return {
            epoch: Number(record.epoch),
            merkleRoot: record.merkleRoot,
            proofHash: record.proofHash,
            issuer: record.issuer,
            timestamp: Number(record.timestamp) * 1000,
            verified: record.verified,
        };
    }

    async isRegisteredIssuer(address: string): Promise<boolean> {
        return await this.integrityRegistry.isRegisteredIssuer(address);
    }

    async getActivePolicy(): Promise<PolicyInfo> {
        const policy = await this.policyRegistry.getActivePolicy();
        return {
            policyHash: policy.policyHash,
            version: Number(policy.version),
            minCollateralRatio: Number(policy.minCollateralRatio) / 1e18,
            maxCollateralRatio: Number(policy.maxCollateralRatio) / 1e18,
            minSupplyCoverage: Number(policy.minSupplyCoverage) / 1e18,
            epochDeadlineSeconds: Number(policy.epochDeadlineSeconds),
            isActive: policy.isActive,
            createdAt: Number(policy.createdAt) * 1000,
        };
    }

    async getPolicyCount(): Promise<number> {
        return Number(await this.policyRegistry.getPolicyCount());
    }

    // Listen for new proofs
    onIntegrityProven(
        callback: (issuer: string, epoch: number, merkleRoot: string, timestamp: number) => void
    ): void {
        this.integrityRegistry.on(
            'IntegrityProven',
            (issuer, epoch, merkleRoot, proofHash, timestamp) => {
                callback(issuer, Number(epoch), merkleRoot, Number(timestamp) * 1000);
            }
        );
    }

    removeAllListeners(): void {
        this.integrityRegistry.removeAllListeners();
    }
}

// Default config for development
export const defaultConfig: ContractConfig = {
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545',
    integrityRegistry: process.env.NEXT_PUBLIC_INTEGRITY_REGISTRY || '0x0',
    policyRegistry: process.env.NEXT_PUBLIC_POLICY_REGISTRY || '0x0',
    epochManager: process.env.NEXT_PUBLIC_EPOCH_MANAGER || '0x0',
};
