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

### Level 1
- [x] **Compact Contract:** Public ledger state and private ZK witness implemented
- [x] **`disclose()` Usage:** Deliberately used only for public vote tallies and election state
- [x] **Contract Compiles:** `npm run compact` produces `contracts/managed/` directory
- [x] **Local Deployment:** Works via `npm run setup -- --network undeployed`
- [x] **CLI Interaction:** Full terminal-based contract interaction via `npm run cli`
- [x] **Preprod Wallet Sync Issue:** Documented and demo mode provided as workaround
- [x] **Minimum 5 Meaningful Commits:** Verified structured commit history on `main`

### Level 2
- [x] **Modern UI Frontend:** React + TypeScript + Vite + Framer Motion
- [x] **Lace Wallet Connect / Disconnect:** Full session lifecycle management
- [x] **Wallet & Network Status Display:** Live badge in header with network name
- [x] **Contract Address from Env:** Loaded via `VITE_CONTRACT_ADDRESS`
- [x] **Main Circuit Called from Frontend:** `cast_vote`, `register_voter`, `open_election`, `close_election`
- [x] **Results & Error Display:** Toast notifications + error recovery UI
- [x] **Public Ledger State Shown:** Live vote counts, turnout, registration phase
- [x] **Private Value Entry:** Vote choice never displayed publicly
- [x] **Minimum 8 Meaningful Commits:** Verified

### Level 3
- [x] **4+ Meaningful Tests:** `contract/src/test/voting.test.ts` — full ZK circuit test suite
- [x] **GitHub Actions CI/CD:** Automated build & test on every push/PR
- [x] **Privacy Model Section:** Full observer analysis below
- [x] **Product Proposal:** Documented below
- [x] **Submission Checklists:** Present and complete
- [x] **Polished UX:** Loading, success, error, and empty states all handled
- [x] **Minimum 10 Meaningful Commits:** No AI co-author trailers

---

## 🛡️ Midnight Privacy Model: What an Observer Learns vs Cannot Learn

### ❌ What an Observer CANNOT Learn (Kept Strictly Private)

- **Individual Vote Choice:** The voter's actual selection (Candidate A or B) is injected as a private ZK witness inside `cast_vote`. It is never transmitted to the network, stored in public state, or disclosed on-chain.
- **Voter's Private Key / Secret:** The admin and voter private keys remain entirely off-chain and are never submitted to any transaction.
- **Admin Identity:** The election administrator's identity is protected — the contract only stores their public key hash, not their wallet address or identity.
- **Voter Decision Timing:** Although a voter's public key appears in `hasVoted`, the exact moment of voting cannot be linked to a specific choice.

### ✅ What an Observer CAN Learn (Disclosed On-Chain Public State)

- **Election Phase:** Whether the election is in `REGISTRATION`, `OPEN`, or `CLOSED` state.
- **Election Title:** The human-readable name of the election stored in public ledger.
- **Vote Tallies:** The aggregate count of votes for `Candidate A` and `Candidate B` (via `disclose()`).
- **Registered Voters:** The set of public keys eligible to vote (`registeredVoters`).
- **Voted Set:** The set of public keys that have already cast a ballot (`hasVoted`) — confirming participation without revealing the choice.

### 🔐 What is Deliberately Disclosed

During the `cast_vote` circuit, the voter's choice is a **private witness**. The ZK circuit:
1. Verifies the choice is valid (A or B)
2. Confirms the voter is registered
3. Confirms the voter has not already voted
4. Updates and **deliberately discloses only the updated public tallies** — the actual input is never exposed

---

## 🛠️ Contract & Live Deployment Details

| Environment | Location / Address | Notes |
|---|---|---|
| Live Web App | https://private-voting-system-ten.vercel.app/ | React + Vite frontend |
| Preprod Smart Contract | *(Deploy in progress)* | Midnight Preprod Network |
| CI/CD Workflow | `.github/workflows/ci.yml` | GitHub Actions — build & test |
| Local Dev Server | `http://localhost:5173` | Run via `npm run dev` |

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

### Landing Page — Connect or Quick Launch
The hero landing page with wallet connect, join election by contract address, or deploy a new election.

### Election Dashboard — Live Voting
Real-time vote counts, turnout metrics, candidate selection cards, and ZK-encrypted vote submission.

### Admin Panel — Election Lifecycle
Admin controls to register voters, open the election for voting, and close it to reveal final results.

### Audit History — On-Chain Records
Full election history table with contract addresses, status badges, vote tallies, and one-click inspect.

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
