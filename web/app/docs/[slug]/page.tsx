'use client';

import { use } from 'react';
import Header from '@/components/Header';
import DocViewer from '@/components/DocViewer';
import { DOCS_DATA } from '@/lib/doc-content';
import { motion } from 'motion/react';
import Link from 'next/link';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default function DocPage({ params }: PageProps) {
    const { slug } = use(params);

    const doc = DOCS_DATA[slug];

    if (!doc) {
        return (
            <main className="min-h-screen">
                <Header />
                <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: 'var(--spacing-md)' }}>Document Not Found</h1>
                    <Link href="/docs" style={{ color: 'var(--accent-green)' }}>← Back to Docs</Link>
                </div>
            </main>
        );
    }

    // Simple Markdown-like renderer
    const formattedContent = doc.content.split('\n').map((line, i) => {
        if (line.startsWith('# ')) {
            return null; // Skip title as it's handled in DocViewer
        }
        if (line.startsWith('## ')) {
            return <h2 key={i} style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: '2rem', marginBottom: '1rem' }}>{line.replace('## ', '')}</h2>;
        }
        if (line.startsWith('### ')) {
            return <h3 key={i} style={{ fontSize: '1.2rem', fontWeight: 600, marginTop: '1.5rem', marginBottom: '0.75rem' }}>{line.replace('### ', '')}</h3>;
        }
        if (line.startsWith('* ')) {
            return <li key={i} style={{ marginLeft: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{line.replace('* ', '')}</li>;
        }
        if (line.trim() === '') {
            return <div key={i} style={{ height: '0.5rem' }} />;
        }
        return <p key={i} style={{ marginBottom: '1rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{line}</p>;
    });

    return (
        <main className="min-h-screen">
            <Header />

            <div className="container" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-2xl)' }}>
                <DocViewer title={doc.title} content={<div>{formattedContent}</div>} />
            </div>
        </main>
    );
}
