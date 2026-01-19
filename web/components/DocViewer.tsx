'use client';

import { motion } from 'motion/react';
import Link from 'next/link';

interface DocContent {
    title: string;
    content: React.ReactNode;
}

export default function DocViewer({ title, content }: DocContent) {
    return (
        <article className="max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Link
                    href="/docs"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'var(--text-muted)',
                        marginBottom: 'var(--spacing-lg)',
                        fontSize: '0.9rem'
                    }}
                >
                    ← Back to Docs
                </Link>

                <h1 style={{
                    fontSize: '2.5rem',
                    fontWeight: 700,
                    marginBottom: 'var(--spacing-xl)',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: 'var(--spacing-lg)'
                }}>
                    {title}
                </h1>

                <div className="prose">
                    {content}
                </div>
            </motion.div>
        </article>
    );
}
