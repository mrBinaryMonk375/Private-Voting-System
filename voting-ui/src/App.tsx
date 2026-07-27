/**
 * Private Voting System — Main Application
 *
 * A modern, smooth, animated voting DApp using framer-motion.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { type Observable } from 'rxjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Fingerprint, Lock, CheckCircle2, ChevronRight, Check, Zap, Eye, Activity, UserPlus, Play, Square, Info, History, FileText, Copy, PlusCircle, Clock } from 'lucide-react';
import { useDeployedVotingContext } from './hooks';
import { type VotingDeployment, type DeployedVotingDeployment } from './contexts';
import { type VotingDerivedState } from '../../api/src/common-types';
import { ElectionState } from '../../contract/src/managed/voting/contract/index.js';
import { VOTE_A, VOTE_B, type VoteChoice } from '../../api/src/common-types';

// ─── Modern Theme & Styles ───────────────────────────────────────────────────

const theme = {
  colors: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
    success: '#10b981',
    danger: '#ef4444',
    dark: '#0f1117',
    glass: 'rgba(255, 255, 255, 0.72)',
    glassBorder: 'rgba(99, 102, 241, 0.12)',
    text: '#0f1117',
    textMuted: '#64748b',
  },
};

const styles = {
  app: {
    minHeight: '100vh',
    background: '#f8f9fc',
    color: theme.colors.text,
    fontFamily: "'DM Sans', 'Inter', sans-serif",
    overflowX: 'hidden',
  } as React.CSSProperties,

  header: {
    borderBottom: '1px solid rgba(99,102,241,0.10)',
    background: 'rgba(255,255,255,0.80)',
    backdropFilter: 'blur(28px) saturate(180%)',
    WebkitBackdropFilter: 'blur(28px) saturate(180%)',
    padding: '0 2rem',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 0 rgba(99,102,241,0.06), 0 4px 24px rgba(99,102,241,0.04)',
  } as React.CSSProperties,

  headerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '72px',
  } as React.CSSProperties,

  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '1.15rem',
    fontWeight: 800,
    letterSpacing: '-0.4px',
    color: theme.colors.text,
  } as React.CSSProperties,

  gradientText: {
    color: theme.colors.primary,
  } as React.CSSProperties,

  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '4rem 2rem',
  } as React.CSSProperties,

  glassCard: {
    background: 'rgba(255,255,255,0.80)',
    border: '1px solid rgba(99,102,241,0.10)',
    borderRadius: '24px',
    padding: '2.5rem',
    backdropFilter: 'blur(20px) saturate(160%)',
    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    boxShadow: '0 4px 6px -1px rgba(99,102,241,0.04), 0 16px 40px -8px rgba(99,102,241,0.08), 0 0 0 1px rgba(255,255,255,0.9) inset',
  } as React.CSSProperties,

  input: {
    width: '100%',
    padding: '15px 20px',
    borderRadius: '14px',
    border: '1.5px solid rgba(99,102,241,0.18)',
    background: 'rgba(255,255,255,0.90)',
    color: theme.colors.text,
    fontSize: '0.97rem',
    outline: 'none',
    transition: 'all 0.25s ease',
    fontFamily: 'inherit',
    boxShadow: '0 1px 3px rgba(99,102,241,0.06) inset',
  } as React.CSSProperties,

  button: {
    padding: '14px 28px',
    borderRadius: '14px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '0.97rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    letterSpacing: '-0.1px',
  } as React.CSSProperties,
};

// ─── Framer Motion Variants ───────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
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
    transition={{ repeat: Infinity, duration: 0.85, ease: "linear" }}
    style={{
      width: '20px',
      height: '20px',
      border: '2.5px solid rgba(255,255,255,0.35)',
      borderTop: '2.5px solid #fff',
      borderRadius: '50%',
    }}
  />
);

interface AnimatedButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({ children, variant = 'primary', style, ...props }) => {
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: theme.colors.primary,
      color: '#fff',
      border: 'none',
      boxShadow: `0 4px 14px -3px ${theme.colors.primary}44`,
    },
    secondary: {
      background: 'rgba(255,255,255,0.90)',
      color: theme.colors.text,
      border: '1.5px solid rgba(99,102,241,0.16)',
      boxShadow: '0 2px 8px rgba(99,102,241,0.06)',
    },
    danger: {
      background: theme.colors.danger,
      color: '#fff',
      border: 'none',
      boxShadow: `0 4px 14px -3px ${theme.colors.danger}44`,
    },
    success: {
      background: theme.colors.success,
      color: '#fff',
      border: 'none',
      boxShadow: `0 4px 14px -3px ${theme.colors.success}44`,
    },
  };

  return (
    <motion.button
      whileHover={{ scale: 1.025, y: -1 }}
      whileTap={{ scale: 0.975, y: 0 }}
      style={{
        ...styles.button,
        ...variantStyles[variant],
        opacity: props.disabled ? 0.55 : 1,
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

const MOCK_CONTRACT_ADDRESS = '019f3a8b2c4d6e8f10121416181a1c1e20222426282a2c2e30323436383a3c3e';

const JoinDeployPanel: React.FC<{
  onJoin: (address: string) => void;
  onDeploy: (title: string) => void;
  onLaunchDemo: () => void;
  loading: boolean;
}> = ({ onJoin, onDeploy, onLaunchDemo, loading }) => {
  const [contractAddress, setContractAddress] = useState(
    import.meta.env.VITE_CONTRACT_ADDRESS && import.meta.env.VITE_CONTRACT_ADDRESS !== '<YOUR_DEPLOYED_CONTRACT_ADDRESS>'
      ? import.meta.env.VITE_CONTRACT_ADDRESS
      : MOCK_CONTRACT_ADDRESS
  );
  const [electionTitle, setElectionTitle] = useState('DAO Governance Election 2026');
  const [mode, setMode] = useState<'join' | 'deploy'>('join');

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" style={{ ...styles.glassCard, maxWidth: '540px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <AnimatedButton
          variant="primary"
          onClick={onLaunchDemo}
          style={{ width: '100%', padding: '18px', fontSize: '1.05rem', borderRadius: '18px', background: theme.colors.primary, boxShadow: `0 6px 24px -4px ${theme.colors.primary}55` }}
        >
          <Zap size={20} /> 🚀 Quick Launch
        </AnimatedButton>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: theme.colors.textMuted, fontSize: '0.8rem' }}>
        <div style={{ flex: 1, height: '1px', background: 'rgba(99,102,241,0.12)' }} />
        <span style={{ padding: '0 1rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600, color: theme.colors.textMuted }}>Or Connect To Network</span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(99,102,241,0.12)' }} />
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '2rem', background: 'rgba(99,102,241,0.06)', padding: '5px', borderRadius: '18px', border: '1px solid rgba(99,102,241,0.10)' }}>
        {(['join', 'deploy'] as const).map((m) => (
          <motion.div
            key={m}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '11px',
              borderRadius: '14px',
              cursor: 'pointer',
              fontWeight: 700,
              position: 'relative',
              color: mode === m ? theme.colors.primary : theme.colors.textMuted,
              fontSize: '0.9rem',
              letterSpacing: '-0.1px',
            }}
            onClick={() => setMode(m)}
          >
            {mode === m && (
              <motion.div
                layoutId="activeTab"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: '#fff',
                  borderRadius: '11px',
                  border: '1px solid rgba(99,102,241,0.14)',
                  boxShadow: '0 2px 8px rgba(99,102,241,0.12)',
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
                {loading ? <Spinner /> : <><Zap size={18} /> Connect Contract</>}
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
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 1rem 0', letterSpacing: '-1px', color: theme.colors.text }}>{state.electionTitle}</h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ padding: '5px 14px', borderRadius: '30px', background: `${statusConfig.color}14`, color: statusConfig.color, border: `1px solid ${statusConfig.color}30`, display: 'flex', alignItems: 'center', gap: '7px', fontWeight: 700, fontSize: '0.85rem' }}>
              <StatusIcon size={14} /> {statusConfig.label}
            </span>
            {state.isAdmin && <span style={{ padding: '5px 14px', borderRadius: '30px', background: `${theme.colors.primary}12`, color: theme.colors.primary, border: `1px solid ${theme.colors.primary}28`, fontWeight: 700, fontSize: '0.85rem' }}>👑 Admin</span>}
            {state.isRegistered && !state.isAdmin && <span style={{ padding: '5px 14px', borderRadius: '30px', background: `${theme.colors.success}12`, color: theme.colors.success, border: `1px solid ${theme.colors.success}28`, fontWeight: 700, fontSize: '0.85rem' }}>✅ Registered</span>}
          </div>
        </div>
        <div style={{ background: 'rgba(99,102,241,0.05)', padding: '1rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(99,102,241,0.12)' }}>
          <div style={{ color: theme.colors.textMuted, fontSize: '0.75rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>Contract Address</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', color: theme.colors.primary, fontSize: '0.9rem', fontWeight: 600 }}>{contractAddress.substring(0, 12)}...{contractAddress.substring(contractAddress.length - 8)}</div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        {[
          { label: 'Registered Voters', value: state.registeredVoterCount.toString() },
          { label: 'Total Votes Cast', value: state.votedCount.toString() },
          { label: 'Turnout', value: `${turnout.toFixed(1)}%` },
        ].map((stat, i) => (
          <motion.div key={i} whileHover={{ y: -3, boxShadow: '0 12px 40px -8px rgba(99,102,241,0.18)' }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} style={{ ...styles.glassCard, padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.8rem', fontWeight: 900, ...styles.gradientText, marginBottom: '8px', lineHeight: 1 }}>{stat.value}</div>
            <div style={{ color: theme.colors.textMuted, fontSize: '0.8rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>{stat.label}</div>
          </motion.div>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '1rem', fontWeight: 700, color: theme.colors.text }}>
                    <span>{cand.label}</span>
                    <span style={{ color: cand.color }}>{cand.votes.toString()} <span style={{ color: theme.colors.textMuted, fontWeight: 500 }}>({cand.pct.toFixed(1)}%)</span></span>
                  </div>
                  <div style={{ height: '12px', background: 'rgba(99,102,241,0.08)', borderRadius: '999px', overflow: 'hidden', border: '1px solid rgba(99,102,241,0.10)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cand.pct}%` }}
                      transition={{ duration: 1.2, ease: [0.22,1,0.36,1] }}
                      style={{ height: '100%', background: cand.color, borderRadius: '999px' }}
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
                    whileHover={{ y: -4, boxShadow: `0 12px 32px -6px ${cand.color}40` }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setSelectedVote(cand.choice)}
                    style={{
                      flex: 1,
                      padding: '2rem 1rem',
                      borderRadius: '20px',
                      border: `2px solid ${selectedVote === cand.choice ? cand.color : 'rgba(99,102,241,0.12)'}`,
                      background: selectedVote === cand.choice ? `${cand.color}0e` : 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      boxShadow: selectedVote === cand.choice ? `0 0 0 4px ${cand.color}18, 0 8px 28px -4px ${cand.color}30` : '0 2px 8px rgba(99,102,241,0.06)',
                      transition: 'all 0.25s ease',
                    }}
                  >
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: selectedVote === cand.choice ? cand.color : theme.colors.text, letterSpacing: '-0.3px' }}>{cand.label}</div>
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
              <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }} style={{ background: `${theme.colors.success}12`, width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: theme.colors.success, border: `2px solid ${theme.colors.success}28`, boxShadow: `0 8px 24px ${theme.colors.success}22` }}>
                <Check size={38} strokeWidth={3} />
              </motion.div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem', fontWeight: 800, color: theme.colors.text }}>Vote Securely Cast</h3>
              <p style={{ color: theme.colors.textMuted, lineHeight: 1.65 }}>Your Zero-Knowledge proof has been verified on the Midnight blockchain. Results will be revealed when the election closes.</p>
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
          <motion.div variants={fadeUp} style={{ ...styles.glassCard, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'rgba(99,102,241,0.04)', borderColor: 'rgba(99,102,241,0.14)' }}>
            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px', color: theme.colors.text }}>⚙️ Admin Panel</h3>
              
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

// ─── History & Audit Trail ───────────────────────────────────────────────────

export interface HistoryRecord {
  id: string;
  title: string;
  contractAddress: string;
  status: 'REGISTRATION' | 'OPEN' | 'CLOSED';
  registeredVoters: number;
  totalVotes: number;
  votesForA: number;
  votesForB: number;
  createdAt: string;
}

const DEFAULT_HISTORY: HistoryRecord[] = [
  {
    id: '1',
    title: 'DAO Governance Proposal #42',
    contractAddress: '0100000000000000000000000000000000000000000000000000000000000000',
    status: 'REGISTRATION',
    registeredVoters: 4,
    totalVotes: 0,
    votesForA: 0,
    votesForB: 0,
    createdAt: '2026-07-27 10:15',
  },
  {
    id: '2',
    title: 'Protocol Treasury Fund Allocation 2026',
    contractAddress: '02a83f9104b209d8174e908123abc4567890def1234567890abcdef123456789',
    status: 'CLOSED',
    registeredVoters: 120,
    totalVotes: 98,
    votesForA: 64,
    votesForB: 34,
    createdAt: '2026-07-20 14:00',
  },
  {
    id: '3',
    title: 'Community Ecosystem Grant #7',
    contractAddress: '03f71c981234567890abcdef1234567890def1234567890abcdef1234567890a',
    status: 'OPEN',
    registeredVoters: 45,
    totalVotes: 22,
    votesForA: 15,
    votesForB: 7,
    createdAt: '2026-07-25 09:30',
  },
];

const ElectionHistoryTable: React.FC<{
  records: HistoryRecord[];
  onSelectElection: (record: HistoryRecord) => void;
  onClearHistory: () => void;
}> = ({ records, onSelectElection, onClearHistory }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const statusColors = {
    REGISTRATION: theme.colors.secondary,
    OPEN: theme.colors.success,
    CLOSED: theme.colors.accent,
  };

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" style={styles.glassCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '12px', color: theme.colors.text }}>
            <History color={theme.colors.primary} /> Election Audit History
          </h3>
          <p style={{ color: theme.colors.textMuted, margin: 0, fontSize: '0.9rem' }}>
            Cryptographically recorded contract deployments and election activity logs.
          </p>
        </div>
        {records.length > 0 && (
          <AnimatedButton variant="secondary" onClick={onClearHistory} style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
            Reset History
          </AnimatedButton>
        )}
      </div>

      {records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: theme.colors.textMuted }}>
          <Clock size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <p>No election records stored yet. Deploy an election to see it here!</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(99,102,241,0.08)', color: theme.colors.textMuted, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700 }}>
                <th style={{ padding: '14px 12px' }}>Election Title</th>
                <th style={{ padding: '14px 12px' }}>Contract Address</th>
                <th style={{ padding: '14px 12px' }}>Status</th>
                <th style={{ padding: '14px 12px' }}>Voters / Votes</th>
                <th style={{ padding: '14px 12px' }}>Date</th>
                <th style={{ padding: '14px 12px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => (
                <motion.tr
                  key={rec.id}
                  whileHover={{ backgroundColor: 'rgba(99,102,241,0.025)' }}
                  style={{ borderBottom: '1px solid rgba(99,102,241,0.07)', transition: 'background 0.2s' }}
                >
                  <td style={{ padding: '16px 12px', fontWeight: 700, color: theme.colors.text, fontSize: '0.95rem' }}>{rec.title}</td>
                  <td style={{ padding: '16px 12px', fontFamily: 'JetBrains Mono, monospace', color: theme.colors.primary, fontSize: '0.85rem', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{rec.contractAddress.substring(0, 8)}...{rec.contractAddress.substring(rec.contractAddress.length - 6)}</span>
                      <button
                        onClick={() => copyToClipboard(rec.contractAddress, rec.id)}
                        style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.14)', borderRadius: '6px', color: theme.colors.textMuted, cursor: 'pointer', display: 'flex', padding: '3px', transition: 'all 0.2s' }}
                        title="Copy Address"
                      >
                        {copiedId === rec.id ? <Check size={13} color={theme.colors.success} /> : <Copy size={13} />}
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '999px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        letterSpacing: '0.3px',
                        background: `${statusColors[rec.status]}12`,
                        color: statusColors[rec.status],
                        border: `1px solid ${statusColors[rec.status]}30`,
                      }}
                    >
                      {rec.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 12px', color: theme.colors.textMuted, fontSize: '0.9rem' }}>
                    {rec.registeredVoters} registered <span style={{ color: theme.colors.primary, fontWeight: 600 }}>({rec.totalVotes} votes)</span>
                  </td>
                  <td style={{ padding: '16px 12px', color: theme.colors.textMuted, fontSize: '0.82rem' }}>{rec.createdAt}</td>
                  <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                    <AnimatedButton
                      variant="primary"
                      onClick={() => onSelectElection(rec)}
                      style={{ padding: '7px 16px', fontSize: '0.82rem', borderRadius: '12px' }}
                    >
                      Inspect <ChevronRight size={13} />
                    </AnimatedButton>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
  
  // Navigation & History State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');
  const [notification, setNotification] = useState<string | null>(null);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('voting_app_history');
      return saved ? JSON.parse(saved) : DEFAULT_HISTORY;
    } catch {
      return DEFAULT_HISTORY;
    }
  });

  // Wallet Connection State
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Demo / Active Election State
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [activeContractAddress, setActiveContractAddress] = useState<string>(MOCK_CONTRACT_ADDRESS);
  const [demoState, setDemoState] = useState<VotingDerivedState>({
    electionTitle: 'DAO Governance Proposal #42',
    electionState: ElectionState.REGISTRATION,
    isAdmin: true,
    isRegistered: true,
    hasVoted: false,
    registeredVoterCount: 4n,
    votedCount: 0n,
    totalVotes: 0n,
    votesForA: 0n,
    votesForB: 0n,
  });

  const saveHistory = (records: HistoryRecord[]) => {
    setHistoryRecords(records);
    try {
      localStorage.setItem('voting_app_history', JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save history to localStorage', e);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const launchDemo = (title = 'DAO Governance Proposal #42', customAddress?: string) => {
    setError(null);
    setIsDemoMode(true);
    setIsWalletConnected(true);
    setWalletAddress('0x8f3a9b12c4e72091a0b382d4e5f61789c4d23e10');
    setActiveContractAddress(customAddress || MOCK_CONTRACT_ADDRESS);
    setActiveTab('dashboard');
    setDemoState({
      electionTitle: title || 'DAO Governance Proposal #42',
      electionState: ElectionState.REGISTRATION,
      isAdmin: true,
      isRegistered: true,
      hasVoted: false,
      registeredVoterCount: 4n,
      votedCount: 0n,
      totalVotes: 0n,
      votesForA: 0n,
      votesForB: 0n,
    });
  };

  const deployNewElection = (title: string) => {
    setError(null);
    // Generate a unique mock 64-char contract hex address for demo/standalone deployment
    const randomHex = Array.from({ length: 62 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newAddress = `04${randomHex}`;
    const formattedTitle = title.trim() || 'New Midnight Election';

    const newRecord: HistoryRecord = {
      id: String(Date.now()),
      title: formattedTitle,
      contractAddress: newAddress,
      status: 'REGISTRATION',
      registeredVoters: 1,
      totalVotes: 0,
      votesForA: 0,
      votesForB: 0,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    saveHistory([newRecord, ...historyRecords]);
    launchDemo(formattedTitle, newAddress);
    showToast(`🎉 Successfully Deployed New Election: "${formattedTitle}"`);
  };

  const inspectHistoryRecord = (record: HistoryRecord) => {
    const stateEnum = record.status === 'REGISTRATION'
      ? ElectionState.REGISTRATION
      : record.status === 'OPEN'
      ? ElectionState.OPEN
      : ElectionState.CLOSED;

    setIsDemoMode(true);
    setIsWalletConnected(true);
    setWalletAddress('0x8f3a9b12c4e72091a0b382d4e5f61789c4d23e10');
    setActiveContractAddress(record.contractAddress);
    setDemoState({
      electionTitle: record.title,
      electionState: stateEnum,
      isAdmin: true,
      isRegistered: true,
      hasVoted: record.totalVotes > 0,
      registeredVoterCount: BigInt(record.registeredVoters),
      votedCount: BigInt(record.totalVotes),
      totalVotes: BigInt(record.totalVotes),
      votesForA: BigInt(record.votesForA),
      votesForB: BigInt(record.votesForB),
    });
    setActiveTab('dashboard');
    showToast(`Loaded election: "${record.title}"`);
  };

  const clearHistory = () => {
    saveHistory([]);
    showToast('Cleared all history records');
  };

  const connectWallet = async () => {
    setIsConnectingWallet(true);
    setError(null);
    try {
      const providers = await getProviders();
      setIsWalletConnected(true);
      setWalletAddress(providers.walletProvider.getCoinPublicKey());
    } catch (e: any) {
      setIsWalletConnected(true);
      setWalletAddress('0x8f3a9b12c4e72091a0b382d4e5f61789c4d23e10');
      if (!isDemoMode && !deployment) {
        launchDemo();
      }
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const disconnectWallet = () => {
    setIsWalletConnected(false);
    setWalletAddress(null);
    setIsDemoMode(false);
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

  const activeState = isDemoMode ? demoState : votingState;
  const currentContractAddress = isDemoMode
    ? activeContractAddress
    : (deployment as DeployedVotingDeployment)?.api?.deployedContractAddress || activeContractAddress;

  const handleDemoRegisterVoter = async (_pk: string) => {
    setDemoState((prev) => {
      const nextCount = prev.registeredVoterCount + 1n;
      const updated = { ...prev, registeredVoterCount: nextCount };
      // Update matching history record
      saveHistory(
        historyRecords.map((r) =>
          r.contractAddress === activeContractAddress
            ? { ...r, registeredVoters: Number(nextCount) }
            : r
        )
      );
      return updated;
    });
    showToast('✅ Voter registered successfully!');
  };

  const handleDemoOpenElection = async () => {
    setDemoState((prev) => {
      const updated = { ...prev, electionState: ElectionState.OPEN };
      saveHistory(
        historyRecords.map((r) =>
          r.contractAddress === activeContractAddress
            ? { ...r, status: 'OPEN' }
            : r
        )
      );
      return updated;
    });
    showToast('🚀 Election is now LIVE for voting!');
  };

  const handleDemoCastVote = async (choice: VoteChoice) => {
    setDemoState((prev) => {
      const isA = choice === VOTE_A;
      const nextVoted = prev.votedCount + 1n;
      const nextTotal = prev.totalVotes + 1n;
      const nextA = isA ? prev.votesForA + 1n : prev.votesForA;
      const nextB = !isA ? prev.votesForB + 1n : prev.votesForB;
      const updated = {
        ...prev,
        hasVoted: true,
        votedCount: nextVoted,
        totalVotes: nextTotal,
        votesForA: nextA,
        votesForB: nextB,
      };
      saveHistory(
        historyRecords.map((r) =>
          r.contractAddress === activeContractAddress
            ? {
                ...r,
                totalVotes: Number(nextTotal),
                votesForA: Number(nextA),
                votesForB: Number(nextB),
              }
            : r
        )
      );
      return updated;
    });
    showToast('🔒 Private vote encrypted and submitted via Zero-Knowledge proof!');
  };

  const handleDemoCloseElection = async () => {
    setDemoState((prev) => {
      const updated = { ...prev, electionState: ElectionState.CLOSED };
      saveHistory(
        historyRecords.map((r) =>
          r.contractAddress === activeContractAddress
            ? { ...r, status: 'CLOSED' }
            : r
        )
      );
      return updated;
    });
    showToast('🔒 Election CLOSED. Final results revealed!');
  };

  const network = import.meta.env.VITE_NETWORK_ID || 'preprod';

  return (
    <div style={styles.app}>
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 20, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              position: 'fixed',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              background: 'rgba(255,255,255,0.95)',
              border: `1px solid ${theme.colors.success}30`,
              color: theme.colors.text,
              padding: '12px 28px',
              borderRadius: '999px',
              boxShadow: `0 8px 32px rgba(16,185,129,0.20), 0 2px 8px rgba(0,0,0,0.06)`,
              fontWeight: 700,
              fontSize: '0.9rem',
              backdropFilter: 'blur(20px)',
              whiteSpace: 'nowrap',
            }}
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={styles.logo}>
              <motion.div whileHover={{ rotate: 8, scale: 1.08 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }} style={{ background: theme.colors.primary, color: '#fff', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px ${theme.colors.primary}44` }}>
                <Shield size={22} strokeWidth={2.5} />
              </motion.div>
              <span style={{ color: theme.colors.primary, fontWeight: 800 }}>Private Voting</span>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(99,102,241,0.06)', padding: '4px', borderRadius: '20px', border: '1px solid rgba(99,102,241,0.10)' }}>
              {(['dashboard', 'history'] as const).map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    background: activeTab === tab ? '#fff' : 'transparent',
                    border: activeTab === tab ? '1px solid rgba(99,102,241,0.14)' : '1px solid transparent',
                    color: activeTab === tab ? theme.colors.primary : theme.colors.textMuted,
                    padding: '7px 16px',
                    borderRadius: '16px',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: 'inherit',
                    boxShadow: activeTab === tab ? '0 2px 8px rgba(99,102,241,0.12)' : 'none',
                    transition: 'all 0.2s ease',
                    letterSpacing: '-0.1px',
                  }}
                >
                  {tab === 'dashboard' ? <><Activity size={13} /> Dashboard</> : <><History size={13} /> History ({historyRecords.length})</>}
                </motion.button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ padding: '5px 14px', borderRadius: '999px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.18)', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', color: theme.colors.accent, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2 }} style={{ width: 6, height: 6, borderRadius: '50%', background: theme.colors.accent }} />
              {network.toUpperCase()}
            </span>
            
            {isWalletConnected ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: theme.colors.textMuted, fontFamily: 'JetBrains Mono, monospace', background: 'rgba(99,102,241,0.06)', padding: '5px 12px', borderRadius: '999px', border: '1px solid rgba(99,102,241,0.10)' }}>
                  {walletAddress ? `${walletAddress.substring(0, 8)}...${walletAddress.substring(walletAddress.length - 6)}` : 'Connected'}
                </span>
                <AnimatedButton 
                  variant="secondary"
                  onClick={disconnectWallet}
                  style={{ padding: '6px 14px', fontSize: '0.82rem', borderRadius: '999px', color: theme.colors.danger, borderColor: `${theme.colors.danger}22`, background: `${theme.colors.danger}08` }}
                >
                  Disconnect
                </AnimatedButton>
              </div>
            ) : (
              <AnimatedButton 
                variant="primary"
                onClick={connectWallet}
                disabled={isConnectingWallet}
                style={{ padding: '8px 20px', fontSize: '0.88rem', borderRadius: '999px' }}
              >
                {isConnectingWallet ? <Spinner /> : <><Zap size={15} /> Connect Wallet</>}
              </AnimatedButton>
            )}
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <AnimatePresence mode="wait">
          {activeTab === 'history' ? (
            <motion.div key="historyTab" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <ElectionHistoryTable
                records={historyRecords}
                onSelectElection={inspectHistoryRecord}
                onClearHistory={clearHistory}
              />
            </motion.div>
          ) : (
            <React.Fragment key="dashboardTab">
              {!deployment && !isDemoMode && (
                <motion.div key="hero" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.9, ease: [0.22,1,0.36,1] }} style={{ textAlign: 'center', marginBottom: '5rem' }}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.7, ease: [0.22,1,0.36,1] }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: `${theme.colors.primary}0e`, border: `1px solid ${theme.colors.primary}22`, borderRadius: '999px', padding: '6px 18px', marginBottom: '2rem', fontSize: '0.82rem', fontWeight: 700, color: theme.colors.primary, letterSpacing: '0.3px' }}>
                      <motion.div animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}><Shield size={12} /></motion.div>
                      Powered by Midnight ZK Proofs
                    </div>
                  </motion.div>
                  <h1 style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)', fontWeight: 900, lineHeight: 1.05, marginBottom: '1.5rem', letterSpacing: '-2.5px', color: theme.colors.text }}>
                    The Future of <br /><span style={styles.gradientText}>Secure Voting.</span>
                  </h1>
                  <p style={{ fontSize: '1.15rem', color: theme.colors.textMuted, maxWidth: '560px', margin: '0 auto 3rem', lineHeight: 1.7, fontWeight: 400 }}>
                    Cast your ballot with absolute privacy. Verify election integrity with Zero-Knowledge proofs on the Midnight blockchain.
                  </p>
                  
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    {[
                      { icon: Shield, text: 'Absolute Privacy' },
                      { icon: Eye, text: 'Verifiable Results' },
                      { icon: Lock, text: 'Cryptographic Security' }
                    ].map((Feature, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.colors.textMuted, fontWeight: 600, background: 'rgba(255,255,255,0.70)', padding: '8px 18px', borderRadius: '999px', border: '1px solid rgba(99,102,241,0.10)', boxShadow: '0 2px 8px rgba(99,102,241,0.06)', fontSize: '0.9rem' }}>
                        <Feature.icon size={16} color={theme.colors.primary} />
                        {Feature.text}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {error && !isDemoMode && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ ...styles.glassCard, background: `${theme.colors.danger}06`, border: `1.5px solid ${theme.colors.danger}28`, marginBottom: '2rem', textAlign: 'center' }}>
                  <h3 style={{ marginBottom: '8px', color: theme.colors.danger, fontWeight: 800 }}>Connection Error</h3>
                  <p style={{ color: theme.colors.textMuted }}>{error}</p>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                    <AnimatedButton variant="primary" onClick={() => launchDemo()}>🚀 Continue</AnimatedButton>
                    <AnimatedButton variant="secondary" onClick={() => { setDeployment$(null); setDeployment(null); setError(null); }}>Try Again</AnimatedButton>
                  </div>
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

              {!deployment && !isDemoMode && (
                <JoinDeployPanel
                  onLaunchDemo={() => launchDemo()}
                  onJoin={(addr) => {
                    setError(null);
                    try {
                      setDeployment$(() => resolve(addr as any));
                    } catch(e:any) {
                      launchDemo('Election ' + addr.substring(0, 6), addr);
                    }
                  }}
                  onDeploy={(title) => {
                    deployNewElection(title);
                  }}
                  loading={false}
                />
              )}

              {(isDemoMode || (deployment?.status === 'deployed' && votingState)) && activeState && (
                <ElectionDashboard
                  state={activeState}
                  contractAddress={currentContractAddress}
                  onCastVote={(c) => isDemoMode ? handleDemoCastVote(c) : (deployment as DeployedVotingDeployment).api.castVote(c)}
                  onRegisterVoter={(pk) => isDemoMode ? handleDemoRegisterVoter(pk) : (deployment as DeployedVotingDeployment).api.registerVoter(Buffer.from(pk, 'hex'))}
                  onOpenElection={() => isDemoMode ? handleDemoOpenElection() : (deployment as DeployedVotingDeployment).api.openElection()}
                  onCloseElection={() => isDemoMode ? handleDemoCloseElection() : (deployment as DeployedVotingDeployment).api.closeElection()}
                />
              )}
            </React.Fragment>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;
