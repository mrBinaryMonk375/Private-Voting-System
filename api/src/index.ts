/**
 * Private Voting System — API Layer
 *
 * Provides types and abstractions for interacting with the deployed
 * Private Voting System contract on the Midnight blockchain.
 *
 * PRIVACY NOTES:
 *  - The `castVote` method encodes the vote choice inside a ZK proof.
 *  - The vote choice never appears in any on-chain transaction data.
 *  - Only the aggregate counters (votesForA, votesForB) are updated on-chain.
 *
 * @packageDocumentation
 */

import * as Voting from '../../contract/src/managed/voting/contract/index.js';

import { type ContractAddress, convertFieldToBytes } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { type Logger } from 'pino';
import {
  type VotingDerivedState,
  type VotingContract,
  type VotingProviders,
  type DeployedVotingContract,
  votingPrivateStateKey,
  type VoteChoice,
} from './common-types.js';
import { CompiledVotingContractContract } from '../../contract/src/index';
import * as utils from './utils/index.js';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { combineLatest, map, tap, from, type Observable } from 'rxjs';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import { VotingPrivateState, createVotingPrivateState } from '../../contract/src/witnesses.js';

/**
 * The public API surface for an interacting with a deployed Voting contract.
 */
export interface DeployedVotingAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<VotingDerivedState>;

  /** Admin: register a voter by their public key */
  registerVoter: (voterPubKey: Uint8Array) => Promise<void>;

  /** Admin: open the election */
  openElection: () => Promise<void>;

  /** Admin: close the election */
  closeElection: () => Promise<void>;

  /**
   * Cast a private vote for the given choice.
   *
   * @remarks
   * The `choice` value is passed into the ZK circuit as a private input.
   * It is NEVER included in any on-chain transaction. Only the vote tally
   * counter is updated on-chain. The ZK proof guarantees the vote is valid
   * without revealing the voter's identity or their choice.
   */
  castVote: (choice: VoteChoice) => Promise<void>;
}

/**
 * Implements the VotingAPI by wrapping a deployed Voting contract.
 */
export class VotingAPI implements DeployedVotingAPI {
  /** @internal */
  private constructor(
    public readonly deployedContract: DeployedVotingContract,
    providers: VotingProviders,
    private readonly logger?: Logger,
  ) {
    this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
    providers.privateStateProvider.setContractAddress(this.deployedContractAddress);

    this.state$ = combineLatest(
      [
        providers.publicDataProvider
          .contractStateObservable(this.deployedContractAddress, { type: 'latest' })
          .pipe(
            map((contractState) => Voting.ledger(contractState.data)),
            tap((ledgerState) =>
              logger?.trace({
                ledgerStateChanged: {
                  electionState: ledgerState.electionState,
                  totalVotes: ledgerState.totalVotes,
                  votesForA: ledgerState.votesForA,
                  votesForB: ledgerState.votesForB,
                },
              }),
            ),
          ),
        from(providers.privateStateProvider.get(votingPrivateStateKey) as Promise<VotingPrivateState>),
      ],
      (ledgerState, privateState) => {
        // Derive this user's public key from their private secret key.
        // Used to determine admin status and whether this user has voted.
        const myPubKey = Voting.pureCircuits.publicKey(privateState.secretKey);
        const myPubKeyHex = toHex(myPubKey);
        const adminKeyHex = toHex(ledgerState.adminKey);

        return {
          electionState: ledgerState.electionState,
          electionTitle: ledgerState.electionTitle,
          votesForA: ledgerState.votesForA,
          votesForB: ledgerState.votesForB,
          totalVotes: ledgerState.totalVotes,
          hasVoted: ledgerState.hasVoted.member(myPubKey),
          isAdmin: myPubKeyHex === adminKeyHex,
          isRegistered: ledgerState.registeredVoters.member(myPubKey),
          registeredVoterCount: ledgerState.registeredVoters.size(),
          votedCount: ledgerState.hasVoted.size(),
        };
      },
    );
  }

  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<VotingDerivedState>;

  /**
   * Admin: Register a voter.
   */
  async registerVoter(voterPubKey: Uint8Array): Promise<void> {
    this.logger?.info('registerVoter');
    const txData = await this.deployedContract.callTx.registerVoter(voterPubKey);
    this.logger?.trace({ transactionAdded: { circuit: 'registerVoter', txHash: txData.public.txHash } });
  }

  /**
   * Admin: Open the election.
   */
  async openElection(): Promise<void> {
    this.logger?.info('openElection');
    const txData = await this.deployedContract.callTx.openElection();
    this.logger?.trace({ transactionAdded: { circuit: 'openElection', txHash: txData.public.txHash } });
  }

  /**
   * Admin: Close the election.
   */
  async closeElection(): Promise<void> {
    this.logger?.info('closeElection');
    const txData = await this.deployedContract.callTx.closeElection();
    this.logger?.trace({ transactionAdded: { circuit: 'closeElection', txHash: txData.public.txHash } });
  }

  /**
   * Cast a private vote.
   *
   * The `choice` parameter (CANDIDATE_A or CANDIDATE_B) is passed as a private
   * ZK circuit input. It is provably included in the ballot without being
   * disclosed on the blockchain.
   */
  async castVote(choice: VoteChoice): Promise<void> {
    this.logger?.info(`castVote (choice is private — not logged)`);
    const txData = await this.deployedContract.callTx.castVote(choice as any);
    this.logger?.trace({ transactionAdded: { circuit: 'castVote', txHash: txData.public.txHash } });
  }

  /**
   * Deploy a new voting contract.
   */
  static async deploy(
    providers: VotingProviders,
    electionTitle: string,
    logger?: Logger,
  ): Promise<VotingAPI> {
    logger?.info('deployContract');

    const deployedVotingContract = await deployContract(providers, {
      compiledContract: CompiledVotingContractContract,
      privateStateId: votingPrivateStateKey,
      initialPrivateState: createVotingPrivateState(utils.randomBytes(32)),
      args: [electionTitle],
    });

    logger?.trace({
      contractDeployed: {
        finalizedDeployTxData: deployedVotingContract.deployTxData.public,
      },
    });

    return new VotingAPI(deployedVotingContract, providers, logger);
  }

  /**
   * Join an already-deployed voting contract.
   */
  static async join(
    providers: VotingProviders,
    contractAddress: ContractAddress,
    logger?: Logger,
  ): Promise<VotingAPI> {
    logger?.info({ joinContract: { contractAddress } });

    const deployedVotingContract = await findDeployedContract<VotingContract>(providers, {
      contractAddress,
      compiledContract: CompiledVotingContractContract,
      privateStateId: votingPrivateStateKey,
      initialPrivateState: await VotingAPI.getPrivateState(providers, contractAddress),
    });

    logger?.trace({
      contractJoined: {
        finalizedDeployTxData: deployedVotingContract.deployTxData.public,
      },
    });

    return new VotingAPI(deployedVotingContract, providers, logger);
  }

  private static async getPrivateState(
    providers: VotingProviders,
    contractAddress: ContractAddress,
  ): Promise<VotingPrivateState> {
    providers.privateStateProvider.setContractAddress(contractAddress);
    const existingPrivateState = await providers.privateStateProvider.get(votingPrivateStateKey);
    return existingPrivateState ?? createVotingPrivateState(utils.randomBytes(32));
  }
}

export * as utils from './utils/index.js';
export * from './common-types.js';
