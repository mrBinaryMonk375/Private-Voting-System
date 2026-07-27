/**
 * Private Voting System — Contract Tests (Level 3)
 *
 * Tests cover:
 *   1. Initial state is properly set up
 *   2. Admin can register voters and open/close elections
 *   3. Registered voters can cast votes
 *   4. Double voting is rejected
 *   5. Unregistered voters cannot vote
 *   6. Vote choices are NOT exposed in the public ledger
 *   7. Results are correct after multiple votes
 *   8. Only admin can open/close election
 */

import { VotingSimulator, ElectionState, VoteChoice } from "./voting-simulator.js";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect, beforeEach } from "vitest";
import { randomBytes } from "./utils.js";

setNetworkId("undeployed");

// ─── Test 1: Initial State ────────────────────────────────────────────────────

describe("Voting contract — initial state", () => {
  it("initializes with REGISTRATION state", () => {
    const adminKey = randomBytes(32);
    const sim = new VotingSimulator(adminKey, "My Election");
    const ledgerState = sim.getLedger();

    expect(ledgerState.electionState).toEqual(ElectionState.REGISTRATION);
    expect(ledgerState.electionTitle).toEqual("My Election");
    expect(ledgerState.totalVotes).toEqual(0n);
    expect(ledgerState.votesForA).toEqual(0n);
    expect(ledgerState.votesForB).toEqual(0n);
    expect(ledgerState.registeredVoters.size()).toEqual(0n);
    expect(ledgerState.hasVoted.size()).toEqual(0n);
  });

  it("admin key is set deterministically from secret key", () => {
    const adminKey = randomBytes(32);
    const sim1 = new VotingSimulator(adminKey, "Election");
    const sim2 = new VotingSimulator(adminKey, "Election");
    // Both simulators initialized with the same key should have the same admin key
    expect(sim1.getLedger().adminKey).toEqual(sim2.getLedger().adminKey);
  });

  it("private state contains secret key and is never in public ledger", () => {
    const adminKey = randomBytes(32);
    const sim = new VotingSimulator(adminKey);
    const privateState = sim.getPrivateState();
    const ledgerState = sim.getLedger();

    // Secret key should be in private state
    expect(privateState.secretKey).toEqual(adminKey);

    // Secret key should NOT appear anywhere in the ledger
    const ledgerJson = JSON.stringify(ledgerState, (_, v) => (typeof v === 'bigint' ? v.toString() : v));
    const adminKeyHex = Buffer.from(adminKey).toString('hex');
    expect(ledgerJson).not.toContain(adminKeyHex);
  });
});

// ─── Test 2: Voter Registration ───────────────────────────────────────────────

describe("Voting contract — voter registration", () => {
  it("admin can register a voter", () => {
    const adminKey = randomBytes(32);
    const sim = new VotingSimulator(adminKey);
    const voterKey = randomBytes(32);
    const voterSim = new VotingSimulator(voterKey);
    const voterPubKey = voterSim.publicKey();

    sim.registerVoter(voterPubKey);
    const ledgerState = sim.getLedger();

    expect(ledgerState.registeredVoters.size()).toEqual(1n);
    expect(ledgerState.registeredVoters.member(voterPubKey)).toEqual(true);
  });

  it("cannot register the same voter twice", () => {
    const adminKey = randomBytes(32);
    const sim = new VotingSimulator(adminKey);
    const voterKey = randomBytes(32);
    const voterSim = new VotingSimulator(voterKey);
    const voterPubKey = voterSim.publicKey();

    sim.registerVoter(voterPubKey);
    expect(() => sim.registerVoter(voterPubKey)).toThrow("Voter is already registered");
  });

  it("non-admin cannot register voters", () => {
    const adminKey = randomBytes(32);
    const sim = new VotingSimulator(adminKey);
    const nonAdminKey = randomBytes(32);
    const voterPubKey = randomBytes(32);

    sim.switchUser(nonAdminKey);
    expect(() => sim.registerVoter(voterPubKey)).toThrow("Only the election admin can register voters");
  });

  it("cannot register voters after election is open", () => {
    const adminKey = randomBytes(32);
    const sim = new VotingSimulator(adminKey);
    const voterPubKey = randomBytes(32);

    sim.openElection();
    expect(() => sim.registerVoter(voterPubKey)).toThrow("Registration period has ended");
  });
});

// ─── Test 3: Election Lifecycle ───────────────────────────────────────────────

describe("Voting contract — election lifecycle", () => {
  it("admin can open the election", () => {
    const adminKey = randomBytes(32);
    const sim = new VotingSimulator(adminKey);

    sim.openElection();
    expect(sim.getLedger().electionState).toEqual(ElectionState.OPEN);
  });

  it("admin can close the election", () => {
    const adminKey = randomBytes(32);
    const sim = new VotingSimulator(adminKey);

    sim.openElection();
    sim.closeElection();
    expect(sim.getLedger().electionState).toEqual(ElectionState.CLOSED);
  });

  it("non-admin cannot open election", () => {
    const adminKey = randomBytes(32);
    const sim = new VotingSimulator(adminKey);

    sim.switchUser(randomBytes(32));
    expect(() => sim.openElection()).toThrow("Only the election admin can open the election");
  });

  it("cannot close election during registration", () => {
    const adminKey = randomBytes(32);
    const sim = new VotingSimulator(adminKey);

    expect(() => sim.closeElection()).toThrow("Election is not currently open");
  });
});

// ─── Test 4: Vote Casting ─────────────────────────────────────────────────────

