'use client';

import { motion, AnimatePresence } from 'motion/react';
import IntegrityScoreCard from '@/components/IntegrityScoreCard';
import EpochTimeline from '@/components/EpochTimeline';
import MinerRankingTable from '@/components/MinerRankingTable';
import StatsGrid from '@/components/StatsGrid';
import Header from '@/components/Header';

// Mock data - would come from API
// Using static timestamps for hydration consistency (e.g., relative to a fixed point or just hardcoded)
const NOW = 1705600000000; // Fixed timestamp

const mockIssuers = [
    {
        id: 'issuer-001',
        name: 'StableDAO',
        score: 0.97,
        epoch: 142,
        lastProof: NOW - 3600000,
        trend: 'up' as const,
    },
    {
        id: 'issuer-002',
        name: 'ReserveCoin',
        score: 0.92,
        epoch: 141,
        lastProof: NOW - 7200000,
        trend: 'stable' as const,
    },
    {
        id: 'issuer-003',
        name: 'TrustUSD',
        score: 0.88,
        epoch: 140,
        lastProof: NOW - 10800000,
        trend: 'down' as const,
    },
];

const mockStats = {
    totalIssuers: 12,
    avgIntegrity: 0.94,
    proofsPast24h: 847,
    activeMiners: 156,
};

const mockEpochs = [
    { epoch: 142, timestamp: NOW, proofs: 12, avgScore: 0.98 },
    { epoch: 141, timestamp: NOW - 3600000, proofs: 15, avgScore: 0.96 },
    { epoch: 140, timestamp: NOW - 7200000, proofs: 8, avgScore: 0.94 },
    { epoch: 139, timestamp: NOW - 10800000, proofs: 18, avgScore: 0.95 },
    { epoch: 138, timestamp: NOW - 14400000, proofs: 10, avgScore: 0.92 },
    { epoch: 137, timestamp: NOW - 18000000, proofs: 14, avgScore: 0.93 },
    { epoch: 136, timestamp: NOW - 21600000, proofs: 9, avgScore: 0.91 },
    { epoch: 135, timestamp: NOW - 25200000, proofs: 20, avgScore: 0.97 },
    { epoch: 134, timestamp: NOW - 28800000, proofs: 11, avgScore: 0.90 },
    { epoch: 133, timestamp: NOW - 32400000, proofs: 13, avgScore: 0.89 },
];

const mockMiners = [
    { uid: 1, score: 0.98, rewards: 12.5, analyses: 342 },
    { uid: 7, score: 0.96, rewards: 11.2, analyses: 318 },
    { uid: 23, score: 0.94, rewards: 9.8, analyses: 298 },
    { uid: 4, score: 0.92, rewards: 8.4, analyses: 276 },
    { uid: 15, score: 0.89, rewards: 6.2, analyses: 245 },
];

export default function Home() {
    return (
        <main className="min-h-screen">
            <Header />

            <div className="container" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-2xl)' }}>
                {/* Hero Section */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}
                >
                    <h1 style={{
                        fontSize: '3rem',
                        fontWeight: 700,
                        marginBottom: 'var(--spacing-md)',
                        lineHeight: 1.2
                    }}>
                        <span className="gradient-text">Zero-Knowledge</span> Stablecoin Integrity
                    </h1>
                    <p style={{
                        fontSize: '1.25rem',
                        color: 'var(--text-secondary)',
                        maxWidth: '600px',
                        margin: '0 auto'
                    }}>
                        Transparent verification without exposing private data.
                        Powered by ZK proofs and Bittensor intelligence.
                    </p>
                </motion.section>

                {/* Stats Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    <StatsGrid stats={mockStats} />
                </motion.div>

                {/* Main Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                    gap: 'var(--spacing-lg)',
                    marginTop: 'var(--spacing-xl)'
                }}>
                    {/* Issuer Scores */}
                    <motion.section
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <h2 style={{
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            marginBottom: 'var(--spacing-md)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-sm)'
                        }}>
                            <span style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: 'var(--accent-green)',
                                boxShadow: '0 0 10px var(--accent-green)'
                            }} />
                            Live Integrity Scores
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            <AnimatePresence>
                                {mockIssuers.map((issuer, i) => (
                                    <motion.div
                                        key={issuer.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 + i * 0.1 }}
                                    >
                                        <IntegrityScoreCard issuer={issuer} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </motion.section>

                    {/* Epoch Timeline */}
                    <motion.section
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <h2 style={{
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            marginBottom: 'var(--spacing-md)'
                        }}>
                            Recent Epochs
                        </h2>
                        <EpochTimeline epochs={mockEpochs} />
                    </motion.section>
                </div>

                {/* Miner Rankings */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    style={{ marginTop: 'var(--spacing-xl)' }}
                >
                    <h2 style={{
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        marginBottom: 'var(--spacing-md)'
                    }}>
                        Top Miners
                    </h2>
                    <MinerRankingTable miners={mockMiners} />
                </motion.section>
            </div>
        </main>
    );
}
