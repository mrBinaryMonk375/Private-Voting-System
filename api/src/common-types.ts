/**
 * Private Voting System — Common Types
 *
 * Defines the shared type abstractions used across the API, CLI, and UI layers.
 *
 * @module
 */

import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import type {
  ElectionState,
  VotingPrivateState,
  Contract,
  Witnesses,
} from '../../contract/src/index';

// ─── Private State Key ────────────────────────────────────────────────────────

export const votingPrivateStateKey = 'votingPrivateState';
export type PrivateStateId = typeof votingPrivateStateKey;

// ─── Vote Choice Mirror ───────────────────────────────────────────────────────

/**
 * TypeScript mirror of the Compact VoteChoice enum.
 * 0n = CANDIDATE_A, 1n = CANDIDATE_B
 */
export type VoteChoice = 0n | 1n;
export const VOTE_A: VoteChoice = 0n;
export const VOTE_B: VoteChoice = 1n;

// ─── Private State Schema ─────────────────────────────────────────────────────

/**
 * Maps private state IDs to their corresponding private state types.
 * Used throughout the Midnight.js provider infrastructure.
 */
export type PrivateStates = {
  readonly votingPrivateState: VotingPrivateState;
};

// ─── Contract Types ───────────────────────────────────────────────────────────

/**
 * The voting contract with its private state and witness types.
 */
export type VotingContract = Contract<VotingPrivateState, Witnesses<VotingPrivateState>>;

/**
 * The circuit keys exported from the voting contract.
 */
export type VotingCircuitKeys = Exclude<keyof VotingContract['impureCircuits'], number | symbol>;

/**
 * All Midnight.js providers required to interact with the voting contract.
 */
export type VotingProviders = MidnightProviders<VotingCircuitKeys, PrivateStateId, VotingPrivateState>;

/**
 * A voting contract that has been deployed to the Midnight network.
 */
export type DeployedVotingContract = FoundContract<VotingContract>;

// ─── Derived State ────────────────────────────────────────────────────────────

/**
 * Combined view of the public ledger state and the current user's private context.
 *
 * @remarks
 * This is computed in the API layer by merging the observable on-chain ledger
 * state with the off-chain private state. Sensitive fields (like `secretKey`)
 * are NEVER included here — only derived booleans (isAdmin, hasVoted, isRegistered).
 */
export type VotingDerivedState = {
  /** Current phase of the election */
  readonly electionState: ElectionState;

  /** Human-readable election title (publicly visible) */
  readonly electionTitle: string;

  /** Votes cast for Candidate A (public — only meaningful after CLOSED) */
  readonly votesForA: bigint;

  /** Votes cast for Candidate B (public — only meaningful after CLOSED) */
  readonly votesForB: bigint;

  /** Total votes cast */
  readonly totalVotes: bigint;

  /** Whether the current user has already voted */
  readonly hasVoted: boolean;

  /** Whether the current user is the election admin */
  readonly isAdmin: boolean;

  /** Whether the current user is registered to vote */
  readonly isRegistered: boolean;

  /** How many voters are registered */
  readonly registeredVoterCount: bigint;

  /** How many voters have cast their vote */
  readonly votedCount: bigint;
};
