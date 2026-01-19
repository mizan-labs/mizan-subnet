import { ReactNode } from 'react';

// This would ideally be loaded from the MD files at build time,
// but for this scaffold we'll embed the content structures.

interface Accessor {
    title: string;
    content: ReactNode;
}

export const DOCS_DATA: Record<string, { title: string; content: string }> = {
    'architecture': {
        title: 'System Architecture',
        content: `
# System Architecture

The Mizan Subnet connects off-chain private data with on-chain public verification using a hybrid architecture.

## High-Level Components

### 1. The Issuer Zone (Private)
*   **Ledger Interface**: Connects to the issuer's proprietary accounting system (SQL DB, ERP, etc.).
*   **Witness Generator**: Converts raw ledger balances into a Merkle Tree wihout revealing values.
*   **Proof Generator**: Creates a Groth16 Zero-Knowledge proof asserting solvency.

### 2. The Blockchain Zone (Public)
*   IntegrityRegistry.sol: The immutable record of all submitted proofs.
*   PolicyRegistry.sol: Governs the rules (collateral ratios, authorized supply).
*   Verifier.sol: A generated contract that verifies the ZK math.

### 3. The Subnet Zone (Bittensor)
*   **Miners**: Listen for new "IntegrityProven" events. Verified proofs are scored locally.
*   **Validators**: Query miners for their analysis and distribute TAO rewards based on consensus.
`
    },
    'zk-design': {
        title: 'ZK Circuit Design',
        content: `
# ZK Circuit Design

This document details the Zero-Knowledge circuits used in the Mizan Subnet using Circom 2.1.

## Core Circuits

### 1. Solvency Circuit
Proves that total collateral value exceeds total liability value by a specific ratio.
Constraint: sum(Collateral) >= sum(Liabilities) * MinRatio

### 2. Supply Circuit
Proves that the minted stablecoin supply does not exceed the authorized limits.
Constraint: MintedSupply <= AuthorizedSupply

### 3. Risk Bounds Circuit
Ensures that the portfolio composition adheres to risk policies (e.g., "No more than 20% in Asset X").

## Hashing & Merkle Trees
*   **Hash Function**: Poseidon (optimized for ZK).
*   **Tree Depth**: 20 levels.
*   **Leaves**: Poseidon(Value).
`
    },
    'economics': {
        title: 'Subnet Economics',
        content: `
# Subnet Economics

Mizan operates as a "Market for Truth" where miners sell integrity analysis to validators.

## Incentive Structure
*   **Miners (41%)**: Paid for accurate, high-confidence verification.
*   **Validators (41%)**: Paid for consensus ranking.
*   **Owner (18%)**: Protocol maintenance.

## Scoring Game
Score = Accuracy + Confidence + Consensus

1.  **Accuracy**: Matches on-chain reality.
2.  **Confidence**: Miners stake reputation on their verdict.
3.  **Consensus**: Agreement with weighted majority.
`
    },
    'compliance': {
        title: 'Regulatory Compliance',
        content: `
# Regulatory Compliance

Mizan provides a framework for compliance (MiCA, TRUST Act) without compromising privacy.

## Features
1.  **Proof of Solvency**: Block-by-block verification of reserves.
2.  **Privacy**: No customer names or balances revealed.
3.  **Non-Custodial**: The subnet never holds funds.
4.  **Continuous Audit**: Real-time monitoring vs quarterly reports.

## For Regulators
The **Integrity Score** provides a single, verifiable metric of an issuer's financial health.
`
    },
    'threat-model': {
        title: 'Threat Model',
        content: `
# Threat Model

## Attack Vectors

### 1. Fake Proof Generation
*   **Risk**: Issuer tries to forge a solvency proof.
*   **Mitigation**: Groth16 soundness. Cryptographically impossible without the private witness.

### 2. Miner Collusion
*   **Risk**: Miners agree to falsely validite a bad proof.
*   **Mitigation**: Yuma Consensus requires >50% stake weight agreement. Smart contract provides ultimate source of truth.

### 3. Policy Downgrade
*   **Risk**: Issuer switches to a weaker policy (e.g. 1% reserve).
*   **Mitigation**: Proofs are bound to a specific policy hash. UI alerts users of policy changes.
`
    },
    'integration': {
        title: 'Integration Guide',
        content: `
# Integration Guide

## For Issuers

1.  **Format Ledger**: Export liabilities/collateral to JSON.
2.  **Generate Witness**: Use our TS tool to build Merkle trees.
3.  **Submit Proof**: Run the proof generator CLI.

## For Miners

1.  **Register**: Get a UID on the subnet.
2.  **Run Miner**: Start the python miner process.
3.  **Earn**: Verify proofs as they appear on-chain.
`
    }
};
