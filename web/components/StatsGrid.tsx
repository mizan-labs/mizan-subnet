'use client';

import { motion } from 'motion/react';

interface StatsGridProps {
    stats: {
        totalIssuers: number;
        avgIntegrity: number;
        proofsPast24h: number;
        activeMiners: number;
    };
}

export default function StatsGrid({ stats }: StatsGridProps) {
    const items = [
        {
            label: 'Total Issuers',
            value: stats.totalIssuers.toString(),
            icon: '🏦',
        },
        {
            label: 'Avg Integrity',
            value: `${(stats.avgIntegrity * 100).toFixed(1)}%`,
            color: 'var(--accent-green)',
            icon: '✓',
        },
        {
            label: 'Proofs (24h)',
            value: stats.proofsPast24h.toLocaleString(),
            icon: '📜',
        },
        {
            label: 'Active Miners',
            value: stats.activeMiners.toString(),
            icon: '⛏️',
        },
    ];

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--spacing-md)',
        }}>
            {items.map((item, i) => (
                <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="card"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-md)',
                    }}
                >
                    <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                    }}>
                        {item.icon}
                    </div>
                    <div>
                        <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: item.color || 'var(--text-primary)',
                        }}>
                            {item.value}
                        </div>
                        <div style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)'
                        }}>
                            {item.label}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
