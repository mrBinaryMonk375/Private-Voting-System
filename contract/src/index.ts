/**
 * Private Voting System — Contract Package Exports
 *
 * Re-exports the compiled contract artifacts and typed witnesses
 * for use by the API, CLI, and UI layers.
 */

import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";

export * from "./managed/voting/contract/index.js";
export * from "./witnesses";

import * as CompiledVotingContract from "./managed/voting/contract/index.js";
import * as Witnesses from "./witnesses";

/**
 * The compiled voting contract, wired with witnesses and ZK asset paths.
 * Import this in the API/CLI layers to deploy or join a contract instance.
 */
export const CompiledVotingContractContract = CompiledContract.make<
  CompiledVotingContract.Contract<Witnesses.VotingPrivateState>
>("Voting", CompiledVotingContract.Contract<Witnesses.VotingPrivateState>).pipe(
  CompiledContract.withWitnesses(Witnesses.witnesses),
  CompiledContract.withCompiledFileAssets("./managed/voting"),
);
