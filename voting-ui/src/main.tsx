/**
 * Private Voting System — Application Entry Point
 *
 * Initializes the React application with the Midnight network ID,
 * Lace wallet connection, and the voting deployment context provider.
 */

import './globals';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { setNetworkId, NetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import App from './App';
import '@midnight-ntwrk/dapp-connector-api';
import * as pino from 'pino';
import { DeployedVotingProvider } from './contexts';

const networkId = (import.meta.env.VITE_NETWORK_ID ?? 'preprod') as NetworkId;

// Set the network ID for all Midnight.js libraries
setNetworkId(networkId);

// Create a pino logger
export const logger = pino.pino({
  level: (import.meta.env.VITE_LOGGING_LEVEL as string) ?? 'info',
});

logger.info(`Private Voting System starting — network: ${networkId}`);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <DeployedVotingProvider logger={logger}>
      <App />
    </DeployedVotingProvider>
  </React.StrictMode>,
);
