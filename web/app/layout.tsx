import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
});

export const metadata: Metadata = {
    title: 'Mizan | ZK Stablecoin Integrity',
    description: 'Transparent stablecoin integrity verification powered by zero-knowledge proofs and Bittensor',
    keywords: ['stablecoin', 'zk proofs', 'bittensor', 'integrity', 'defi'],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={inter.variable}>
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
