/**
 * Private Voting System — Browser Deployed Manager
 *
 * Manages connections to the Midnight network in the browser context,
 * wiring the Lace wallet to the VotingAPI.
 */

import {
  VotingAPI,
  type VotingCircuitKeys,
  type VotingProviders,
  type DeployedVotingAPI,
  VOTE_A,
  VOTE_B,
} from '../../../api/src/index';
import { type ContractAddress, fromHex, toHex } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import {
  BehaviorSubject,
  catchError,
  concatMap,
  filter,
  firstValueFrom,
  interval,
  map,
  type Observable,
  take,
  tap,
  throwError,
  timeout,
} from 'rxjs';
import { pipe as fnPipe } from 'fp-ts/function';
import { type Logger } from 'pino';
import { ConnectedAPI, type InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import semver from 'semver';
import {
  Binding,
  FinalizedTransaction,
  Proof,
  SignatureEnabled,
  Transaction,
  TransactionId,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { VotingPrivateState } from '@midnight-ntwrk/voting-contract';
import { inMemoryPrivateStateProvider } from '../in-memory-private-state-provider';
import { NetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import type { UnboundTransaction } from '@midnight-ntwrk/midnight-js-types';
import { type VoteChoice } from '../../../api/src/common-types';

export interface InProgressDeployment {
  readonly status: 'in-progress';
}

export interface DeployedVotingDeployment {
  readonly status: 'deployed';
  readonly api: DeployedVotingAPI;
}

export interface FailedDeployment {
  readonly status: 'failed';
  readonly error: Error;
}

export type VotingDeployment =
  | InProgressDeployment
  | DeployedVotingDeployment
  | FailedDeployment;

export interface DeployedVotingAPIProvider {
  readonly votingDeployments$: Observable<Array<Observable<VotingDeployment>>>;
  readonly resolve: (contractAddress?: ContractAddress, electionTitle?: string) => Observable<VotingDeployment>;
  readonly getProviders: () => Promise<VotingProviders>;
}

const COMPATIBLE_CONNECTOR_API_VERSION = '4.x';

export class BrowserDeployedVotingManager implements DeployedVotingAPIProvider {
  readonly #deploymentsSubject: BehaviorSubject<Array<BehaviorSubject<VotingDeployment>>>;
  #initializedProviders: Promise<VotingProviders> | undefined;

  constructor(private readonly logger: Logger) {
    this.#deploymentsSubject = new BehaviorSubject<Array<BehaviorSubject<VotingDeployment>>>([]);
    this.votingDeployments$ = this.#deploymentsSubject;
  }

  readonly votingDeployments$: Observable<Array<Observable<VotingDeployment>>>;

  resolve(contractAddress?: ContractAddress, electionTitle?: string): Observable<VotingDeployment> {
    const deployments = this.#deploymentsSubject.value;
    let deployment = deployments.find(
      (d) => d.value.status === 'deployed' && d.value.api.deployedContractAddress === contractAddress,
    );

    if (deployment) return deployment;

    deployment = new BehaviorSubject<VotingDeployment>({ status: 'in-progress' });

    if (contractAddress) {
      void this.joinDeployment(deployment, contractAddress);
    } else {
      void this.deployDeployment(deployment, electionTitle ?? 'Election 2026');
    }

    this.#deploymentsSubject.next([...deployments, deployment]);
    return deployment;
  }

  public getProviders(): Promise<VotingProviders> {
    return this.#initializedProviders ?? (this.#initializedProviders = initializeProviders(this.logger));
  }

  private async deployDeployment(
    deployment: BehaviorSubject<VotingDeployment>,
    title: string,
  ): Promise<void> {
    try {
      const providers = await this.getProviders();
      const api = await VotingAPI.deploy(providers, title, this.logger);
      deployment.next({ status: 'deployed', api });
    } catch (error: unknown) {
      deployment.next({
        status: 'failed',
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  private async joinDeployment(
    deployment: BehaviorSubject<VotingDeployment>,
    contractAddress: ContractAddress,
  ): Promise<void> {
    try {
      const providers = await this.getProviders();
      const api = await VotingAPI.join(providers, contractAddress, this.logger);
      deployment.next({ status: 'deployed', api });
    } catch (error: unknown) {
      deployment.next({
        status: 'failed',
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }
}

const initializeProviders = async (logger: Logger): Promise<VotingProviders> => {
  const networkId = import.meta.env.VITE_NETWORK_ID as NetworkId;
  const connectedAPI = await connectToWallet(logger, networkId);
  const zkConfigPath = window.location.origin;
  const keyMaterialProvider = new FetchZkConfigProvider<VotingCircuitKeys>(zkConfigPath, fetch.bind(window));
  const config = await connectedAPI.getConfiguration();
  const inMemoryPrivateState = inMemoryPrivateStateProvider<string, VotingPrivateState>();
  const shieldedAddresses = await connectedAPI.getShieldedAddresses();

  return {
    privateStateProvider: inMemoryPrivateState,
    zkConfigProvider: keyMaterialProvider,
    proofProvider: httpClientProofProvider(config.proverServerUri!, keyMaterialProvider),
    publicDataProvider: indexerPublicDataProvider(config.indexerUri, config.indexerWsUri),
    walletProvider: {
      getCoinPublicKey(): string {
        return shieldedAddresses.shieldedCoinPublicKey;
      },
      getEncryptionPublicKey(): string {
        return shieldedAddresses.shieldedEncryptionPublicKey;
      },
      balanceTx: async (tx: UnboundTransaction, ttl?: Date): Promise<FinalizedTransaction> => {
        try {
          const serializedTx = toHex(tx.serialize());
          const received = await connectedAPI.balanceUnsealedTransaction(serializedTx);
          return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
            'signature',
            'proof',
            'binding',
            fromHex(received.tx),
          );
        } catch (e) {
          logger.error({ error: e }, 'Error balancing transaction via wallet');
          throw e;
        }
      },
    },
    midnightProvider: {
      submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
        await connectedAPI.submitTransaction(toHex(tx.serialize()));
        const txIdentifiers = tx.identifiers();
        return txIdentifiers[0];
      },
    },
  };
};

const getFirstCompatibleWallet = (): InitialAPI | undefined => {
  if (!window.midnight) return undefined;

  const wallets = Object.values(window.midnight).filter(
    (wallet): wallet is InitialAPI =>
      !!wallet &&
      typeof wallet === 'object' &&
      'apiVersion' in wallet &&
      semver.satisfies(wallet.apiVersion, COMPATIBLE_CONNECTOR_API_VERSION),
  );

  // Strictly find Lace and ignore 1AM
  const trueLace = wallets.find(w => w.name && w.name.toLowerCase().includes('lace') && !w.name.toLowerCase().includes('1am'));
  if (trueLace) return trueLace;

  // Fallback to anything that isn't 1AM if exact Lace isn't found
  const non1AM = wallets.find(w => w.name && !w.name.toLowerCase().includes('1am'));
  if (non1AM) return non1AM;

  // Last resort
  return wallets[0];
};

const connectToWallet = (logger: Logger, networkId: string): Promise<ConnectedAPI> => {
  return firstValueFrom(
    fnPipe(
      interval(100),
      map(() => getFirstCompatibleWallet()),
      tap((connectorAPI) => logger.info(connectorAPI, 'Check for Lace wallet')),
      filter((connectorAPI): connectorAPI is InitialAPI => !!connectorAPI),
      take(1),
      timeout({
        first: 1_000,
        with: () =>
          throwError(() => {
            logger.error('Could not find Lace wallet connector API');
            return new Error('Could not find Midnight Lace wallet. Is the extension installed?');
          }),
      }),
      concatMap(async (initialAPI) => {
        const connectedAPI = await initialAPI.connect(networkId);
        const connectionStatus = await connectedAPI.getConnectionStatus();
        logger.info(connectionStatus, 'Wallet connected');
        return connectedAPI;
      }),
      timeout({
        first: 5_000,
        with: () =>
          throwError(() => {
            logger.error('Lace wallet has failed to respond');
            return new Error('Midnight Lace wallet is not responding. Is it enabled?');
          }),
      }),
      catchError((error, apis) =>
        error
          ? throwError(() => {
              logger.error('Unable to connect to Lace: ' + error);
              const msg = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Application is not authorized by the wallet.';
              return new Error(msg);
            })
          : apis,
      ),
    ),
  );
};
