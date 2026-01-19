/**
 * Bittensor API client for querying subnet data.
 */

export interface SubnetStats {
    totalMiners: number;
    totalValidators: number;
    epochsProcessed: number;
    totalProofs: number;
}

export interface IssuerData {
    id: string;
    name: string;
    address: string;
    latestEpoch: number;
    integrityScore: number;
    proofCount: number;
    registeredAt: number;
    isActive: boolean;
}

export interface EpochData {
    epoch: number;
    timestamp: number;
    proofCount: number;
    avgScore: number;
    issuers: string[];
    minerParticipation: number;
}

export interface MinerData {
    uid: number;
    hotkey: string;
    stake: number;
    score: number;
    epochRewards: number;
    totalAnalyses: number;
    isActive: boolean;
}

// In production, these would call actual APIs
const MOCK_DELAY = 100;

/**
 * Fetch subnet statistics
 */
export async function getSubnetStats(): Promise<SubnetStats> {
    await delay(MOCK_DELAY);

    return {
        totalMiners: 156,
        totalValidators: 12,
        epochsProcessed: 142,
        totalProofs: 8472,
    };
}

/**
 * Fetch all issuers
 */
export async function getIssuers(): Promise<IssuerData[]> {
    await delay(MOCK_DELAY);

    return [
        {
            id: 'issuer-001',
            name: 'StableDAO',
            address: '0x1234...5678',
            latestEpoch: 142,
            integrityScore: 0.97,
            proofCount: 142,
            registeredAt: Date.now() - 86400000 * 30,
            isActive: true,
        },
        {
            id: 'issuer-002',
            name: 'ReserveCoin',
            address: '0x2345...6789',
            latestEpoch: 141,
            integrityScore: 0.92,
            proofCount: 138,
            registeredAt: Date.now() - 86400000 * 25,
            isActive: true,
        },
        {
            id: 'issuer-003',
            name: 'TrustUSD',
            address: '0x3456...7890',
            latestEpoch: 140,
            integrityScore: 0.88,
            proofCount: 126,
            registeredAt: Date.now() - 86400000 * 20,
            isActive: true,
        },
    ];
}

/**
 * Fetch issuer by ID
 */
export async function getIssuer(id: string): Promise<IssuerData | null> {
    const issuers = await getIssuers();
    return issuers.find(i => i.id === id) || null;
}

/**
 * Fetch epoch data
 */
export async function getEpoch(epochNumber: number): Promise<EpochData | null> {
    await delay(MOCK_DELAY);

    if (epochNumber < 1 || epochNumber > 142) {
        return null;
    }

    return {
        epoch: epochNumber,
        timestamp: Date.now() - (142 - epochNumber) * 3600000,
        proofCount: Math.floor(Math.random() * 20) + 5,
        avgScore: 0.90 + Math.random() * 0.08,
        issuers: ['issuer-001', 'issuer-002', 'issuer-003'],
        minerParticipation: Math.floor(Math.random() * 40) + 100,
    };
}

/**
 * Fetch recent epochs
 */
export async function getRecentEpochs(count: number = 10): Promise<EpochData[]> {
    await delay(MOCK_DELAY);

    return Array.from({ length: count }, (_, i) => ({
        epoch: 142 - i,
        timestamp: Date.now() - i * 3600000,
        proofCount: Math.floor(Math.random() * 20) + 5,
        avgScore: 0.90 + Math.random() * 0.08,
        issuers: ['issuer-001', 'issuer-002'],
        minerParticipation: Math.floor(Math.random() * 40) + 100,
    }));
}

/**
 * Fetch top miners
 */
export async function getTopMiners(limit: number = 10): Promise<MinerData[]> {
    await delay(MOCK_DELAY);

    return Array.from({ length: limit }, (_, i) => ({
        uid: [1, 7, 23, 4, 15, 9, 31, 12, 45, 8][i] || i,
        hotkey: `5D${Math.random().toString(36).slice(2, 10)}...`,
        stake: Math.random() * 100 + 50,
        score: 0.98 - i * 0.02,
        epochRewards: 12.5 - i * 1.2,
        totalAnalyses: 342 - i * 20,
        isActive: true,
    }));
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
