/**
 * Private Voting System — Contract Witnesses
 *
 * This file defines the private state shape and the witness functions
 * for the Private Voting System contract.
 *
 * PRIVACY NOTE: The `secretKey` held in `VotingPrivateState` is the voter's
 * cryptographic secret. It is NEVER disclosed on-chain. All ZK circuits that
 * use it compute only commitments/public-keys that are then verified on-chain.
 */

import { Ledger } from "./managed/voting/contract/index.js";
import { WitnessContext } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";

// ─── Private State Type ───────────────────────────────────────────────────────

/**
 * The private state for the voting contract.
 *
 * @remarks
 * Only one secret is required: the voter's/admin's secret key.
 * From this key, the public key (pseudonym) is derived deterministically.
 * The key never leaves the ZK proof environment.
 */
export type VotingPrivateState = {
  readonly secretKey: Uint8Array;
};

/**
 * Factory function to create a VotingPrivateState instance.
 *
 * @param secretKey A 32-byte random secret key.
 */
export const createVotingPrivateState = (secretKey: Uint8Array): VotingPrivateState => ({
  secretKey,
});

// ─── Witnesses ────────────────────────────────────────────────────────────────

/**
 * Witness functions for the voting contract.
 *
 * @remarks
 * The `localSecretKey` witness is the bridge between the off-chain private state
 * and the on-chain ZK circuit. It is called inside circuits to retrieve the
 * secret key without exposing it to the blockchain.
 *
 * Contract: `witness localSecretKey(): Bytes<32>;`
 */
export const witnesses = {
  localSecretKey: ({
    privateState,
  }: WitnessContext<Ledger, VotingPrivateState>): [VotingPrivateState, Uint8Array] => [
    privateState,
    privateState.secretKey,
  ],
};
