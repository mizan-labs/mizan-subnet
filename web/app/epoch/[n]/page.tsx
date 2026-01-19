'use client';

import { motion } from 'motion/react';
import { use } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';

interface PageProps {
    params: Promise<{ n: string }>;
}

export default function EpochPage({ params }: PageProps) {
    const { n } = use(params);
    const epochNumber = parseInt(n);

    if (isNaN(epochNumber) || epochNumber < 1 || epochNumber > 142) {
        return (
            <main className="min-h-screen">
                <Header />
                <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: 'var(--spacing-md)' }}>Epoch Not Found</h1>
                    <Link href="/" style={{ color: 'var(--accent-green)' }}>← Back to Dashboard</Link>
                </div>
            </main>
        );
    }

    // Mock epoch data
    const epoch = {
        number: epochNumber,
        timestamp: Date.now() - (142 - epochNumber) * 3600000,
        proofs: [
            { issuer: 'StableDAO', score: 0.97, merkleRoot: '0x1234...5678' },
            { issuer: 'ReserveCoin', score: 0.92, merkleRoot: '0x2345...6789' },
            { issuer: 'TrustUSD', score: 0.88, merkleRoot: '0x3456...7890' },
        ],
        minerCount: 142,
        avgScore: 0.92,
        policyHash: '0xabcd...ef01',
    };

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
                    style={{ marginBottom: 'var(--spacing-xl)' }}
                >
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
                        Epoch <span className="gradient-text">{epochNumber}</span>
                    </h1>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        {new Date(epoch.timestamp).toLocaleString()}
                    </div>
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: 'var(--spacing-md)',
                        marginBottom: 'var(--spacing-xl)'
                    }}
                >
                    <div className="card">
                        <div style={{ fontSize: '2rem', fontWeight: 700 }}>{epoch.proofs.length}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Proofs Submitted</div>
                    </div>
                    <div className="card">
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                            {(epoch.avgScore * 100).toFixed(1)}%
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Average Score</div>
                    </div>
                    <div className="card">
                        <div style={{ fontSize: '2rem', fontWeight: 700 }}>{epoch.minerCount}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Miners Participated</div>
                    </div>
                    <div className="card">
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, fontFamily: 'monospace' }}>{epoch.policyHash}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Policy Hash</div>
                    </div>
                </motion.div>

                {/* Proofs Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                        Proofs
                    </h2>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        {/* Header */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 120px 1fr',
                            gap: 'var(--spacing-md)',
                            padding: 'var(--spacing-md) var(--spacing-lg)',
                            background: 'var(--bg-secondary)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                        }}>
                            <div>Issuer</div>
                            <div style={{ textAlign: 'center' }}>Score</div>
                            <div style={{ textAlign: 'right' }}>Merkle Root</div>
                        </div>

                        {/* Rows */}
                        {epoch.proofs.map((proof, i) => (
                            <motion.div
                                key={proof.issuer}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + i * 0.05 }}
                                whileHover={{ background: 'var(--bg-card-hover)' }}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 120px 1fr',
                                    gap: 'var(--spacing-md)',
                                    padding: 'var(--spacing-md) var(--spacing-lg)',
                                    borderTop: '1px solid var(--border-color)',
                                    cursor: 'pointer',
                                }}
                            >
                                <div style={{ fontWeight: 500 }}>{proof.issuer}</div>
                                <div style={{
                                    textAlign: 'center',
                                    fontWeight: 600,
                                    color: proof.score >= 0.95 ? 'var(--accent-green)' :
                                        proof.score >= 0.85 ? 'var(--accent-blue)' : 'var(--accent-yellow)'
                                }}>
                                    {(proof.score * 100).toFixed(1)}%
                                </div>
                                <div style={{ textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                    {proof.merkleRoot}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Navigation */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: 'var(--spacing-xl)'
                    }}
                >
                    {epochNumber > 1 ? (
                        <Link
                            href={`/epoch/${epochNumber - 1}`}
                            style={{ color: 'var(--accent-green)' }}
                        >
                            ← Epoch {epochNumber - 1}
                        </Link>
                    ) : <span />}
                    {epochNumber < 142 && (
                        <Link
                            href={`/epoch/${epochNumber + 1}`}
                            style={{ color: 'var(--accent-green)' }}
                        >
                            Epoch {epochNumber + 1} →
                        </Link>
                    )}
                </motion.div>
            </div>
        </main>
    );
}
