'use client';

import { motion } from 'motion/react';
import Link from 'next/link';

interface Issuer {
    id: string;
    name: string;
    score: number;
    epoch: number;
    lastProof: number;
    trend: 'up' | 'down' | 'stable';
}

interface IntegrityScoreCardProps {
    issuer: Issuer;
}

export default function IntegrityScoreCard({ issuer }: IntegrityScoreCardProps) {
    const scorePercent = issuer.score * 100;
    const scoreClass =
        scorePercent >= 95 ? 'score-excellent' :
            scorePercent >= 85 ? 'score-good' :
                scorePercent >= 70 ? 'score-warning' : 'score-critical';

    const trendIcon = {
        up: '↑',
        down: '↓',
        stable: '→',
    }[issuer.trend];

    const trendColor = {
        up: 'var(--accent-green)',
        down: 'var(--accent-red)',
        stable: 'var(--text-muted)',
    }[issuer.trend];

    const timeAgo = formatTimeAgo(issuer.lastProof);

    return (
        <Link href={`/issuer/${issuer.id}`}>
            <motion.div
                whileHover={{ scale: 1.01, x: 4 }}
                whileTap={{ scale: 0.99 }}
                className="card"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-md)',
                    cursor: 'pointer',
                }}
            >
                {/* Score Ring */}
                <div style={{ position: 'relative', width: 64, height: 64 }}>
                    <svg width="64" height="64" viewBox="0 0 64 64">
                        {/* Background ring */}
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            fill="none"
                            stroke="var(--bg-secondary)"
                            strokeWidth="6"
                        />
                        {/* Score ring */}
                        <motion.circle
                            cx="32"
                            cy="32"
                            r="28"
                            fill="none"
                            stroke={scorePercent >= 95 ? 'var(--accent-green)' :
                                scorePercent >= 85 ? 'var(--accent-blue)' :
                                    scorePercent >= 70 ? 'var(--accent-yellow)' : 'var(--accent-red)'}
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={`${issuer.score * 176} 176`}
                            initial={{ strokeDasharray: '0 176' }}
                            animate={{ strokeDasharray: `${issuer.score * 176} 176` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            style={{
                                transform: 'rotate(-90deg)',
                                transformOrigin: '50% 50%',
                            }}
                        />
                    </svg>
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                    }} className={scoreClass}>
                        {scorePercent.toFixed(0)}
                    </div>
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                    <div style={{
                        fontWeight: 600,
                        fontSize: '1rem',
                        marginBottom: 2,
                    }}>
                        {issuer.name}
                    </div>
                    <div style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        gap: 'var(--spacing-md)',
                    }}>
                        <span>Epoch {issuer.epoch}</span>
                        <span>•</span>
                        <span>{timeAgo}</span>
                    </div>
                </div>

                {/* Trend */}
                <div style={{
                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                    borderRadius: 'var(--radius-sm)',
                    background: `${trendColor}15`,
                    color: trendColor,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                }}>
                    {trendIcon}
                </div>
            </motion.div>
        </Link>
    );
}

function formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}
