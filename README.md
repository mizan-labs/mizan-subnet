<h1 align="center">Mizan Subnet</h1>

<p align="center">
  <strong>Zero-Knowledge Stablecoin Integrity Verification on Bittensor</strong>
</p>

<p align="center">
  <a href="#overview">Overview</a> •
  <a href="#key-features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#installation">Installation</a> •
  <a href="#running-a-miner">Mining</a> •
  <a href="#running-a-validator">Validating</a> •
  <a href="#issuers">Issuers</a> •
  <a href="#documentation">Docs</a>
</p>

---

## Overview

**Mizan** is a Bittensor subnet that creates a decentralized verification layer for stablecoin and reserve-backed asset integrity. 

### The Problem

Stablecoins and RWAs (Real-World Assets) claim to be backed 1:1, but users must **trust** the issuer's word. Traditional audits are:
- **Slow** (quarterly snapshots)
- **Expensive** (Big 4 audit fees)
- **Privacy-invasive** (auditors see all customer data)

### The Solution

Mizan uses **Zero-Knowledge Proofs** to let issuers prove solvency *without revealing private data*, and **Bittensor's incentive layer** to create a decentralized network of auditors (miners) who verify these proofs in real-time.

> **"ZK enforces the facts. Bittensor enforces the meaning."**

---

## Key Features

| Feature | Description |
|---------|-------------|
| 🔐 **Privacy-Preserving** | Issuers prove solvency without revealing customer balances or asset details |
| ⚡ **Real-Time Verification** | Block-by-block proof submission instead of quarterly audits |
| 🌐 **Decentralized Auditing** | No single point of failure; miners compete to verify proofs |
| 📊 **Risk Scoring** | Beyond binary pass/fail—miners provide nuanced integrity scores |
| 🔗 **On-Chain Registry** | Immutable record of all proofs on EVM-compatible chains |
| 💰 **TAO Incentives** | Miners earn TAO for accurate, timely verification |

---

## Why Bittensor?

Zero-Knowledge proofs verify **math**, but they cannot verify **context**:

| What ZK Can Verify | What Bittensor Adds |
|-------------------|---------------------|
| ✅ `Assets >= Liabilities * 1.5` | ✅ "Is the issuer using the *latest* policy?" |
| ✅ Mathematical correctness | ✅ "Is the data actually available and fresh?" |
| ✅ Proof was generated correctly | ✅ "What is the *trend* of this issuer's solvency?" |

Bittensor provides:
1. **Incentive Alignment**: Miners are paid to be accurate, creating a self-policing system
2. **Redundancy**: Multiple miners verify each proof independently
3. **Consensus**: Yuma Consensus ensures agreement on scores
4. **Permissionless Participation**: Anyone can become a miner/validator

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MIZAN SUBNET                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌──────────────────┐ │
│   │  ISSUER  │───▶│ ZK PROOF │───▶│  SMART       │───▶│   BITTENSOR      │ │
│   │ (Private)│    │ GENERATOR│    │  CONTRACT    │    │   SUBNET         │ │
│   └──────────┘    └──────────┘    │              │    │                  │ │
│        │                          │ • Registry   │    │ • Miners verify  │ │
│        │                          │ • Policies   │    │ • Validators     │ │
│        ▼                          │ • Epochs     │    │   rank miners    │ │
│   ┌──────────┐                    └──────────────┘    │ • TAO rewards    │ │
│   │  LEDGER  │                           │            └──────────────────┘ │
│   │  (SQL/DB)│                           ▼                     │          │
│   └──────────┘                    ┌──────────────┐             ▼          │
│                                   │  WEB UI      │      ┌────────────┐    │
│                                   │  Dashboard   │◀─────│ INTEGRITY  │    │
│                                   └──────────────┘      │ SCORES     │    │
│                                                         └────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Issuer** connects their private ledger (balances, collateral) to the ZK prover
2. **ZK Circuits** generate a cryptographic proof that `Assets >= Liabilities * Ratio`
3. **Smart Contract** receives the proof and emits an `IntegrityProven` event
4. **Miners** listen for events, verify proofs, check policy compliance, and score
5. **Validators** query miners, aggregate scores via Yuma Consensus
6. **TAO Rewards** are distributed based on miner accuracy and availability
7. **Web Dashboard** displays real-time integrity scores for public transparency

---

## Project Structure

