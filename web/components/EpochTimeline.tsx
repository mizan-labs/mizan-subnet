'use client';

import { motion } from 'motion/react';
import Link from 'next/link';

interface Epoch {
    epoch: number;
    timestamp: number;
    proofs: number;
    avgScore: number;
}

interface EpochTimelineProps {
    epochs: Epoch[];
}

export default function EpochTimeline({ epochs }: EpochTimelineProps) {
    const maxProofs = Math.max(...epochs.map(e => e.proofs));

    return (
        <div className="card" style={{ overflow: 'hidden' }}>
            {/* Chart Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 'var(--spacing-md)',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
            }}>
                <span>Epoch Activity</span>
                <span>Proofs per epoch</span>
            </div>

            {/* Bar Chart */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 4,
                height: 100,
                marginBottom: 'var(--spacing-md)',
            }}>
                {epochs.map((epoch, i) => {
                    const height = (epoch.proofs / maxProofs) * 100;
                    const scoreClass =
                        epoch.avgScore >= 0.95 ? 'var(--accent-green)' :
                            epoch.avgScore >= 0.85 ? 'var(--accent-blue)' :
                                'var(--accent-yellow)';

                    return (
                        <Link
                            key={epoch.epoch}
                            href={`/epoch/${epoch.epoch}`}
                            style={{ flex: 1 }}
                        >
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${height}%` }}
                                transition={{ delay: i * 0.05, duration: 0.4 }}
                                whileHover={{ opacity: 0.8 }}
                                style={{
                                    background: scoreClass,
                                    borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                                    minHeight: 4,
                                    cursor: 'pointer',
                                }}
                                title={`Epoch ${epoch.epoch}: ${epoch.proofs} proofs`}
                            />
                        </Link>
                    );
                })}
            </div>

            {/* Epoch Numbers */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
            }}>
                <span>{epochs[epochs.length - 1]?.epoch}</span>
                <span>{epochs[0]?.epoch}</span>
            </div>

            {/* Divider */}
            <div style={{
                borderTop: '1px solid var(--border-color)',
                marginTop: 'var(--spacing-md)',
                paddingTop: 'var(--spacing-md)',
            }}>
                {/* Recent Epochs List */}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-sm)' }}>
                    Latest
                </div>
                {epochs.slice(0, 3).map((epoch, i) => (
                    <Link key={epoch.epoch} href={`/epoch/${epoch.epoch}`}>
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                            whileHover={{ x: 4 }}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: 'var(--spacing-sm) 0',
                                borderBottom: i < 2 ? '1px solid var(--border-color)' : 'none',
                                cursor: 'pointer',
                            }}
                        >
                            <span style={{ fontWeight: 500 }}>Epoch {epoch.epoch}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                {epoch.proofs} proofs • {(epoch.avgScore * 100).toFixed(0)}%
                            </span>
                        </motion.div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
