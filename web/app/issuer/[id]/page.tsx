'use client';

import { motion } from 'motion/react';
import { use } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';

interface PageProps {
    params: Promise<{ id: string }>;
}

// Mock issuer data
const mockIssuers: Record<string, {
    id: string;
    name: string;
    address: string;
    score: number;
    proofHistory: { epoch: number; score: number; timestamp: number }[];
}> = {
    'issuer-001': {
        id: 'issuer-001',
        name: 'StableDAO',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        score: 0.97,
        proofHistory: Array.from({ length: 20 }, (_, i) => ({
            epoch: 142 - i,
            score: 0.95 + Math.random() * 0.04,
            timestamp: Date.now() - i * 3600000,
        })),
    },
    'issuer-002': {
        id: 'issuer-002',
        name: 'ReserveCoin',
        address: '0x2345678901bcdef12345678901bcdef123456789',
        score: 0.92,
        proofHistory: Array.from({ length: 18 }, (_, i) => ({
            epoch: 141 - i,
            score: 0.88 + Math.random() * 0.06,
            timestamp: Date.now() - i * 3600000 - 3600000,
        })),
    },
    'issuer-003': {
        id: 'issuer-003',
        name: 'TrustUSD',
        address: '0x3456789012cdef123456789012cdef1234567890',
        score: 0.88,
        proofHistory: Array.from({ length: 15 }, (_, i) => ({
            epoch: 140 - i,
            score: 0.82 + Math.random() * 0.08,
            timestamp: Date.now() - i * 3600000 - 7200000,
        })),
    },
};

export default function IssuerPage({ params }: PageProps) {
    const { id } = use(params);
    const issuer = mockIssuers[id];

    if (!issuer) {
        return (
            <main className="min-h-screen">
                <Header />
                <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: 'var(--spacing-md)' }}>Issuer Not Found</h1>
                    <Link href="/" style={{ color: 'var(--accent-green)' }}>← Back to Dashboard</Link>
                </div>
            </main>
        );
    }

    const scorePercent = issuer.score * 100;
    const scoreClass =
        scorePercent >= 95 ? 'score-excellent' :
            scorePercent >= 85 ? 'score-good' :
                scorePercent >= 70 ? 'score-warning' : 'score-critical';

    return (
        <main className="min-h-screen">
            <Header />

            <div className="container" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-2xl)' }}>
                {/* Back link */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ marginBottom: 'var(--spacing-lg)' }}
                >
                    <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        ← Back to Dashboard
                    </Link>
                </motion.div>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-lg)',
                        marginBottom: 'var(--spacing-xl)'
                    }}
                >
                    <div style={{
                        width: 80,
                        height: 80,
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--gradient-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        fontWeight: 700,
                    }}>
                        {issuer.name[0]}
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>{issuer.name}</h1>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {issuer.address}
                        </div>
                    </div>
                </motion.div>

                {/* Main Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 'var(--spacing-lg)' }}>
                    {/* Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-sm)' }}>
                                Integrity Score
                            </div>
                            <div style={{
                                fontSize: '4rem',
                                fontWeight: 700,
                                lineHeight: 1.1,
                                marginBottom: 'var(--spacing-sm)'
                            }} className={scoreClass}>
                                {scorePercent.toFixed(1)}
                            </div>
                            <div style={{
                                padding: 'var(--spacing-xs) var(--spacing-sm)',
                                borderRadius: 'var(--radius-full)',
                                background: scorePercent >= 95 ? 'rgba(0, 212, 170, 0.15)' :
                                    scorePercent >= 85 ? 'rgba(59, 130, 246, 0.15)' :
                                        'rgba(234, 179, 8, 0.15)',
                                color: scorePercent >= 95 ? 'var(--accent-green)' :
                                    scorePercent >= 85 ? 'var(--accent-blue)' :
                                        'var(--accent-yellow)',
                                fontSize: '0.8rem',
                                display: 'inline-block',
                            }}>
                                {scorePercent >= 95 ? 'Excellent' : scorePercent >= 85 ? 'Good' : 'Warning'}
                            </div>
                        </div>

                        <div className="card" style={{ marginTop: 'var(--spacing-md)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Proofs</span>
                                <span style={{ fontWeight: 600 }}>{issuer.proofHistory.length}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Latest Epoch</span>
                                <span style={{ fontWeight: 600 }}>{issuer.proofHistory[0]?.epoch}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Status</span>
                                <span style={{ color: 'var(--accent-green)' }}>● Active</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Proof History */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                            Proof History
                        </h2>
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            {issuer.proofHistory.slice(0, 10).map((proof, i) => (
                                <motion.div
                                    key={proof.epoch}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + i * 0.03 }}
                                    whileHover={{ background: 'var(--bg-card-hover)' }}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: 'var(--spacing-md) var(--spacing-lg)',
                                        borderBottom: i < 9 ? '1px solid var(--border-color)' : 'none',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 500 }}>Epoch {proof.epoch}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {new Date(proof.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                    <div style={{
                                        fontWeight: 600,
                                        color: proof.score >= 0.95 ? 'var(--accent-green)' :
                                            proof.score >= 0.85 ? 'var(--accent-blue)' : 'var(--accent-yellow)'
                                    }}>
                                        {(proof.score * 100).toFixed(1)}%
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
