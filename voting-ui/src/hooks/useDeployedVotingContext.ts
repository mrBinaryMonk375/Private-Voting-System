import { useContext, useEffect, useState } from 'react';
import { type Observable } from 'rxjs';
import { DeployedVotingContext, type VotingDeployment } from '../contexts';
import { type ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';

export interface UseDeployedVotingResult {
  resolve: (contractAddress?: ContractAddress, title?: string) => Observable<VotingDeployment>;
  deployments: Array<Observable<VotingDeployment>>;
  getProviders: () => Promise<any>;
}

export const useDeployedVotingContext = (): UseDeployedVotingResult => {
  const provider = useContext(DeployedVotingContext);
  const [deployments, setDeployments] = useState<Array<Observable<VotingDeployment>>>([]);

  useEffect(() => {
    if (!provider) return;
    const subscription = provider.votingDeployments$.subscribe(setDeployments);
    return () => subscription.unsubscribe();
  }, [provider]);

  if (!provider) {
    throw new Error('useDeployedVotingContext must be used inside DeployedVotingProvider');
  }

  return {
    resolve: (contractAddress, title) => provider.resolve(contractAddress, title),
    getProviders: () => provider.getProviders(),
    deployments,
  };
};
