# Integration Guide

This guide details how Issuers and Miners can integrate with the Mizan Subnet.

## For Issuers

Issuers are the entities (Stablecoin protocols, RWAs) that need to prove their solvency.

### 1. Prerequisites
*   **Ledger Data**: You must have read access to your liabilities (user balances) and collateral (bank API, on-chain reserves).
*   **Node.js Environment**: Needed to run the ZK proof generator.
*   **ETH Key**: Private key for submitting proofs to the `IntegrityRegistry`.

### 2. Setup the Issuer Client

Clone the repository and install dependencies:
```bash
git clone https://github.com/mizan-labs/mizan-subnet
cd mizan-subnet
npm install
cd issuer
npm install
```

### 3. Prepare Your Ledger
Format your data into the standard JSON schema:
```json
{
  "collateral": {
    "USDC": "1000000000000000000",
    "Bond_01": "500000000000000000"
  },
  "liabilities": {
    "user_1": "1000000000000000",
    "user_2": "2000000000000000"
  }
}
```

### 4. Generate & Submit Proofs
Run the automated pipeline to generate a witness, create a ZK proof, and submit to the chain.

```bash
# Set env vars
export PRIVATE_KEY="0x..."
export RPC_URL="https://..."

# Run submission
ts-node submit/submit_epoch.ts --ledger ./my_ledger.json
```

---

## For Miners

Miners are the auditors who verify proofs and earn TAO.

### 1. Requirements
*   **Hardware**: Min. 16GB RAM, 8 vCPU (for fast proof verification).
*   **Bittensor Wallet**: Registered hotkey on the subnet.

### 2. Install Miner Software

```bash
pip install -e .
python -m subnet.miner.main --wallet.name mywallet --wallet.hotkey myhotkey
```

### 3. Verification Strategy
By default, the miner performs:
*   **Cryptographic Check**: Verifies the Groth16 proof against the verification key.
*   **Policy Check**: Ensures the proof used the correct `policy_hash` for the current epoch.
*   **Double-Spend Check**: Ensures the `epoch` and `issuer` pair hasn't been seen before.

### 4. Customizing Logic
You can improve your score by adding custom reputation heuristics in `subnet/miner/miner.py`:

```python
def custom_verify(self, proof):
    # Example: Check if issuer address is in a risk list
    if proof.issuer in RISK_LIST:
        return False
    return True
```

## For Validators

Validators govern the network.

### 1. Running a Validator
```bash
python -m subnet.validator.main --wallet.name myvalidator
```

### 2. Scoring Weights
Validators can adjust weights in `subnet/common/scoring.py` to prioritize different metrics (Accuracy vs. Consistency).
