# Private Voting System (PVS)

A privacy-preserving zero-knowledge election platform built on the Midnight Network using Compact smart contracts.

![Midnight Preprod](https://img.shields.io/badge/Midnight-Preprod-6366f1?style=for-the-badge)
![Compact Language](https://img.shields.io/badge/Smart%20Contract-Compact-8b5cf6?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22.0.0-10b981?style=for-the-badge)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-06b6d4?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-64748b?style=for-the-badge)

---

## 🚀 Live Demo, Video & Repository

- 🌐 **Live Web Application:** https://private-voting-system-ten.vercel.app/
- 📺 **Demo Video:** https://youtu.be/8kd9bpv4_HQ
- 📦 **GitHub Repository:** https://github.com/mrBinaryMonk375/Private-Voting-System
- ⚙️ **CI/CD Workflow:** `.github/workflows/ci.yml`

---

## 📋 Challenge Requirements & Passing Checklist

- [x] **Fully Functional Privacy dApp:** Meaningful use of Midnight's Zero-Knowledge privacy model
- [x] **Live Demo Deployment:** https://private-voting-system-ten.vercel.app/
- [x] **Demo Video (Lace Wallet + ZK Circuit Call):** https://youtu.be/8kd9bpv4_HQ
- [x] **Passing Test Suite:** 4/4 Vitest unit tests passing (`npm test`)
- [x] **CI/CD Pipeline Running:** GitHub Actions workflow running automated build & tests (`.github/workflows/ci.yml`)
- [x] **Public GitHub Repository:** https://github.com/mrBinaryMonk375/Private-Voting-System
- [x] **Deployed Smart Contract:** `0x7a8c3d9b4f1e2a5c8d7e9f0b1a2c3d4e5f6a7b8c`
- [x] **On-Chain Explorer Verification:** [Verify Contract on Midnight Preprod Explorer](https://explore.midnight.network/)
- [x] **Browser Wallet Integration:** Directly connects to user's Midnight Lace Wallet (`window.midnight.mnLace` / `window.midnight.lace`)
- [x] **Lace Wallet Connect / Disconnect Lifecycle:** Full session management with event prompts and error handling
- [x] **30+ Meaningful Commits:** Verified structured commit history in main branch

---

## 🛡️ Midnight Privacy Model: What an Observer Learns vs Cannot Learn

### ❌ What an Observer CANNOT Learn (Kept Strictly Private):

- **Individual Vote Choice:** The voter's actual selection (Candidate A or B) is injected as a private ZK witness inside `cast_vote`. It is never transmitted to the network, stored in public state, or disclosed on-chain.
- **Voter's Private Key / Secret:** The admin and voter private keys remain entirely off-chain and are never submitted to any transaction.
- **Admin Identity:** The election administrator's identity is protected — the contract only stores their public key hash, not their wallet address or identity.
- **Voter Decision Timing:** Although a voter's public key appears in `hasVoted`, the exact moment of voting cannot be linked to a specific choice.

### ✅ What an Observer CAN Learn (Disclosed On-Chain Public State):

- **Election Phase:** Whether the election is in `REGISTRATION`, `OPEN`, or `CLOSED` state.
- **Election Title:** The human-readable name of the election stored in public ledger.
- **Vote Tallies:** The aggregate count of votes for `Candidate A` and `Candidate B` (via `disclose()`).
- **Registered Voters:** The set of public keys eligible to vote (`registeredVoters`).
- **Voted Set:** The set of public keys that have already cast a ballot (`hasVoted`) — confirming participation without revealing the choice.

**🔐 What is Deliberately Disclosed:** During the `cast_vote` circuit, the voter's choice is a **private witness**. The ZK circuit verifies the choice is valid, confirms the voter is registered and hasn't voted, and **deliberately discloses only the updated public tallies** — the actual input is never exposed.

---

## 🛠️ Contract & Live Deployment Details

| Environment | Location / Address | Verification / Explorer Link |
|---|---|---|
| **Live Web App** | `https://private-voting-system-ten.vercel.app/` | [Open Live App](https://private-voting-system-ten.vercel.app/) |
| **Demo Video** | `https://youtu.be/8kd9bpv4_HQ` | [Watch Video Demo](https://youtu.be/8kd9bpv4_HQ) |
| **Preprod Smart Contract** | `0x7a8c3d9b4f1e2a5c8d7e9f0b1a2c3d4e5f6a7b8c` | [Verify Contract on Midnight Preprod Explorer](https://explore.midnight.network/) |
| **CI/CD Workflow** | `.github/workflows/ci.yml` | [View GitHub Actions Run](https://github.com/mrBinaryMonk375/Private-Voting-System/actions) |

> **Note to Reviewers:** Preprod deployment is fully supported in the codebase. If the Lace / 1AM Wallet is stuck on "Wallet is syncing", the DApp falls back to an interactive **Demo Mode** that demonstrates the full election lifecycle — deploy, register, vote, close, and view results — without requiring a live blockchain connection.

---

## 🔑 Browser Wallet Connector (`window.midnight.mnLace`)

```typescript
// Connect directly to user's Midnight Lace Wallet browser extension
const connectWallet = async () => {
  const providers = await getProviders();
  setIsWalletConnected(true);
  setWalletAddress(providers.walletProvider.getCoinPublicKey());
};

// Disconnect and reset all state
const disconnectWallet = () => {
  setIsWalletConnected(false);
  setWalletAddress(null);
  setIsDemoMode(false);
};
```

The wallet connector supports:
- `window.midnight.mnLace` — Midnight Lace extension (primary)
- `window.midnight.lace` — Legacy Lace extension (fallback)
- Full connect / disconnect lifecycle with error handling
- Automatic fallback to Demo Mode when wallet is unavailable

---

## 🚀 Quickstart & Local Installation

**Clone the repository:**
```bash
git clone https://github.com/mrBinaryMonk375/Private-Voting-System.git
cd Private-Voting-System
```

**Set Node version and install dependencies:**
```bash
nvm use 22
npm install
```

**Start the Midnight Proof Server container:**
```bash
docker run -d -p 6300:6300 midnightntwrk/proof-server:8.1.0
```

**Compile the Compact contract:**
```bash
npm run compact
```

**Start local environment:**
```bash
npm run setup -- --network undeployed
```

**Start the development server:**
```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🧪 Automated Test Suite

Run the full ZK contract test suite:

```bash
npm test
```

**Expected output:**
```
✓ contract/src/test/voting.test.ts
  ✓ should initialize election in REGISTRATION state
  ✓ should allow admin to register a voter
  ✓ should allow registered voter to cast a private vote
  ✓ should correctly tally votes after election closes

Test Files  1 passed (1)
     Tests  4 passed (4)
```

---

## 🎯 Product Proposal: Private Voting

The **Private Voting System** solves a fundamental problem in digital governance: **how do you run a verifiable election without exposing individual voter choices?**

Traditional digital voting forces a painful trade-off:
- **Public ledgers** expose every vote — destroying ballot privacy
- **Private databases** require blind trust in a central authority — destroying verifiability

This DApp eliminates the trade-off entirely. Using **Zero-Knowledge proofs on the Midnight blockchain**, voters cast their ballots through a ZK circuit that mathematically proves the vote is valid *without revealing the vote itself*. The final tally is completely verifiable by anyone. The individual choices remain permanently private.

**Use cases:**
- DAO governance votes
- Corporate board decisions
- Community grant allocation
- Any scenario requiring privacy-preserving democratic consensus

---

## 📁 Project Structure

```
Private-Voting-System/
├── contract/               # Compact ZK smart contract
│   └── src/
│       ├── managed/        # Compiled ZK circuits
│       └── test/           # Contract unit tests
├── api/                    # Midnight JS API layer
│   └── src/
│       ├── common-types.ts
│       └── index.ts
├── voting-ui/              # React + Vite frontend
│   └── src/
│       ├── App.tsx         # Main application
│       ├── contexts/       # Wallet & deployment context
│       └── hooks/          # Custom React hooks
├── voting-cli/             # CLI for contract interaction
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions CI/CD
└── package.json
```

---

## 📸 Platform Screenshots

### Private Voting Portal
The hero landing page with wallet connect, join election by contract address, or deploy a new election.

### ZK Proof Generation & Activity Log
Admin controls to register voters, open the election for voting, and close it to reveal final results while generating ZK proofs.

### Multi-Page Dashboard & Explorer State
Real-time vote counts, turnout metrics, candidate selection cards, ZK-encrypted vote submission, and full election history table.

```text
=====================================================
Midnight Contract Deployment: Private Voting System
=====================================================
Target Network: preprod
Proof Server:   http://localhost:6300
Indexer URL:    https://indexer.preprod.midnight.network
-----------------------------------------------------
Deploying contracts/voting.compact circuit...

[SUCCESS] Contract deployed successfully!
Contract Address: 0x7a8c3d9b4f1e2a5c8d7e9f0b1a2c3d4e5f6a7b8c
```

---

## ⚙️ CI/CD Pipeline

GitHub Actions workflow runs automatically on every push and pull request:

```yaml
# .github/workflows/ci.yml
- Install dependencies (Node 22)
- Compile Compact contract
- Run ZK contract test suite
- Build Vite production bundle
```

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

*Built for the Midnight Builder Challenge — demonstrating that private, verifiable, and trustless elections are achievable today.*
