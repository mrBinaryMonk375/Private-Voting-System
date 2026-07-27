/**
 * Private Voting System — Test Simulator
 *
 * A testbed for exercising the voting contract circuits locally
 * without connecting to the network or proof server.
 */

import {
  type CircuitContext,
  QueryContext,
  sampleContractAddress,
  createConstructorContext,
  CostModel,
} from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  type Ledger,
  ledger,
  ElectionState,
  VoteChoice,
} from "../managed/voting/contract/index.js";
import { type VotingPrivateState, witnesses } from "../witnesses.js";

export { ElectionState, VoteChoice };

/**
 * A simulator for testing the voting contract in isolation.
 *
 * Supports single-user and multi-user scenarios, including
 * admin operations (register, open, close) and voter operations (castVote).
 */
export class VotingSimulator {
  readonly contract: Contract<VotingPrivateState>;
  circuitContext: CircuitContext<VotingPrivateState>;

  constructor(secretKey: Uint8Array, electionTitle: string = "Test Election") {
    this.contract = new Contract<VotingPrivateState>(witnesses);
    const { currentPrivateState, currentContractState, currentZswapLocalState } =
      this.contract.initialState(
        createConstructorContext({ secretKey }, "0".repeat(64)),
        electionTitle,
      );
    this.circuitContext = {
      currentPrivateState,
      currentZswapLocalState,
      costModel: CostModel.initialCostModel(),
      currentQueryContext: new QueryContext(
        currentContractState.data,
        sampleContractAddress(),
      ),
    };
  }

  /** Switch to a different user's secret key. */
  public switchUser(secretKey: Uint8Array): void {
    this.circuitContext.currentPrivateState = { secretKey };
  }

  /** Get the current public ledger state. */
  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  /** Get the current private state. */
  public getPrivateState(): VotingPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  /** Derive this user's public key. */
  public publicKey(): Uint8Array {
    return this.contract.circuits.publicKey(
      this.circuitContext,
      this.circuitContext.currentPrivateState.secretKey,
    ).result;
  }

  /** Admin: register a voter by their public key. */
  public registerVoter(voterPubKey: Uint8Array): Ledger {
    this.circuitContext = this.contract.impureCircuits.registerVoter(
      this.circuitContext,
      voterPubKey,
    ).context;
    return this.getLedger();
  }

  /** Admin: open the election. */
  public openElection(): Ledger {
    this.circuitContext = this.contract.impureCircuits.openElection(
      this.circuitContext,
    ).context;
    return this.getLedger();
  }

  /** Admin: close the election. */
  public closeElection(): Ledger {
    this.circuitContext = this.contract.impureCircuits.closeElection(
      this.circuitContext,
    ).context;
    return this.getLedger();
  }

  /** Voter: cast a private vote. */
  public castVote(choice: VoteChoice): Ledger {
    this.circuitContext = this.contract.impureCircuits.castVote(
      this.circuitContext,
      choice,
    ).context;
    return this.getLedger();
  }
}
