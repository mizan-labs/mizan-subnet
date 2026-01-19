'use client';

import { motion } from 'motion/react';
import Header from '@/components/Header';
import Link from 'next/link';

export default function DocsPage() {
    return (
        <main className="min-h-screen">
            <Header />

            <div className="container" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-2xl)' }}>
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: 'var(--spacing-xl)', textAlign: 'center' }}
                >
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: 'var(--spacing-md)' }}>
                        Documentation
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                        Technical specifications, architecture guides, and compliance resources for the Mizan Subnet.
                    </p>
                </motion.div>

                {/* Docs Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 'var(--spacing-lg)',
                }}>
                    <DocCard
                        title="System Architecture"
                        description="Overview of the subnet components, epoch lifecycle, and data flow between Issuer, ZK circuits, and Validators."
                        icon="🏗️"
                        href="/docs/architecture"
                    />
                    <DocCard
                        title="ZK Circuit Designs"
                        description="Technical deep dive into the Circom circuits for solvency, supply, and risk bounds verification."
                        icon="🔐"
                        href="/docs/zk-design"
                    />
                    <DocCard
                        title="Economies & Incentives"
                        description="Analysis of the TAO reward distribution, miner scoring game theory, and slashing conditions."
                        icon="💰"
                        href="/docs/economics"
                    />
                    <DocCard
                        title="Regulatory Compliance"
                        description="Guide for regulators on how Mizan satisfies audit requirements like Proof of Solvency while preserving privacy."
                        icon="⚖️"
                        href="/docs/compliance"
                    />
                    <DocCard
                        title="Threat Model"
                        description="Security analysis including potential attack vectors like collision attacks, policy downgrades, and mitigations."
                        icon="🛡️"
                        href="/docs/threat-model"
                    />
                    <DocCard
                        title="Integration Guide"
                        description="Get started guide for Issuers and Miners to connect to the subnet and start submitting proofs."
                        icon="🔌"
                        href="/docs/integration"
                    />
                </div>
            </div>
        </main>
    );
}

function DocCard({ title, description, icon, href }: { title: string; description: string; icon: string; href: string }) {
    return (
        <Link href={href}>
            <motion.div
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="card"
                style={{ height: '100%', cursor: 'pointer' }}
            >
                <div style={{
                    fontSize: '2rem',
                    marginBottom: 'var(--spacing-md)',
                    background: 'var(--bg-secondary)',
                    width: 60,
                    height: 60,
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {icon}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                    {title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                    {description}
                </p>
                <div style={{
                    marginTop: 'var(--spacing-md)',
                    color: 'var(--accent-green)',
                    fontSize: '0.9rem',
                    fontWeight: 500
                }}>
                    Read more →
                </div>
            </motion.div>
        </Link>
    );
}
