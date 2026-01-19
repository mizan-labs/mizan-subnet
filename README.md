# ZK Stablecoin Bittensor Subnet

> **"ZK enforces facts, Bittensor enforces meaning."**

A monetary-integrity intelligence market where proofs are private, verification is public.

## Overview

This subnet creates a decentralized verification layer for stablecoin integrity. Issuers generate zero-knowledge proofs of solvency, and Bittensor miners compete to analyze and score these proofs.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         EPOCH FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│  Issuer → Proof + Roots → Contract → Miners → Validators → TAO │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
├── web/        # Next.js 16 transparency dashboard
├── contracts/  # EVM smart contracts (Foundry)
├── subnet/     # Bittensor subnet (miner/validator)
├── zk/         # Circom circuits & provers
├── issuer/     # Private prover (issuer-side)
├── docs/       # Documentation
└── scripts/    # Utility scripts
```

## Quick Start

### Prerequisites
- Node.js 20+
- Rust (for Circom)
- Python 3.10+ (for subnet)
- Foundry (for contracts)

### Setup

```bash
# Install Circom
curl -L https://raw.githubusercontent.com/iden3/circomlib/master/scripts/install-circom.sh | bash

# Install ZK dependencies
cd zk && npm install

# Install subnet dependencies
cd subnet && pip install -e .

# Install web dependencies
cd web && npm install

# Install contract dependencies
cd contracts && forge install
```

## Phases

1. **ZK Core** - Circom circuits for solvency proofs
2. **Smart Contracts** - On-chain verification
3. **Issuer Pipeline** - Proof generation from private data
4. **Subnet Skeleton** - Bittensor miner/validator
5. **Competition Layer** - Multi-miner dynamics
6. **Web UI** - Transparency dashboard
7. **Documentation** - Architecture & compliance docs

## License

MIT
