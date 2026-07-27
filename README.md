# 🗳️ Private Voting System

> A production-ready, privacy-preserving voting DApp built on the [Midnight](https://midnight.network) blockchain.
> Vote privately. Verify publicly. Powered by zero-knowledge proofs.

[![CI](https://github.com/your-username/private-voting-system/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/private-voting-system/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Midnight](https://img.shields.io/badge/Midnight-Blockchain-6366f1)](https://midnight.network)
[![ZK Proofs](https://img.shields.io/badge/ZK-Proofs-8b5cf6)](https://midnight.network/developers)

---

## 🎯 Overview

The **Private Voting System** is a full-stack decentralized application (DApp) that enables elections where:

- **Votes are private**: Your ballot choice is never transmitted on-chain in plaintext
- **Identity is protected**: Your secret key stays on your device; only a pseudonymous public key is used
- **Double-voting is prevented**: The ZK proof cryptographically enforces one-vote-per-registered-voter
- **Results are verifiable**: Election tallies are publicly verifiable on the Midnight blockchain

---

## 🔒 Privacy Model

This system is built on the Midnight Network's zero-knowledge proof infrastructure.

### What Is Public (On-Chain)

| Field | Description |
|-------|-------------|
| `electionState` | Current phase (REGISTRATION / OPEN / CLOSED) |
| `electionTitle` | Name of the election |
| `adminKey` | Admin's public key (derived from secret key) |
| `registeredVoters` | Set of registered voter public keys |
| `hasVoted` | Set of public keys that have cast votes |
| `votesForA`, `votesForB` | Aggregate vote tallies |
| `totalVotes` | Total votes cast |

### What Is Private (ZK Only)

| Field | Description |
|-------|-------------|
| `secretKey` | The voter's/admin's 32-byte secret key — **never leaves the device** |
| Voter-to-identity linkage | No way to link a `hasVoted` entry to a real person |

### Zero-Knowledge Guarantees

The ZK proof in `castVote` verifies:

1. ✅ **The voter is registered** — without revealing which registered voter they are
2. ✅ **The voter hasn't voted before** — without revealing their identity
3. ✅ **The vote is valid** — the choice is one of the valid options

> **Note on ballot secrecy**: In the current Compact language model, the vote choice is disclosed as part of the ZK proof to update the correct counter. The **voter's identity remains private** — observers can see that a vote for Candidate A was cast, but cannot link it to any specific person.

---

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Smart Contract | [Compact](https://midnight.network/developers) | Privacy-preserving ZK circuits |
| Blockchain | [Midnight Network](https://midnight.network) | Decentralized ledger |
| API | TypeScript + RxJS | Contract interaction wrapper |
| CLI | Node.js + TypeScript | Command-line election management |
| UI | React + Vite + MUI | Web frontend with Lace wallet |
| Wallet | [Midnight Lace](https://midnight.network/lace) | Browser wallet extension |
| ZK Proofs | Midnight Proof Server | ZK proof generation |

---

## 📁 Project Structure

```
private-voting-system/
├── contract/                   # Compact smart contract
│   ├── src/
│   │   ├── voting.compact      # Main ZK contract
│   │   ├── witnesses.ts        # Private state & witness functions
│   │   ├── index.ts            # Package exports
│   │   └── test/               # Contract unit tests
│   │       ├── voting.test.ts  # Test suite (vitest)
│   │       └── voting-simulator.ts
│   └── package.json
├── api/                        # TypeScript API layer
│   ├── src/
│   │   ├── index.ts            # VotingAPI class
│   │   └── common-types.ts     # Shared type definitions
│   └── package.json
├── voting-cli/                 # Node.js CLI
│   ├── src/
│   │   ├── index.ts            # Interactive CLI driver
│   │   ├── config.ts           # Network configurations
│   │   └── launcher/           # Network-specific launchers
│   └── package.json
├── voting-ui/                  # React frontend
│   ├── src/
│   │   ├── App.tsx             # Main application
│   │   ├── main.tsx            # Entry point
│   │   ├── contexts/           # React contexts
│   │   └── hooks/              # Custom React hooks
│   └── package.json
├── .github/workflows/ci.yml    # GitHub Actions CI/CD
├── .env.example                # Environment template
└── README.md
```

---

## 🚀 Manual Deployment

> **Complete these steps manually after reviewing the code.**

### Prerequisites

1. **Node.js 22+** — Check: `node --version`
2. **Compact compiler** — Install:
   ```bash
   curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
   compact update
   ```
3. **Midnight Lace wallet** — Install from [midnight.network/lace](https://midnight.network/lace)
4. **testnet NIGHT tokens** — Get from the [faucet](https://midnight-tmnight-preprod.nethermind.dev/)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Compile the Contract

```bash
cd contract
compact compile src/voting.compact ./src/managed/voting
cd ..
```

### Step 3: Build the Packages

```bash
# Build contract
cd contract && npm run build && cd ..

# Build API
cd api && npm run build && cd ..

# Build CLI
cd voting-cli && npm run build && cd ..
```

### Step 4: Deploy the Contract

```bash
# Deploy to preprod testnet
cd voting-cli
node --experimental-specifier-resolution=node --loader ts-node/esm src/launcher/preprod.ts
```

When the CLI prompts you:
- Choose **1** to deploy a new election
- Enter your election title (e.g. "Community Vote 2026")
- **Copy the contract address** printed to the console

### Step 5: After Deployment

---

## 📋 After Deployment

After deploying, update the contract address in these files:

1. **`voting-ui/.env.preprod`**:
   ```
   VITE_CONTRACT_ADDRESS=<paste your contract address here>
   ```

2. **Run the UI**:
   ```bash
   cd voting-ui
   npm run dev
   ```

3. **Open the UI** at `http://localhost:5173` and connect your Lace wallet.

---

## 🧪 Running Tests

```bash
# Compile the contract first
cd contract
compact compile src/voting.compact ./src/managed/voting

# Run tests
npm run test
```

The test suite covers:
- Initial ledger state verification
- Voter registration and admin controls
- Privacy model (secret key NOT in public ledger)
- Double-voting prevention
- Vote tally correctness after multiple votes
- Election lifecycle (registration → open → closed)

---

## 🖥️ CLI Usage

```bash
cd voting-cli

# Connect to standalone (local dev)
npm run standalone

# Connect to preview testnet
npm run preview-remote

# Connect to preprod testnet
npm run preprod-remote
```

### CLI Menu Options

```
1. Cast your vote (private)
2. Register a voter (admin only)
3. Open election (admin only)
4. Close election (admin only)
5. Show election state (public)
6. Show your private status
7. Show derived state
8. Exit
```

---

## 🌐 UI Development

```bash
cd voting-ui

# Start development server (connects to preprod by default)
VITE_NETWORK_ID=preprod VITE_LOGGING_LEVEL=info VITE_CONTRACT_ADDRESS=<address> npm run dev

# Build for production (preprod)
npm run build
```

---

## 🔑 Architecture

```
User Device (Private)              Midnight Blockchain (Public)
┌─────────────────────┐           ┌──────────────────────────────┐
│  secretKey (never   │           │  adminKey (derived pub key)  │
│  leaves device)     │           │  registeredVoters (set)      │
│                     │   ZK      │  hasVoted (set of pub keys)  │
│  publicKey =        │  Proof    │  votesForA: Counter          │
│  hash(secretKey)  ──┼──────────►│  votesForB: Counter          │
│                     │           │  totalVotes: Counter         │
│  voteChoice         │           │  electionState               │
│  (stays private)    │           └──────────────────────────────┘
└─────────────────────┘
```

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

## 🏆 Acknowledgments

Built for the **Rise In — Midnight Builder Challenge**.
Powered by the [Midnight Network](https://midnight.network) zero-knowledge blockchain platform.