```
mizan-subnet/
├── contracts/                 # Solidity smart contracts
│   ├── IntegrityRegistry.sol  # Stores proof commitments
│   ├── PolicyRegistry.sol     # Manages verification policies
│   ├── EpochManager.sol       # Handles epoch timing and slashing
│   └── verifier/              # Auto-generated Groth16 verifiers
├── docs/                      # Technical documentation
│   ├── architecture.md        # System design
│   ├── zk_design.md           # Circuit specifications
│   ├── subnet_economics.md    # Incentive analysis
│   ├── threat_model.md        # Security analysis
│   ├── for_regulators.md      # Compliance guide
│   └── integration_guide.md   # Setup instructions
├── issuer/                    # Private issuer pipeline
│   ├── ledger/                # Ledger data schema
│   ├── merkle/                # Merkle tree builder
│   ├── prove/                 # Proof generation
│   └── submit/                # On-chain submission
├── subnet/                    # Bittensor subnet code
│   ├── common/                # Shared types and utilities
│   │   ├── types.py           # Data structures
│   │   ├── scoring.py         # Scoring algorithms
│   │   └── policies.py        # Policy management
│   ├── miner/                 # Miner implementation
│   │   └── miner.py           # Proof analysis logic
│   └── validator/             # Validator implementation
│       └── validator.py       # Miner ranking logic
├── web/                       # Next.js transparency dashboard
│   ├── app/                   # App Router pages
│   ├── components/            # React components
│   └── lib/                   # API clients
├── zk/                        # Zero-Knowledge circuits
│   ├── circuits/              # Circom circuit files
│   │   ├── solvency.circom    # Collateral >= Liabilities
│   │   ├── supply.circom      # Minted <= Authorized
│   │   ├── risk_bounds.circom # Per-asset ratio limits
│   │   └── epoch.circom       # Aggregated epoch proof
│   ├── witness/               # Witness generation
│   ├── proofs/                # Proof generation CLI
│   ├── verifier/              # Verifier export tools
│   └── keys/                  # Proving/verification keys
├── pyproject.toml             # Python project config
├── foundry.toml               # Foundry config
└── README.md                  # This file
```

---

## Installation

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | ZK circuits, Web UI, Issuer pipeline |
| Python | 3.10+ | Bittensor subnet |
| Rust | Latest | Circom compiler |
| Foundry | Latest | Smart contract development |

### Step 1: Clone Repository

```bash
git clone https://github.com/mizan-labs/mizan-subnet.git
cd mizan-subnet
```

### Step 2: Install Circom (ZK Compiler)

```bash
# Install Rust if not present
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Circom
git clone https://github.com/iden3/circom.git
cd circom
cargo build --release
cargo install --path circom
cd ..
```

### Step 3: Install ZK Dependencies

```bash
cd zk
npm install
cd ..
```

### Step 4: Install Subnet (Python)

```bash
# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install package
pip install -e .
```

### Step 5: Install Smart Contract Dependencies

```bash
cd contracts
forge install
cd ..
```

### Step 6: Install Web Dashboard

```bash
cd web
npm install
cd ..
```

---

## Running a Miner

Miners are the backbone of the subnet. They verify ZK proofs and provide integrity analysis.

### What Miners Do

1. **Listen** for `IntegrityProven` events from the smart contract
2. **Verify** the Groth16 proof using the on-chain verifier
3. **Check** policy compliance (correct policy hash, epoch number)
4. **Score** the proof based on multiple factors:
   - Cryptographic validity
   - Policy adherence
   - Historical consistency
   - Data availability
5. **Respond** to Validator queries via Axon

### Hardware Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 8 GB | 16+ GB |
| CPU | 4 cores | 8+ cores |
| Storage | 50 GB SSD | 100+ GB SSD |
| Network | 100 Mbps | 1 Gbps |

### Setup

#### 1. Create Bittensor Wallet

```bash
# Install Bittensor CLI
pip install bittensor

# Create wallet
btcli wallet create --wallet.name miner_wallet

# Create hotkey
btcli wallet new_hotkey --wallet.name miner_wallet --wallet.hotkey miner_hotkey
```

#### 2. Register on Subnet

```bash
# Check subnet UID (replace with actual)
NETUID=<subnet_uid>

# Register
btcli subnet register --wallet.name miner_wallet --wallet.hotkey miner_hotkey --netuid $NETUID
```

#### 3. Configure Environment

Create a `.env` file in the project root:

```bash
# Wallet Configuration
WALLET_NAME=miner_wallet
WALLET_HOTKEY=miner_hotkey

# Network Configuration
NETUID=<subnet_uid>
SUBTENSOR_NETWORK=finney  # or 'test' for testnet

# Ethereum RPC (for proof verification)
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY

# Contract Addresses
INTEGRITY_REGISTRY=0x...
POLICY_REGISTRY=0x...
```

#### 4. Start Miner

```bash
# Activate virtual environment
source venv/bin/activate

# Run miner
python -m subnet.miner.main \
    --wallet.name $WALLET_NAME \
    --wallet.hotkey $WALLET_HOTKEY \
    --netuid $NETUID \
    --axon.port 8091 \
    --logging.debug
```

