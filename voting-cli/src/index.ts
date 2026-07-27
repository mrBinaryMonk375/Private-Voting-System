/**
 * Private Voting System — Interactive CLI
 *
 * This is the main driver for the Private Voting System CLI.
 * It supports deploying a new election, joining an existing one,
 * casting private votes, and registering voters.
 *
 * PRIVACY NOTE: When casting a vote, the CLI prompts for your choice (A or B).
 * That choice is passed directly into the ZK circuit and is NEVER logged,
 * transmitted, or stored in any form that reveals the vote.
 */

import { createInterface, type Interface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { WebSocket } from 'ws';
import {
  VotingAPI,
  type VotingDerivedState,
  votingPrivateStateKey,
  type VotingProviders,
  type DeployedVotingContract,
  type PrivateStateId,
  VOTE_A,
  VOTE_B,
} from '../../api/src/index';
import { type WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import {
  ledger,
  type Ledger,
  ElectionState,
} from '../../contract/src/managed/voting/contract/index.js';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { type Logger } from 'pino';
import { type Config, StandaloneConfig } from './config.js';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { type ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { assertIsContractAddress, toHex } from '@midnight-ntwrk/midnight-js-utils';
import { TestEnvironment } from '@midnight-ntwrk/testkit-js';
import { MidnightWalletProvider } from './midnight-wallet-provider';
import { randomBytes } from '../../api/src/utils';
import { unshieldedToken } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { syncWallet, waitForUnshieldedFunds } from './wallet-utils';
import { generateDust } from './generate-dust';
import { VotingPrivateState } from '../../contract/src/witnesses.js';

// @ts-expect-error: WebSocket polyfill for Apollo
globalThis.WebSocket = WebSocket;

// ─── Ledger Query ─────────────────────────────────────────────────────────────

export const getVotingLedgerState = async (
  providers: VotingProviders,
  contractAddress: ContractAddress,
): Promise<Ledger | null> => {
  assertIsContractAddress(contractAddress);
  const contractState = await providers.publicDataProvider.queryContractState(contractAddress);
  return contractState != null ? ledger(contractState.data) : null;
};

// ─── Election State Display ───────────────────────────────────────────────────

const displayElectionState = (state: ElectionState): string => {
  switch (state) {
    case ElectionState.REGISTRATION:
      return '📝 REGISTRATION';
    case ElectionState.OPEN:
      return '🗳️  OPEN — voting in progress';
    case ElectionState.CLOSED:
      return '🔒 CLOSED — results finalized';
  }
};

const displayLedgerState = async (
  providers: VotingProviders,
  deployedContract: DeployedVotingContract,
  logger: Logger,
): Promise<void> => {
  const contractAddress = deployedContract.deployTxData.public.contractAddress;
  const ledgerState = await getVotingLedgerState(providers, contractAddress);
  if (ledgerState === null) {
    logger.info(`No voting contract found at ${contractAddress}`);
  } else {
    logger.info(`\n═══════════════ ELECTION STATE ═══════════════`);
    logger.info(`  Title      : ${ledgerState.electionTitle}`);
    logger.info(`  Status     : ${displayElectionState(ledgerState.electionState)}`);
    logger.info(`  Registered : ${ledgerState.registeredVoters.size()} voters`);
    logger.info(`  Voted      : ${ledgerState.hasVoted.size()} / ${ledgerState.registeredVoters.size()}`);
    logger.info(`  Total Votes: ${ledgerState.totalVotes}`);
    if (ledgerState.electionState === ElectionState.CLOSED) {
      logger.info(`\n  ── FINAL RESULTS ──`);
      logger.info(`  Candidate A: ${ledgerState.votesForA} votes`);
      logger.info(`  Candidate B: ${ledgerState.votesForB} votes`);
    } else {
      logger.info(`  Results    : (available after election closes)`);
    }
    logger.info(`═══════════════════════════════════════════════`);
  }
};

const displayPrivateState = async (providers: VotingProviders, logger: Logger): Promise<void> => {
  const privateState = await providers.privateStateProvider.get(votingPrivateStateKey);
  if (privateState === null) {
    logger.info(`No existing private state found.`);
  } else {
    logger.info(`Your pseudonymous public key: ${toHex(privateState.secretKey).slice(0, 16)}... (truncated for safety)`);
  }
};

const displayDerivedState = (state: VotingDerivedState | undefined, logger: Logger) => {
  if (state === undefined) {
    logger.info(`No state available yet.`);
  } else {
    logger.info(`\n═══════════════ YOUR VOTING STATUS ════════════`);
    logger.info(`  Election  : ${state.electionTitle}`);
    logger.info(`  Status    : ${displayElectionState(state.electionState)}`);
    logger.info(`  You are   : ${state.isAdmin ? '👑 Election Admin' : state.isRegistered ? '✅ Registered Voter' : '⚠️  Not Registered'}`);
    logger.info(`  You voted : ${state.hasVoted ? '✅ Yes' : '❌ Not yet'}`);
    logger.info(`  Turnout   : ${state.votedCount} / ${state.registeredVoterCount} registered voters`);
    if (state.electionState === ElectionState.CLOSED) {
      logger.info(`\n  ── FINAL RESULTS ──`);
      logger.info(`  Candidate A: ${state.votesForA} votes`);
      logger.info(`  Candidate B: ${state.votesForB} votes`);
    }
    logger.info(`═══════════════════════════════════════════════`);
  }
};

// ─── Deploy or Join ───────────────────────────────────────────────────────────

const DEPLOY_OR_JOIN_QUESTION = `
╔══════════════════════════════════════╗
║   Private Voting System — CLI v1.0   ║
╚══════════════════════════════════════╝

Choose an option:
  1. Deploy a new election contract
  2. Join an existing election contract
  3. Exit

Your choice: `;

const deployOrJoin = async (
  providers: VotingProviders,
  rli: Interface,
  logger: Logger,
): Promise<VotingAPI | null> => {
  let api: VotingAPI | null = null;

  while (true) {
    const choice = await rli.question(DEPLOY_OR_JOIN_QUESTION);
    switch (choice) {
      case '1': {
        const title = await rli.question('Enter election title: ');
        api = await VotingAPI.deploy(providers, title, logger);
        logger.info(`✅ Election deployed at: ${api.deployedContractAddress}`);
        logger.info(`⚠️  Save this address! Share it with voters so they can join.`);
        return api;
      }
      case '2': {
        const addr = await rli.question('Enter contract address (hex): ');
        api = await VotingAPI.join(providers, addr, logger);
        logger.info(`✅ Joined election at: ${api.deployedContractAddress}`);
        return api;
      }
      case '3':
        logger.info('Goodbye!');
        return null;
      default:
        logger.error(`Invalid choice: ${choice}`);
    }
  }
};

// ─── Main Loop ────────────────────────────────────────────────────────────────

const MAIN_LOOP_QUESTION = `
Options:
  1. Cast your vote (private)
  2. Register a voter (admin only)
  3. Open election (admin only)
  4. Close election (admin only)
  5. Show election state (public)
  6. Show your private status
  7. Show derived state
  8. Exit

Your choice: `;

const mainLoop = async (providers: VotingProviders, rli: Interface, logger: Logger): Promise<void> => {
  const votingApi = await deployOrJoin(providers, rli, logger);
  if (votingApi === null) {
    return;
  }

  let currentState: VotingDerivedState | undefined;
  const stateObserver = {
    next: (state: VotingDerivedState) => (currentState = state),
  };
  const subscription = votingApi.state$.subscribe(stateObserver);

  try {
    while (true) {
      const choice = await rli.question(MAIN_LOOP_QUESTION);
      try {
        switch (choice) {
          case '1': {
            // Vote choice is private — never stored or logged
            const voteInput = (await rli.question('Vote for A or B? ')).trim().toUpperCase();
            if (voteInput === 'A') {
              await votingApi.castVote(VOTE_A);
              logger.info('✅ Vote cast successfully. Your choice remains private.');
            } else if (voteInput === 'B') {
              await votingApi.castVote(VOTE_B);
              logger.info('✅ Vote cast successfully. Your choice remains private.');
            } else {
              logger.error('Invalid choice. Enter A or B.');
            }
            break;
          }
          case '2': {
            const pubKeyHex = await rli.question('Enter voter public key (hex, 64 chars): ');
            const pubKeyBytes = Buffer.from(pubKeyHex, 'hex');
            await votingApi.registerVoter(pubKeyBytes);
            logger.info('✅ Voter registered.');
            break;
          }
          case '3':
            await votingApi.openElection();
            logger.info('✅ Election is now OPEN. Voters can cast their ballots.');
            break;
          case '4':
            await votingApi.closeElection();
            logger.info('✅ Election is now CLOSED. Final results are on-chain.');
            break;
          case '5':
            await displayLedgerState(providers, votingApi.deployedContract, logger);
            break;
          case '6':
            await displayPrivateState(providers, logger);
            break;
          case '7':
            displayDerivedState(currentState, logger);
            break;
          case '8':
            logger.info('Goodbye!');
            return;
          default:
            logger.error(`Invalid choice: ${choice}`);
        }
      } catch (e) {
        logError(logger, e);
        logger.info('Returning to main menu...');
      }
    }
  } finally {
    subscription.unsubscribe();
  }
};

// ─── Wallet Setup ─────────────────────────────────────────────────────────────

const GENESIS_MINT_WALLET_SEED = '0000000000000000000000000000000000000000000000000000000000000001';

const WALLET_LOOP_QUESTION = `
Wallet Options:
  1. Create a fresh wallet (new identity)
  2. Restore wallet from seed phrase
  3. Exit

Your choice: `;

const buildWallet = async (config: Config, rli: Interface, logger: Logger): Promise<string | undefined> => {
  if (config instanceof StandaloneConfig) {
    return GENESIS_MINT_WALLET_SEED;
  }
  while (true) {
    const choice = await rli.question(WALLET_LOOP_QUESTION);
    switch (choice) {
      case '1':
        return toHex(randomBytes(32));
      case '2':
        return await rli.question('Enter your wallet seed: ');
      case '3':
        logger.info('Exiting...');
        return undefined;
      default:
        logger.error(`Invalid choice: ${choice}`);
    }
  }
};

// ─── Entry Point ──────────────────────────────────────────────────────────────

export const run = async (config: Config, testEnv: TestEnvironment, logger: Logger): Promise<void> => {
  const rli = createInterface({ input, output, terminal: true });
  const providersToBeStopped: MidnightWalletProvider[] = [];

  try {
    const envConfiguration = await testEnv.start();
    logger.info(`Environment started: ${JSON.stringify(envConfiguration)}`);

    const seed = await buildWallet(config, rli, logger);
    if (seed === undefined) {
      return;
    }

    const walletProvider = await MidnightWalletProvider.build(logger, envConfiguration, seed);
    providersToBeStopped.push(walletProvider);
    const walletFacade: WalletFacade = walletProvider.wallet;

    await walletProvider.start();

    const unshieldedState = await waitForUnshieldedFunds(logger, walletFacade, envConfiguration, unshieldedToken());
    const nightBalance = unshieldedState.balances[unshieldedToken().raw];
    if (nightBalance === undefined) {
      logger.info('No funds in wallet. Fund it from the faucet, then retry.');
      return;
    }
    logger.info(`💰 NIGHT balance: ${nightBalance}`);

    if (config.generateDust) {
      const dustGeneration = await generateDust(logger, seed, unshieldedState, walletFacade);
      if (dustGeneration) {
        logger.info(`Dust generation submitted: ${dustGeneration}`);
        await syncWallet(logger, walletFacade);
      }
    }

    const zkConfigProvider = new NodeZkConfigProvider<
      'castVote' | 'registerVoter' | 'openElection' | 'closeElection'
    >(config.zkConfigPath);

    const providers: VotingProviders = {
      privateStateProvider: levelPrivateStateProvider<PrivateStateId, VotingPrivateState>({
        privateStateStoreName: config.privateStateStoreName,
        signingKeyStoreName: `${config.privateStateStoreName}-signing-keys`,
        privateStoragePasswordProvider: () => {
          return 'Voting-System-2026!';
        },
        accountId: seed,
      }),
      publicDataProvider: indexerPublicDataProvider(envConfiguration.indexer, envConfiguration.indexerWS),
      zkConfigProvider: zkConfigProvider,
      proofProvider: httpClientProofProvider(envConfiguration.proofServer, zkConfigProvider),
      walletProvider: walletProvider,
      midnightProvider: walletProvider,
    };

    await mainLoop(providers, rli, logger);
  } catch (e) {
    logError(logger, e);
    logger.info('Exiting due to error...');
  } finally {
    try {
      rli.close();
      rli.removeAllListeners();
    } catch (e) {
      logError(logger, e);
    } finally {
      try {
        for (const wallet of providersToBeStopped) {
          logger.info('Stopping wallet...');
          await wallet.stop();
        }
        if (testEnv) {
          logger.info('Stopping test environment...');
          await testEnv.shutdown();
        }
      } catch (e) {
        logError(logger, e);
      }
    }
  }
};

function logError(logger: Logger, e: unknown) {
  if (e instanceof Error) {
    logger.error(`Error: ${e.message}`);
    logger.debug(`Stack: ${e.stack}`);
  } else {
    logger.error(`Unknown error occurred`);
  }
}
