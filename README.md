# Private Voting System - Midnight Builder Challenge

A privacy-preserving voting DApp built on the Midnight blockchain. This project fulfills the requirements for **Level 1, Level 2, and Level 3** of the Midnight Builder Challenge.

## Product Proposal: Private Voting
The **Private Voting System** ensures that elections can be held with absolute cryptographic integrity while preserving voter anonymity. In traditional systems, you either have public ledgers where everyone's vote is exposed, or private databases where the tallying process requires blind trust in a central authority. This DApp solves that by using Zero-Knowledge proofs on Midnight. It allows an election admin to register eligible voters, and for those voters to cast their ballots privately. The final tally is completely verifiable, yet no observer can determine who voted for whom.

---

## Privacy Model

### What Observers Can Learn (Public Ledger State)
- **Election State:** Whether the election is in the Registration, Open, or Closed phase.
- **Election Title:** The name of the election being held.
- **Vote Totals:** The total number of votes cast, as well as the running tally for `Candidate A` and `Candidate B`.
- **Voter Participation:** A set of public keys of users who have successfully cast a vote (`hasVoted` state).
- **Voter Eligibility:** A set of public keys of users who are registered to vote (`registeredVoters` state).

### What Observers CANNOT Learn (Private State)
- **Individual Vote Choices:** The blockchain never sees or stores a voter's actual choice (e.g., whether they picked Candidate A or B). The ZK proof simply attests that "a valid choice was added to the tally."
- **The Admin Secret Key:** The private key used by the election administrator to manage the election state is kept entirely off-chain.

### What is Disclosed Deliberately
During the `cast_vote` circuit, the voter's choice is injected as a private witness. The circuit verifies that the choice is valid (either A or B), ensures the voter is registered, ensures the voter hasn't voted yet, and then **deliberately discloses only the updated public vote tallies** and the updated `hasVoted` set. The actual choice input is never disclosed.

---

## Preprod Deployment & Wallet Sync Status

> **Note to Mentors/Reviewers:** 
> Preprod deployment is fully supported in this codebase. However, if the Lace / 1AM Wallet is stuck on the "Wallet is syncing" screen when connecting to the Preprod network, the DApp cannot establish a connection.
> - **Mentor Guidance Followed:** *"If you're unable to deploy, just build the full-stack dApp and submit it. Skip the deployment part for now. Vibe-code the full-stack dApp using the prompt, then submit."*
> - **Workaround Used:** The contract is fully tested, compiles, and deploys locally. We have successfully funded the Preprod wallet and the DApp is hardcoded to connect to the Preprod network.
> - **Full-Stack UI & Demo Mode:** The UI has been fully built and tested to handle connection errors, wallet detection, interactive demo mode, and transaction signing for when the Preprod sync completes.

---

## Setup & Run Instructions

### Prerequisites
- Node.js >= 22.0.0
- Docker (for local Midnight proof server)
- Midnight Compact Compiler

### 1. Install Dependencies
```bash
npm install
```

### 2. Compile the Contract
```bash
npm run compact
```
*This generates the `contracts/managed/` directory with the compiled circuits.*

### 3. Start Local Environment (Undeployed / Local Testing)
```bash
npm run setup -- --network undeployed
```
*This starts the local Proof Server on port 6300 and the Indexer.*

### 4. Run the Full-Stack DApp
```bash
npm run dev
```
*This starts the React frontend (Vite) on `http://localhost:5173`.*

### 5. CLI Interaction
```bash
npm run cli
```
*Allows interacting with the contract directly via the terminal.*

---

## Submission Checklists

### Level 1 Checklist
- [x] Compact contract with public ledger state and private witness.
- [x] `disclose()` used deliberately only for public values.
- [x] Contract compiles via `npm run compact`.
- [x] `contracts/managed/` directory is present.
- [x] Local deployment works (`npm run setup -- --network undeployed`).
- [x] CLI interaction works.
- [x] Preview/Preprod wallet sync blocked documented.
- [x] Minimum 5 meaningful commits.

### Level 2 Checklist
- [x] Modern UI frontend built.
- [x] Lace wallet Connect & Disconnect buttons.
- [x] Wallet status and Network status display.
- [x] Load contract address & network from env.
- [x] Call main circuit from frontend.
- [x] Show result and errors.
- [x] Show public ledger state.
- [x] User enters private value without displaying publicly.
- [x] Minimum 8 meaningful commits.

### Level 3 Checklist
- [x] Added more than 3 meaningful tests (see `contract/src/test/voting.test.ts`).
- [x] GitHub Actions CI/CD workflow created on push/PR.
- [x] Privacy Model section in README.
- [x] Product Proposal section in README.
- [x] Submission Checklists added.
- [x] UX polished with loading, success, error, and empty states.
- [x] Minimum 10 meaningful commits (no AI co-author trailers).
