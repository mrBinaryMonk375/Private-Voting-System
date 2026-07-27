import React, { type PropsWithChildren, createContext } from 'react';
import { type DeployedVotingAPIProvider, BrowserDeployedVotingManager } from './BrowserDeployedVotingManager';
import { type Logger } from 'pino';

export type { VotingDeployment, DeployedVotingDeployment } from './BrowserDeployedVotingManager';

export const DeployedVotingContext = createContext<DeployedVotingAPIProvider | undefined>(undefined);

export type DeployedVotingProviderProps = PropsWithChildren<{ logger: Logger }>;

export const DeployedVotingProvider: React.FC<Readonly<DeployedVotingProviderProps>> = ({ logger, children }) => (
  <DeployedVotingContext.Provider value={new BrowserDeployedVotingManager(logger)}>
    {children}
  </DeployedVotingContext.Provider>
);