### Miner Scoring

Your score is determined by:

| Factor | Weight | Description |
|--------|--------|-------------|
| Accuracy | 40% | Does your verification match on-chain reality? |
| Confidence | 25% | How certain are you? (High confidence + wrong = penalty) |
| Consensus | 20% | Do you agree with other miners? |
| Availability | 15% | Is your Axon responsive? |

---

## Running a Validator

Validators query miners and determine reward distribution.

### What Validators Do

1. **Query** miners for their analysis of recent proofs
2. **Aggregate** responses using weighted scoring
3. **Set Weights** on the Bittensor network based on miner performance
4. **Distribute** TAO rewards according to weights

### Requirements

- Sufficient TAO stake (check current requirements)
- High availability (99%+ uptime recommended)
- Fast network connection

### Setup

#### 1. Create Validator Wallet

```bash
btcli wallet create --wallet.name validator_wallet
btcli wallet new_hotkey --wallet.name validator_wallet --wallet.hotkey validator_hotkey
```

#### 2. Register as Validator

```bash
btcli subnet register --wallet.name validator_wallet --wallet.hotkey validator_hotkey --netuid $NETUID
```

#### 3. Start Validator

```bash
python -m subnet.validator.main \
    --wallet.name validator_wallet \
    --wallet.hotkey validator_hotkey \
    --netuid $NETUID \
    --logging.debug
```

---

## For Issuers

Issuers are stablecoin protocols or RWA platforms that want to prove their solvency.

### Integration Steps

#### 1. Prepare Your Ledger Data

Export your liabilities and collateral to JSON:

```json
{
  "collateral": {
    "USDC_Reserve": "1000000000000000000000000",
    "Treasury_Bond_01": "500000000000000000000000"
  },
  "liabilities": {
    "user_wallet_1": "100000000000000000000",
    "user_wallet_2": "200000000000000000000"
  },
  "metadata": {
    "epoch": 142,
    "timestamp": 1705600000
  }
}
```

#### 2. Generate Merkle Trees

```bash
cd issuer/merkle
npx ts-node build_tree.ts --input ../ledger/my_ledger.json --output ../trees/
```

#### 3. Generate ZK Proof

```bash
cd issuer/prove
npx ts-node generate_proof.ts \
    --circuit solvency \
    --witness ../trees/witness.json \
    --output ../proofs/
```

#### 4. Submit to Smart Contract

```bash
cd issuer/submit
npx ts-node submit_epoch.ts \
    --proof ../proofs/proof.json \
    --public ../proofs/public.json
```

---

## Smart Contracts

### Deployment

```bash
cd contracts

# Deploy to testnet
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast

# Verify on Etherscan
forge verify-contract <address> IntegrityRegistry --chain sepolia
```

### Contract Addresses

| Contract | Mainnet | Sepolia |
|----------|---------|---------|
| IntegrityRegistry | `TBD` | `TBD` |
| PolicyRegistry | `TBD` | `TBD` |
| EpochManager | `TBD` | `TBD` |
| Groth16Verifier | `TBD` | `TBD` |

---

## Web Dashboard

The transparency dashboard shows real-time integrity scores.

### Development

```bash
cd web
npm run dev
```

Visit `http://localhost:3000`

### Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard with live integrity scores |
| `/issuer/[id]` | Individual issuer detail page |
| `/epoch/[n]` | Epoch details and proof history |
| `/policies` | Active and historical policies |
| `/docs` | Technical documentation |

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | System design and component overview |
| [ZK Design](docs/zk_design.md) | Circuit specifications and constraints |
| [Economics](docs/subnet_economics.md) | Incentive structure and game theory |
| [Threat Model](docs/threat_model.md) | Security analysis and mitigations |
| [Compliance](docs/for_regulators.md) | Regulatory compatibility guide |
| [Integration](docs/integration_guide.md) | Step-by-step setup for all roles |

---

## Troubleshooting

### Common Issues

<details>
<summary><strong>Miner not receiving requests</strong></summary>

1. Check your Axon port is open: `nc -zv localhost 8091`
2. Verify registration: `btcli wallet overview --wallet.name miner_wallet`
3. Check logs for connection errors

</details>

<details>
<summary><strong>Proof verification failing</strong></summary>

1. Ensure you have the correct verification key
2. Check the policy hash matches the active policy
3. Verify the RPC connection to the smart contract

</details>

<details>
<summary><strong>Low miner score</strong></summary>

1. Check your availability (Axon uptime)
2. Verify you're using the latest policy version
3. Ensure fast response times to validator queries

</details>

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Run linting
ruff check .
```

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  <sub>Built with ❤️ for transparent finance</sub>
</p>
