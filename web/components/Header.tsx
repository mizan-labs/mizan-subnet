'use client';

import { motion } from 'motion/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Header() {
    const pathname = usePathname();

    return (
        <header style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            borderBottom: '1px solid var(--border-color)',
        }} className="glass">
            <div className="container" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--spacing-md) var(--spacing-lg)',
            }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--gradient-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '1.1rem',
                        }}
                    >
                        M
                    </motion.div>
                    <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Mizan</span>
                </Link>
                <nav style={{ display: 'flex', gap: 'var(--spacing-lg)' }}>
                    <NavLink href="/" active={pathname === '/'}>Dashboard</NavLink>
                    <NavLink href="/policies" active={pathname === '/policies'}>Policies</NavLink>
                    <NavLink href="/docs" active={pathname?.startsWith('/docs')}>Docs</NavLink>
                </nav>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        style={{
                            padding: 'var(--spacing-sm) var(--spacing-md)',
                            borderRadius: 'var(--radius-full)',
                            background: 'rgba(0, 212, 170, 0.1)',
                            border: '1px solid rgba(0, 212, 170, 0.3)',
                            fontSize: '0.875rem',
                            color: 'var(--accent-green)',
                        }}
                    >
                        <span style={{
                            display: 'inline-block',
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: 'var(--accent-green)',
                            marginRight: 'var(--spacing-xs)',
                            animation: 'pulse-glow 2s ease-in-out infinite',
                        }} />
                        Epoch 142 Active
                    </motion.div>
                </div>
            </div>
        </header>
    );
}

function NavLink({
    href,
    children,
    active
}: {
    href: string;
    children: React.ReactNode;
    active?: boolean;
}) {
    return (
        <Link
            href={href}
            style={{
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '0.9rem',
                fontWeight: active ? 500 : 400,
                transition: 'color 0.2s ease',
                position: 'relative',
            }}
        >
            {children}
            {active && (
                <motion.div
                    layoutId="nav-indicator"
                    style={{
                        position: 'absolute',
                        bottom: -8,
                        left: 0,
                        right: 0,
                        height: 2,
                        background: 'var(--accent-green)',
                        borderRadius: 1,
                    }}
                />
            )}
        </Link>
    );
}
