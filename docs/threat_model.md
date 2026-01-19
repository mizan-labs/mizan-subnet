# Threat Model

## System Boundaries

### In Scope
- ZK circuit soundness
- On-chain verification
- Subnet incentive alignment
- Policy enforcement

### Out of Scope
- Issuer internal security
- Physical asset custody
- Fiat banking operations
- Regulatory compliance (varies by jurisdiction)

---

## Threat Categories

### 1. Proof Omission

**Attack**: Issuer stops submitting proofs during insolvency.

**Impact**: Hidden financial distress.

**Mitigations**:
- [ ] Epoch deadlines enforced by `EpochManager`
- [ ] Score decay for missed submissions
- [ ] Progressive slashing (5% → 10% → 20%)
- [ ] Public visibility of submission gaps

**Residual Risk**: Low. Omission is publicly visible.

---

### 2. Stale Epoch Submission

**Attack**: Issuer submits old proofs to mislead.

**Impact**: False confidence in current solvency.

**Mitigations**:
- [ ] Epoch number must be monotonically increasing
- [ ] Timestamp bound in circuit
- [ ] Chain inclusion time visible

**Residual Risk**: Very Low.

---

### 3. Under-Specified Circuits

**Attack**: Circuit allows invalid states to prove.

**Impact**: False positive proofs.

**Mitigations**:
- [ ] Formal verification of circuits
- [ ] Multiple independent audits
- [ ] Miner bounties for weakness discovery
- [ ] Policy versioning for fixes

**Residual Risk**: Medium before audit, Low after.

---

### 4. Policy Downgrade

**Attack**: Issuer uses weaker policy version.

**Impact**: Lower security guarantees.

**Mitigations**:
- [ ] Minimum policy version in `PolicyRegistry`
- [ ] One-version-back grace period only
- [ ] Governance for policy changes

**Residual Risk**: Low.

---

### 5. Miner Collusion

**Attack**: Miners agree to give high scores.

**Impact**: Meaningless integrity scores.

**Mitigations**:
- [ ] Validator diversity requirements
- [ ] Stake requirements for miners
- [ ] Consensus adjustments in scoring
- [ ] Outlier detection in rankings

**Residual Risk**: Medium. Requires ongoing monitoring.

---

### 6. Validator Attack

**Attack**: Validators manipulate rankings.

**Impact**: Unfair TAO distribution, score manipulation.

**Mitigations**:
- [ ] Multiple validators required
- [ ] On-chain weight setting (transparent)
- [ ] Slashing for provably wrong rankings

**Residual Risk**: Low with validator diversity.

---

### 7. Circuit Malleability

**Attack**: Same proof accepted with different public inputs.

**Impact**: Proof reuse or manipulation.

**Mitigations**:
- [ ] Policy hash binding in circuits
- [ ] Epoch binding prevents replay
- [ ] Nullifier patterns if needed

**Residual Risk**: Very Low.

---

### 8. Front-Running

**Attack**: MEV extraction on proof submissions.

**Impact**: Censorship or delayed inclusion.

**Mitigations**:
- [ ] Grace period for submissions
- [ ] Alternative submission channels
- [ ] Commit-reveal if needed

**Residual Risk**: Low. Not high-value MEV target.

---

## Attack Trees

### Fraudulent Solvency Claim

```
Fraudulent Proof Accepted
├── Circuit Bug [M]
│   ├── Constraint missing [M]
│   └── Witness generation error [L]
├── Verifier Bug [L]
│   └── Groth16 implementation flaw [VL]
├── Policy Bypass [L]
│   └── Downgrade attack [L]
└── Oracle Attack [N/A]
    └── Out of scope
```

[VL=Very Low, L=Low, M=Medium, H=High]

### Score Manipulation

```
Integrity Score Gamed
├── Miner Collusion [M]
│   ├── Stake attack [M]
│   └── Sybil attack [L]
├── Validator Corruption [L]
│   └── Centralization [L]
└── Weak Scoring Logic [M]
    └── Edge cases missed [M]
```

---

## Severity Matrix

| Threat | Likelihood | Impact | Priority |
|--------|------------|--------|----------|
| Proof Omission | High | Medium | P1 |
| Stale Epoch | Low | Medium | P3 |
| Under-Specified Circuit | Medium | Critical | P1 |
| Policy Downgrade | Low | High | P2 |
| Miner Collusion | Medium | Medium | P2 |
| Validator Attack | Low | High | P2 |
| Circuit Malleability | Very Low | Critical | P3 |
| Front-Running | Low | Low | P4 |

---

## Security Checklist

### Pre-Launch
- [ ] Formal circuit verification
- [ ] Contract audit by 2+ independent firms
- [ ] Subnet incentive modeling
- [ ] Testnet stress testing

### Post-Launch
- [ ] Bug bounty program
- [ ] Miner watchdogs
- [ ] Anomaly detection
- [ ] Regular policy reviews