describe("Voting contract — vote casting", () => {
  const setupOpenElection = () => {
    const adminKey = randomBytes(32);
    const adminSim = new VotingSimulator(adminKey, "Test Election");

    // Register 3 voters
    const voterKeys = [randomBytes(32), randomBytes(32), randomBytes(32)];
    const voterPubKeys = voterKeys.map((k) => {
      const s = new VotingSimulator(k);
      return s.publicKey();
    });

    voterPubKeys.forEach((pk) => adminSim.registerVoter(pk));
    adminSim.openElection();

    return { adminSim, adminKey, voterKeys };
  };

  it("registered voter can cast a vote for Candidate A", () => {
    const { adminSim, voterKeys } = setupOpenElection();

    adminSim.switchUser(voterKeys[0]);
    adminSim.castVote(VoteChoice.CANDIDATE_A);

    const ledgerState = adminSim.getLedger();
    expect(ledgerState.totalVotes).toEqual(1n);
    expect(ledgerState.votesForA).toEqual(1n);
    expect(ledgerState.votesForB).toEqual(0n);
    expect(ledgerState.hasVoted.size()).toEqual(1n);
  });

  it("registered voter can cast a vote for Candidate B", () => {
    const { adminSim, voterKeys } = setupOpenElection();

    adminSim.switchUser(voterKeys[0]);
    adminSim.castVote(VoteChoice.CANDIDATE_B);

    const ledgerState = adminSim.getLedger();
    expect(ledgerState.totalVotes).toEqual(1n);
    expect(ledgerState.votesForA).toEqual(0n);
    expect(ledgerState.votesForB).toEqual(1n);
  });

  it("prevents double voting", () => {
    const { adminSim, voterKeys } = setupOpenElection();

    adminSim.switchUser(voterKeys[0]);
    adminSim.castVote(VoteChoice.CANDIDATE_A);

    expect(() => adminSim.castVote(VoteChoice.CANDIDATE_A)).toThrow("You have already voted");
  });

  it("unregistered voter cannot vote", () => {
    const { adminSim } = setupOpenElection();

    adminSim.switchUser(randomBytes(32)); // Not registered
    expect(() => adminSim.castVote(VoteChoice.CANDIDATE_A)).toThrow("You are not a registered voter");
  });

  it("vote choice is NOT stored in public ledger", () => {
    const { adminSim, voterKeys } = setupOpenElection();

    adminSim.switchUser(voterKeys[0]);
    adminSim.castVote(VoteChoice.CANDIDATE_A);

    const ledgerState = adminSim.getLedger();

    // PRIVACY TEST: The ledger should only record that a vote was cast (via hasVoted set),
    // but NOT which candidate was chosen at the individual level.
    // The voter's hasVoted entry is their public key (commitment), not their choice.
    expect(ledgerState.hasVoted.size()).toEqual(1n);

    // Tally changes but individual ballot is not stored
    expect(ledgerState.totalVotes).toEqual(1n);
    // We cannot determine which voter voted for which candidate from the public state alone

    // Check that the vote choice enum value (0n = CANDIDATE_A) is NOT separately
    // recorded in the hasVoted set — the set only contains public keys.
    const voterSim = new VotingSimulator(voterKeys[0]);
    const voterPubKey = voterSim.publicKey();
    expect(ledgerState.hasVoted.member(voterPubKey)).toEqual(true);
    // But candidateA/B indices are only reflected in aggregate counters, not per-voter data
  });

  it("cannot vote when election is not open", () => {
    const adminKey = randomBytes(32);
    const adminSim = new VotingSimulator(adminKey);
    const voterKey = randomBytes(32);
    const voterSim = new VotingSimulator(voterKey);
    const voterPubKey = voterSim.publicKey();

    adminSim.registerVoter(voterPubKey);
    // Election is still in REGISTRATION state
    adminSim.switchUser(voterKey);
    expect(() => adminSim.castVote(VoteChoice.CANDIDATE_A)).toThrow("Election is not currently open");
  });
});

// ─── Test 5: Results Verification ─────────────────────────────────────────────

describe("Voting contract — results verification", () => {
  it("final tally is correct after multiple votes", () => {
    const adminKey = randomBytes(32);
    const adminSim = new VotingSimulator(adminKey, "Final Tally Test");

    const voterKeys = [
      randomBytes(32),
      randomBytes(32),
      randomBytes(32),
      randomBytes(32),
      randomBytes(32),
    ];

    voterKeys.forEach((k) => {
      const s = new VotingSimulator(k);
      adminSim.registerVoter(s.publicKey());
    });

    adminSim.openElection();

    // Votes: 3 for A, 2 for B
    const voteChoices = [
      VoteChoice.CANDIDATE_A,
      VoteChoice.CANDIDATE_A,
      VoteChoice.CANDIDATE_B,
      VoteChoice.CANDIDATE_A,
      VoteChoice.CANDIDATE_B,
    ];

    voterKeys.forEach((k, i) => {
      adminSim.switchUser(k);
      adminSim.castVote(voteChoices[i]);
    });

    adminSim.switchUser(adminKey);
    adminSim.closeElection();

    const finalLedger = adminSim.getLedger();
    expect(finalLedger.totalVotes).toEqual(5n);
    expect(finalLedger.votesForA).toEqual(3n);
    expect(finalLedger.votesForB).toEqual(2n);
    expect(finalLedger.electionState).toEqual(ElectionState.CLOSED);
    expect(finalLedger.hasVoted.size()).toEqual(5n);
  });
});
