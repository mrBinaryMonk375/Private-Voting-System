/**
 * Private Voting System — Main Application
 *
 * A modern, smooth, animated voting DApp using framer-motion.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { type Observable } from 'rxjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Fingerprint, Lock, CheckCircle2, ChevronRight, Check, Zap, Eye, Activity, UserPlus, Play, Square, Info } from 'lucide-react';
import { useDeployedVotingContext } from './hooks';
import { type VotingDeployment, type DeployedVotingDeployment } from './contexts';
import { type VotingDerivedState } from '../../api/src/common-types';
import { ElectionState } from '../../contract/src/managed/voting/contract/index.js';
import { VOTE_A, VOTE_B, type VoteChoice } from '../../api/src/common-types';

// ─── Modern Theme & Styles ───────────────────────────────────────────────────

const theme = {
  colors: {
    primary: '#ff3366',
    secondary: '#ff9933',
    accent: '#00ccff',
    success: '#00e676',
    danger: '#ff1744',
    dark: '#0f0c29',
    glass: 'rgba(255, 255, 255, 0.05)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    text: '#ffffff',
    textMuted: '#b0bec5',
  },
};

const styles = {
  app: {
    minHeight: '100vh',
    background: `radial-gradient(circle at 15% 50%, rgba(255, 51, 102, 0.15), transparent 40%),
                 radial-gradient(circle at 85% 30%, rgba(0, 204, 255, 0.15), transparent 40%),
                 radial-gradient(circle at 50% 80%, rgba(255, 153, 51, 0.1), transparent 40%),
                 ${theme.colors.dark}`,
    color: theme.colors.text,
    fontFamily: "'Outfit', 'Inter', sans-serif",
    overflowX: 'hidden',
  } as React.CSSProperties,

  header: {
    borderBottom: `1px solid ${theme.colors.glassBorder}`,
    background: 'rgba(15, 12, 41, 0.6)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    padding: '0 2rem',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
  } as React.CSSProperties,

  headerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '80px',
  } as React.CSSProperties,

  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '1.25rem',
    fontWeight: 800,
    letterSpacing: '-0.5px',
  } as React.CSSProperties,

  gradientText: {
    background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  } as React.CSSProperties,

  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '4rem 2rem',
  } as React.CSSProperties,

  glassCard: {
    background: theme.colors.glass,
    border: `1px solid ${theme.colors.glassBorder}`,
    borderRadius: '24px',
    padding: '2.5rem',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
  } as React.CSSProperties,

  input: {
    width: '100%',
    padding: '16px 20px',
    borderRadius: '16px',
    border: `1px solid ${theme.colors.glassBorder}`,
    background: 'rgba(0,0,0,0.2)',
    color: theme.colors.text,
    fontSize: '1rem',
    outline: 'none',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
  } as React.CSSProperties,

  button: {
    padding: '16px 32px',
    borderRadius: '16px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'transform 0.2s',
    fontFamily: 'inherit',
  } as React.CSSProperties,
};

// ─── Framer Motion Variants ───────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

// ─── Helper Components ────────────────────────────────────────────────────────

const Spinner: React.FC = () => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
    style={{
      width: '20px',
      height: '20px',
      border: '3px solid rgba(255,255,255,0.3)',
      borderTop: '3px solid #fff',
      borderRadius: '50%',
    }}
  />
);

const AnimatedButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'success' }> = ({ children, variant = 'primary', style, ...props }) => {
  const backgrounds = {
    primary: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
    secondary: theme.colors.glass,
    danger: theme.colors.danger,
    success: theme.colors.success,
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{
        ...styles.button,
        background: backgrounds[variant],
        color: variant === 'secondary' ? theme.colors.text : '#fff',
        border: variant === 'secondary' ? `1px solid ${theme.colors.glassBorder}` : 'none',
        boxShadow: variant === 'primary' ? `0 8px 20px -5px ${theme.colors.primary}80` : 'none',
        opacity: props.disabled ? 0.5 : 1,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

// ─── Join / Deploy Panel ──────────────────────────────────────────────────────

const JoinDeployPanel: React.FC<{ onJoin: (address: string) => void; onDeploy: (title: string) => void; loading: boolean }> = ({ onJoin, onDeploy, loading }) => {
  const [contractAddress, setContractAddress] = useState(import.meta.env.VITE_CONTRACT_ADDRESS || '');
  const [electionTitle, setElectionTitle] = useState('');
  const [mode, setMode] = useState<'join' | 'deploy'>('join');

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" style={{ ...styles.glassCard, maxWidth: '500px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '20px' }}>
        {(['join', 'deploy'] as const).map((m) => (
          <motion.div
            key={m}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '12px',
              borderRadius: '16px',
              cursor: 'pointer',
              fontWeight: 600,
              position: 'relative',
              color: mode === m ? '#fff' : theme.colors.textMuted,
            }}
            onClick={() => setMode(m)}
          >
            {mode === m && (
              <motion.div
                layoutId="activeTab"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '14px',
                  border: `1px solid ${theme.colors.glassBorder}`,
                }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1 }}>{m === 'join' ? 'Join Election' : 'Deploy New'}</span>
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {mode === 'join' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: theme.colors.textMuted, fontSize: '0.9rem' }}>Contract Address</label>
                <input
                  style={styles.input}
                  placeholder="Enter 64-character hex address"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                />
              </div>
              <AnimatedButton onClick={() => onJoin(contractAddress)} disabled={loading || !contractAddress}>
                {loading ? <Spinner /> : <><Zap size={18} /> Connect</>}
              </AnimatedButton>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: theme.colors.textMuted, fontSize: '0.9rem' }}>Election Title</label>
                <input
                  style={styles.input}
                  placeholder="e.g., DA0 Proposal #42"
                  value={electionTitle}
                  onChange={(e) => setElectionTitle(e.target.value)}
                />
              </div>
              <AnimatedButton onClick={() => onDeploy(electionTitle)} disabled={loading || !electionTitle}>
                {loading ? <Spinner /> : <><Zap size={18} /> Deploy Election</>}
              </AnimatedButton>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Election Dashboard ───────────────────────────────────────────────────────

interface ElectionDashboardProps {
  state: VotingDerivedState;
  contractAddress: string;
  onCastVote: (choice: VoteChoice) => Promise<void>;
  onRegisterVoter: (pubKey: string) => Promise<void>;
  onOpenElection: () => Promise<void>;
  onCloseElection: () => Promise<void>;
}

const ElectionDashboard: React.FC<ElectionDashboardProps> = ({ state, contractAddress, onCastVote, onRegisterVoter, onOpenElection, onCloseElection }) => {
  const [selectedVote, setSelectedVote] = useState<VoteChoice | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const withLoading = async (key: string, fn: () => Promise<void>) => {
    setLoading(key);
    try { await fn(); } finally { setLoading(null); }
  };

  const total = Number(state.totalVotes);
  const pctA = total > 0 ? (Number(state.votesForA) / total) * 100 : 0;
  const pctB = total > 0 ? (Number(state.votesForB) / total) * 100 : 0;
  const turnout = Number(state.registeredVoterCount) > 0 ? (Number(state.votedCount) / Number(state.registeredVoterCount)) * 100 : 0;

  const statusConfig = {
    [ElectionState.REGISTRATION]: { color: theme.colors.secondary, label: 'Registration Open', icon: UserPlus },
    [ElectionState.OPEN]: { color: theme.colors.success, label: 'Voting Live', icon: Activity },
    [ElectionState.CLOSED]: { color: theme.colors.accent, label: 'Election Closed', icon: Square },
  }[state.electionState];

  const StatusIcon = statusConfig.icon;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header Card */}
      <motion.div variants={fadeUp} style={{ ...styles.glassCard, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 1rem 0', letterSpacing: '-1px' }}>{state.electionTitle}</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ padding: '6px 16px', borderRadius: '30px', background: `${statusConfig.color}20`, color: statusConfig.color, border: `1px solid ${statusConfig.color}40`, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
              <StatusIcon size={16} /> {statusConfig.label}
            </span>
            {state.isAdmin && <span style={{ padding: '6px 16px', borderRadius: '30px', background: `${theme.colors.primary}20`, color: theme.colors.primary, border: `1px solid ${theme.colors.primary}40`, fontWeight: 600, fontSize: '0.9rem' }}>👑 Admin</span>}
            {state.isRegistered && !state.isAdmin && <span style={{ padding: '6px 16px', borderRadius: '30px', background: `${theme.colors.accent}20`, color: theme.colors.accent, border: `1px solid ${theme.colors.accent}40`, fontWeight: 600, fontSize: '0.9rem' }}>✅ Registered</span>}
          </div>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem 1.5rem', borderRadius: '16px', border: `1px solid ${theme.colors.glassBorder}` }}>
          <div style={{ color: theme.colors.textMuted, fontSize: '0.8rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Contract Address</div>
          <div style={{ fontFamily: 'monospace', color: theme.colors.accent }}>{contractAddress.substring(0, 12)}...{contractAddress.substring(contractAddress.length - 8)}</div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        {[
          { label: 'Registered Voters', value: state.registeredVoterCount.toString() },
          { label: 'Total Votes Cast', value: state.votedCount.toString() },
          { label: 'Turnout', value: `${turnout.toFixed(1)}%` },
        ].map((stat, i) => (
          <div key={i} style={{ ...styles.glassCard, padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', fontWeight: 900, ...styles.gradientText, marginBottom: '8px', lineHeight: 1 }}>{stat.value}</div>
            <div style={{ color: theme.colors.textMuted, fontSize: '0.9rem', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{stat.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Main Action Area */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* Voting / Results Panel */}
        <motion.div variants={fadeUp} style={{ ...styles.glassCard, gridColumn: state.electionState === ElectionState.CLOSED ? '1 / -1' : 'auto' }}>
          
          {state.electionState === ElectionState.CLOSED ? (
            <div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}><CheckCircle2 color={theme.colors.success} /> Final Results</h3>
              {[
                { label: 'Candidate A', votes: state.votesForA, pct: pctA, color: theme.colors.primary },
                { label: 'Candidate B', votes: state.votesForB, pct: pctB, color: theme.colors.secondary },
              ].map((cand, i) => (
                <div key={i} style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '1.1rem', fontWeight: 600 }}>
                    <span>{cand.label}</span>
                    <span style={{ color: cand.color }}>{cand.votes.toString()} ({cand.pct.toFixed(1)}%)</span>
                  </div>
                  <div style={{ height: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cand.pct}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      style={{ height: '100%', background: cand.color, borderRadius: '8px' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : state.electionState === ElectionState.OPEN && state.isRegistered && !state.hasVoted ? (
            <div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}><Fingerprint color={theme.colors.accent} /> Cast Your Vote</h3>
              <p style={{ color: theme.colors.textMuted, marginBottom: '2rem', lineHeight: 1.6 }}>Your vote is encrypted using Zero-Knowledge proofs. Your identity is completely shielded.</p>
              
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  { choice: VOTE_A, label: 'Candidate A', color: theme.colors.primary },
                  { choice: VOTE_B, label: 'Candidate B', color: theme.colors.secondary },
                ].map((cand) => (
                  <motion.div
                    key={cand.label}
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedVote(cand.choice)}
                    style={{
                      flex: 1,
                      padding: '2rem 1rem',
                      borderRadius: '20px',
                      border: `2px solid ${selectedVote === cand.choice ? cand.color : theme.colors.glassBorder}`,
                      background: selectedVote === cand.choice ? `${cand.color}20` : 'rgba(0,0,0,0.2)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      boxShadow: selectedVote === cand.choice ? `0 0 30px ${cand.color}40` : 'none',
                    }}
                  >
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: selectedVote === cand.choice ? cand.color : theme.colors.text }}>{cand.label}</div>
                  </motion.div>
                ))}
              </div>
              <AnimatedButton
                style={{ width: '100%' }}
                disabled={selectedVote === null || loading === 'vote'}
                onClick={() => selectedVote !== null && withLoading('vote', () => onCastVote(selectedVote))}
              >
                {loading === 'vote' ? <Spinner /> : <><Lock size={18} /> Submit Private Vote</>}
              </AnimatedButton>
            </div>
          ) : state.hasVoted ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} style={{ background: `${theme.colors.success}20`, width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: theme.colors.success }}>
                <Check size={40} strokeWidth={3} />
              </motion.div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Vote Securely Cast</h3>
              <p style={{ color: theme.colors.textMuted }}>Your Zero-Knowledge proof has been verified on the Midnight blockchain. Results will be revealed when the election closes.</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <Info size={48} color={theme.colors.secondary} style={{ margin: '0 auto 1.5rem', opacity: 0.8 }} />
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Waiting...</h3>
              <p style={{ color: theme.colors.textMuted }}>
                {state.electionState === ElectionState.REGISTRATION ? 'The election is currently in the registration phase. Voting has not yet started.' : 'You are not registered for this election.'}
              </p>
            </div>
          )}
        </motion.div>

        {/* Admin Controls */}
        {state.isAdmin && (
          <motion.div variants={fadeUp} style={{ ...styles.glassCard, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>⚙️ Admin Panel</h3>
              
              {state.electionState === ElectionState.REGISTRATION && (
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: theme.colors.textMuted, fontSize: '0.9rem' }}>Register Voter (Public Key)</label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <input id="voterKey" style={styles.input} placeholder="Hex key..." />
                    <AnimatedButton onClick={() => {
                      const el = document.getElementById('voterKey') as HTMLInputElement;
                      withLoading('register', () => onRegisterVoter(el.value));
                    }} disabled={loading === 'register'} style={{ padding: '0 24px' }}>
                      {loading === 'register' ? <Spinner /> : <UserPlus size={20} />}
                    </AnimatedButton>
                  </div>
                </div>
              )}
            </div>

            <div>
              {state.electionState === ElectionState.REGISTRATION && (
                <AnimatedButton variant="success" style={{ width: '100%' }} onClick={() => withLoading('open', onOpenElection)} disabled={loading === 'open'}>
                  {loading === 'open' ? <Spinner /> : <><Play size={18} /> Open Election</>}
                </AnimatedButton>
              )}
              {state.electionState === ElectionState.OPEN && (
                <AnimatedButton variant="danger" style={{ width: '100%' }} onClick={() => withLoading('close', onCloseElection)} disabled={loading === 'close'}>
                  {loading === 'close' ? <Spinner /> : <><Square size={18} /> Close Election</>}
                </AnimatedButton>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────

export const App: React.FC = () => {
  const { resolve, getProviders } = useDeployedVotingContext();
  const [deployment$, setDeployment$] = useState<Observable<VotingDeployment> | null>(null);
  const [deployment, setDeployment] = useState<VotingDeployment | null>(null);
  const [votingState, setVotingState] = useState<VotingDerivedState | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Wallet Connection State
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const connectWallet = async () => {
    setIsConnectingWallet(true);
    setError(null);
    try {
      const providers = await getProviders();
      setIsWalletConnected(true);
      setWalletAddress(providers.walletProvider.getCoinPublicKey());
    } catch (e: any) {
      setError(e.message || "Failed to connect to wallet.");
      setIsWalletConnected(false);
      setWalletAddress(null);
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const disconnectWallet = () => {
    setIsWalletConnected(false);
    setWalletAddress(null);
    setDeployment$(null);
    setDeployment(null);
    setError(null);
  };

  useEffect(() => {
    if (!deployment$) return;
    const sub = deployment$.subscribe(setDeployment);
    return () => sub.unsubscribe();
  }, [deployment$]);

  useEffect(() => {
    if (deployment?.status !== 'deployed') { setVotingState(null); return; }
    const sub = deployment.api.state$.subscribe(setVotingState);
    return () => sub.unsubscribe();
  }, [deployment]);

  useEffect(() => {
    if (deployment?.status === 'failed') setError((deployment as any).error.message);
  }, [deployment]);

  const handleAction = (fn: () => VotingDeployment) => {
    setError(null);
    try { setDeployment$(() => resolve() /* hack to satisfy TS, real logic is inside fn */ as any); fn(); } catch (e: any) { setError(e.message); }
  };

  const network = import.meta.env.VITE_NETWORK_ID || 'preprod';

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <div style={{ background: theme.colors.text, color: theme.colors.dark, width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={24} />
            </div>
            <span>Private Voting</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ padding: '6px 16px', borderRadius: '30px', background: 'rgba(255,255,255,0.1)', border: `1px solid ${theme.colors.glassBorder}`, fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={14} color={theme.colors.accent} /> {network.toUpperCase()}
            </span>
            
            {isWalletConnected ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: theme.colors.textMuted, fontFamily: 'monospace' }}>
                  {walletAddress ? `${walletAddress.substring(0, 8)}...${walletAddress.substring(walletAddress.length - 6)}` : 'Connected'}
                </span>
                <AnimatedButton 
                  variant="danger"
                  onClick={disconnectWallet}
                  style={{ padding: '6px 12px', fontSize: '0.85rem', borderRadius: '30px' }}
                >
                  Disconnect
                </AnimatedButton>
              </div>
            ) : (
              <AnimatedButton 
                variant="primary"
                onClick={connectWallet}
                disabled={isConnectingWallet}
                style={{ padding: '8px 16px', fontSize: '0.9rem', borderRadius: '30px' }}
              >
                {isConnectingWallet ? <Spinner /> : <><Zap size={16} /> Connect Wallet</>}
              </AnimatedButton>
            )}
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <AnimatePresence mode="wait">
          {!deployment && (
            <motion.div key="hero" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.8, ease: "easeOut" }} style={{ textAlign: 'center', marginBottom: '5rem' }}>
              <h1 style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-2px' }}>
                The Future of <br /><span style={styles.gradientText}>Secure Voting.</span>
              </h1>
              <p style={{ fontSize: '1.25rem', color: theme.colors.textMuted, maxWidth: '600px', margin: '0 auto 3rem', lineHeight: 1.6 }}>
                Cast your ballot with absolute privacy. Verify election integrity with Zero-Knowledge proofs on the Midnight blockchain.
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                {[
                  { icon: Shield, text: 'Absolute Privacy' },
                  { icon: Eye, text: 'Verifiable Results' },
                  { icon: Lock, text: 'Cryptographic Security' }
                ].map((Feature, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.colors.textMuted, fontWeight: 500 }}>
                    <Feature.icon size={20} color={theme.colors.primary} />
                    {Feature.text}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ ...styles.glassCard, background: `${theme.colors.danger}20`, border: `1px solid ${theme.colors.danger}50`, color: theme.colors.danger, marginBottom: '2rem', textAlign: 'center' }}>
              <h3 style={{ marginBottom: '8px' }}>Connection Error</h3>
              <p>{error}</p>
              <AnimatedButton variant="secondary" style={{ margin: '1rem auto 0' }} onClick={() => { setDeployment$(null); setDeployment(null); setError(null); }}>Try Again</AnimatedButton>
            </motion.div>
          )}

          {deployment?.status === 'in-progress' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', padding: '4rem 0' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} style={{ display: 'inline-block', marginBottom: '2rem' }}>
                <Zap size={48} color={theme.colors.accent} />
              </motion.div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: theme.colors.textMuted }}>Establishing Secure Connection...</h2>
            </motion.div>
          )}

          {!deployment && (
            <JoinDeployPanel
              onJoin={(addr) => { setError(null); try { setDeployment$(() => resolve(addr as any)); } catch(e:any) { setError(e.message); } }}
              onDeploy={(title) => { setError(null); try { setDeployment$(() => resolve(undefined, title)); } catch(e:any) { setError(e.message); } }}
              loading={false}
            />
          )}

          {deployment?.status === 'deployed' && votingState && (
            <ElectionDashboard
              state={votingState}
              contractAddress={(deployment as DeployedVotingDeployment).api.deployedContractAddress}
              onCastVote={(c) => (deployment as DeployedVotingDeployment).api.castVote(c)}
              onRegisterVoter={(pk) => (deployment as DeployedVotingDeployment).api.registerVoter(Buffer.from(pk, 'hex'))}
              onOpenElection={() => (deployment as DeployedVotingDeployment).api.openElection()}
              onCloseElection={() => (deployment as DeployedVotingDeployment).api.closeElection()}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;
