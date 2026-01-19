'use client';

import { motion } from 'motion/react';

interface Miner {
    uid: number;
    score: number;
    rewards: number;
    analyses: number;
}

interface MinerRankingTableProps {
    miners: Miner[];
}

export default function MinerRankingTable({ miners }: MinerRankingTableProps) {
    return (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
            {/* Header */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 100px 100px 100px',
                gap: 'var(--spacing-md)',
                padding: 'var(--spacing-md) var(--spacing-lg)',
                background: 'var(--bg-secondary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
            }}>
                <div>Rank</div>
                <div>Miner</div>
                <div style={{ textAlign: 'right' }}>Score</div>
                <div style={{ textAlign: 'right' }}>Rewards</div>
                <div style={{ textAlign: 'right' }}>Analyses</div>
            </div>

            {/* Rows */}
            {miners.map((miner, i) => (
                <motion.div
                    key={miner.uid}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    whileHover={{ background: 'var(--bg-card-hover)' }}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '60px 1fr 100px 100px 100px',
                        gap: 'var(--spacing-md)',
                        padding: 'var(--spacing-md) var(--spacing-lg)',
                        borderTop: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                    }}
                >
                    {/* Rank */}
                    <div>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 28,
                            height: 28,
                            borderRadius: 'var(--radius-sm)',
                            background: i === 0 ? 'var(--gradient-primary)' :
                                i === 1 ? 'linear-gradient(135deg, #9ca3af, #6b7280)' :
                                    i === 2 ? 'linear-gradient(135deg, #d97706, #b45309)' :
                                        'var(--bg-secondary)',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                        }}>
                            {i + 1}
                        </span>
                    </div>

                    {/* Miner Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 'var(--radius-sm)',
                            background: `hsl(${miner.uid * 30}, 60%, 40%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                        }}>
                            {miner.uid}
                        </div>
                        <div>
                            <div style={{ fontWeight: 500 }}>Miner #{miner.uid}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Active
                            </div>
                        </div>
                    </div>

                    {/* Score */}
                    <div style={{
                        textAlign: 'right',
                        fontWeight: 600,
                        color: miner.score >= 0.95 ? 'var(--accent-green)' :
                            miner.score >= 0.85 ? 'var(--accent-blue)' : 'var(--text-primary)'
                    }}>
                        {(miner.score * 100).toFixed(1)}%
                    </div>

                    {/* Rewards */}
                    <div style={{ textAlign: 'right', fontWeight: 500 }}>
                        <span style={{ color: 'var(--accent-green)' }}>+</span>
                        {miner.rewards.toFixed(1)} τ
                    </div>

                    {/* Analyses */}
                    <div style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {miner.analyses}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
