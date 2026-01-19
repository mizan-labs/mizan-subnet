'use client';

import { motion } from 'motion/react';
import Header from '@/components/Header';

// Mock policies
const mockPolicies = [
    {
        hash: '0xabcd1234567890ef',
        version: 3,
        minCollateralRatio: 1.5,
        maxCollateralRatio: 2.0,
        minSupplyCoverage: 1.0,
        epochDeadline: 86400,
        isActive: true,
        createdAt: Date.now() - 86400000 * 10,
    },
    {
        hash: '0x9876543210fedcba',
        version: 2,
        minCollateralRatio: 1.25,
        maxCollateralRatio: 1.75,
        minSupplyCoverage: 1.0,
        epochDeadline: 86400,
        isActive: false,
        createdAt: Date.now() - 86400000 * 30,
    },
    {
        hash: '0x1111222233334444',
        version: 1,
        minCollateralRatio: 1.0,
        maxCollateralRatio: 1.5,
        minSupplyCoverage: 1.0,
        epochDeadline: 43200,
        isActive: false,
        createdAt: Date.now() - 86400000 * 60,
    },
];

export default function PoliciesPage() {
    return (
        <main className="min-h-screen">
            <Header />

            <div className="container" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-2xl)' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: 'var(--spacing-xl)' }}
                >
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
                        <span className="gradient-text">Integrity Policies</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '600px' }}>
                        Policies define the rules that ZK proofs must adhere to. Each policy version
                        specifies collateral requirements, supply coverage, and epoch deadlines.
                    </p>
                </motion.div>

                {/* Active Policy */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{ marginBottom: 'var(--spacing-xl)' }}
                >
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                        <span style={{ color: 'var(--accent-green)', marginRight: 'var(--spacing-sm)' }}>●</span>
                        Active Policy
                    </h2>

                    <div className="card glow" style={{ borderColor: 'var(--border-glow)' }}>
                        <PolicyCard policy={mockPolicies[0]} featured />
                    </div>
                </motion.div>

                {/* Policy History */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                        Policy History
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                        {mockPolicies.slice(1).map((policy, i) => (
                            <motion.div
                                key={policy.hash}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                                className="card"
                            >
                                <PolicyCard policy={policy} />
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </main>
    );
}

function PolicyCard({ policy, featured }: { policy: typeof mockPolicies[0]; featured?: boolean }) {
    return (
        <div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 'var(--spacing-md)'
            }}>
                <div>
                    <div style={{
                        fontSize: featured ? '1.25rem' : '1rem',
                        fontWeight: 600,
                        marginBottom: 4
                    }}>
                        Version {policy.version}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {policy.hash}
                    </div>
                </div>
                <div style={{
                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                    borderRadius: 'var(--radius-full)',
                    background: policy.isActive ? 'rgba(0, 212, 170, 0.15)' : 'var(--bg-secondary)',
                    color: policy.isActive ? 'var(--accent-green)' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                }}>
                    {policy.isActive ? 'Active' : 'Inactive'}
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 'var(--spacing-md)',
            }}>
                <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>Min Collateral</div>
                    <div style={{ fontWeight: 600 }}>{(policy.minCollateralRatio * 100).toFixed(0)}%</div>
                </div>
                <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>Max Collateral</div>
                    <div style={{ fontWeight: 600 }}>{(policy.maxCollateralRatio * 100).toFixed(0)}%</div>
                </div>
                <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>Supply Coverage</div>
                    <div style={{ fontWeight: 600 }}>{(policy.minSupplyCoverage * 100).toFixed(0)}%</div>
                </div>
                <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>Epoch Deadline</div>
                    <div style={{ fontWeight: 600 }}>{policy.epochDeadline / 3600}h</div>
                </div>
            </div>

            <div style={{
                marginTop: 'var(--spacing-md)',
                paddingTop: 'var(--spacing-md)',
                borderTop: '1px solid var(--border-color)',
                fontSize: '0.8rem',
                color: 'var(--text-muted)'
            }}>
                Created: {new Date(policy.createdAt).toLocaleDateString()}
            </div>
        </div>
    );
}
