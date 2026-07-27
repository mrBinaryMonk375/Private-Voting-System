/**
 * Private Voting System — Main Application
 *
 * A fully premium, dark-themed voting DApp powered by Midnight blockchain ZK proofs.
 * Voters cast private ballots; results are publicly verifiable after the election closes.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { type Observable } from 'rxjs';
import { useDeployedVotingContext } from './hooks';
import { type VotingDeployment, type DeployedVotingDeployment } from './contexts';
import { type VotingDerivedState } from '../../api/src/common-types';
import { ElectionState } from '../../contract/src/managed/voting/contract/index.js';
import { VOTE_A, VOTE_B, type VoteChoice } from '../../api/src/common-types';

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  app: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #030712 0%, #0f172a 50%, #030712 100%)',
    color: '#f9fafb',
    fontFamily: "'Inter', sans-serif",
  } as React.CSSProperties,

  header: {
    borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
    background: 'rgba(15, 23, 42, 0.8)',
    backdropFilter: 'blur(20px)',
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
    height: '72px',
  } as React.CSSProperties,

  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  } as React.CSSProperties,

  logoIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
  } as React.CSSProperties,

  logoText: {
    fontSize: '1.1rem',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  } as React.CSSProperties,

  networkBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 600,
    background: 'rgba(99, 102, 241, 0.15)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    color: '#a78bfa',
    letterSpacing: '0.05em',
  } as React.CSSProperties,

  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '3rem 2rem',
  } as React.CSSProperties,

  hero: {
    textAlign: 'center' as const,
    marginBottom: '4rem',
    padding: '2rem 0',
  } as React.CSSProperties,

  heroTitle: {
    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
    fontWeight: 900,
    lineHeight: 1.1,
    marginBottom: '1rem',
    background: 'linear-gradient(135deg, #ffffff 0%, #a78bfa 50%, #6366f1 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  } as React.CSSProperties,

  heroSubtitle: {
    fontSize: '1.2rem',
    color: '#94a3b8',
    maxWidth: '600px',
    margin: '0 auto 2rem',
    lineHeight: 1.6,
  } as React.CSSProperties,

  privacyPillRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    flexWrap: 'wrap' as const,
    marginBottom: '2rem',
  } as React.CSSProperties,

  privacyPill: {
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  } as React.CSSProperties,

  card: {
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: '20px',
    padding: '2rem',
    backdropFilter: 'blur(10px)',
    transition: 'border-color 0.2s, transform 0.2s',
  } as React.CSSProperties,

  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#e2e8f0',
  } as React.CSSProperties,

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  } as React.CSSProperties,

  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    background: 'rgba(15, 23, 42, 0.8)',
    color: '#f9fafb',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: "'Inter', sans-serif",
  } as React.CSSProperties,

  button: {
    padding: '12px 24px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.95rem',
    transition: 'all 0.2s',
    fontFamily: "'Inter', sans-serif",
  } as React.CSSProperties,

  primaryButton: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
  } as React.CSSProperties,

  dangerButton: {
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    color: '#fff',
  } as React.CSSProperties,

  successButton: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#fff',
  } as React.CSSProperties,

  ghostButton: {
    background: 'transparent',
    border: '1px solid rgba(99, 102, 241, 0.4)',
    color: '#a78bfa',
  } as React.CSSProperties,

  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,

  progressBar: {
    height: '8px',
    borderRadius: '4px',
    background: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  } as React.CSSProperties,

  progressFill: (pct: number, color: string) =>
    ({
      height: '100%',
      width: `${pct}%`,
      background: color,
      borderRadius: '4px',
      transition: 'width 0.6s ease',
    } as React.CSSProperties),

  stat: {
    textAlign: 'center' as const,
  } as React.CSSProperties,

  statValue: {
    fontSize: '2.5rem',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    lineHeight: 1,
  } as React.CSSProperties,

  statLabel: {
    fontSize: '0.8rem',
    color: '#64748b',
    marginTop: '4px',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  } as React.CSSProperties,

  divider: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)',
    margin: '1.5rem 0',
  } as React.CSSProperties,

  alert: (type: 'success' | 'error' | 'info' | 'warning') => {
    const colors = {
      success: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', color: '#10b981' },
      error: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', color: '#ef4444' },
      info: { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.3)', color: '#6366f1' },
      warning: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', color: '#f59e0b' },
    }[type];
    return {
      padding: '12px 16px',
      borderRadius: '12px',
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      color: colors.color,
      fontSize: '0.9rem',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
    } as React.CSSProperties;
  },

  voteButton: (selected: boolean, color: string) =>
    ({
      flex: 1,
      padding: '2rem',
      borderRadius: '16px',
      border: selected ? `2px solid ${color}` : '2px solid rgba(255,255,255,0.1)',
      background: selected ? `${color}20` : 'rgba(15,23,42,0.6)',
      cursor: 'pointer',
      transition: 'all 0.2s',
      textAlign: 'center' as const,
      boxShadow: selected ? `0 0 20px ${color}30` : 'none',
    } as React.CSSProperties),
};

// ─── Helper Components ────────────────────────────────────────────────────────

const ElectionStatusBadge: React.FC<{ state: ElectionState }> = ({ state }) => {
  const config = {
    [ElectionState.REGISTRATION]: { icon: '📝', label: 'Registration', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' },
    [ElectionState.OPEN]: { icon: '🗳️', label: 'Voting Open', color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' },
    [ElectionState.CLOSED]: { icon: '🔒', label: 'Closed', color: '#6366f1', bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.3)' },
  }[state];

  return (
    <span style={{
      ...styles.statusBadge,
      background: config.bg,
      border: `1px solid ${config.border}`,
      color: config.color,
    }}>
      {config.icon} {config.label}
    </span>
  );
};

const Spinner: React.FC = () => (
  <span style={{
    display: 'inline-block',
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  }} />
);

// ─── Join / Deploy Panel ──────────────────────────────────────────────────────

interface JoinDeployPanelProps {
  onJoin: (address: string) => void;
  onDeploy: (title: string) => void;
  loading: boolean;
}

const JoinDeployPanel: React.FC<JoinDeployPanelProps> = ({ onJoin, onDeploy, loading }) => {
  const [contractAddress, setContractAddress] = useState(import.meta.env.VITE_CONTRACT_ADDRESS || '');
  const [electionTitle, setElectionTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'join' | 'deploy'>('join');

  return (
    <div style={{ ...styles.card, maxWidth: '600px', margin: '0 auto' }}>
      <div style={styles.cardTitle}>
        <span>🔌</span> Connect to Election
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
        {(['join', 'deploy'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.button,
              flex: 1,
              ...(activeTab === tab ? styles.primaryButton : styles.ghostButton),
            }}
          >
            {tab === 'join' ? '🔗 Join Election' : '🚀 Deploy New'}
          </button>
        ))}
      </div>

      {activeTab === 'join' ? (
        <div>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Enter the contract address of an existing election to participate.
          </p>
          <input
            style={{ ...styles.input, marginBottom: '1rem' }}
            placeholder="Contract address (hex)"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
          />
          <button
            style={{ ...styles.button, ...styles.primaryButton, width: '100%' }}
            onClick={() => onJoin(contractAddress)}
            disabled={loading || !contractAddress}
          >
            {loading ? <Spinner /> : '🔗 Join Election'}
          </button>
        </div>
      ) : (
        <div>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Deploy a new election contract. You will become the admin.
          </p>
          <input
            style={{ ...styles.input, marginBottom: '1rem' }}
            placeholder="Election title (e.g. Community Vote 2026)"
            value={electionTitle}
            onChange={(e) => setElectionTitle(e.target.value)}
          />
          <button
            style={{ ...styles.button, ...styles.primaryButton, width: '100%' }}
            onClick={() => onDeploy(electionTitle)}
            disabled={loading || !electionTitle}
          >
            {loading ? <Spinner /> : '🚀 Deploy Election'}
          </button>
        </div>
      )}

      {/* Privacy Note */}
      <div style={{ ...styles.alert('info'), marginTop: '1.5rem' }}>
        <span>🔒</span>
        <div>
          <strong>Privacy guaranteed:</strong> Your vote choice is processed inside a ZK proof and
          never transmitted in plaintext. Only aggregate tallies appear on-chain.
        </div>
      </div>
    </div>
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

const ElectionDashboard: React.FC<ElectionDashboardProps> = ({
  state,
  contractAddress,
  onCastVote,
  onRegisterVoter,
  onOpenElection,
  onCloseElection,
}) => {
  const [selectedVote, setSelectedVote] = useState<VoteChoice | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [voterPubKey, setVoterPubKey] = useState('');

  const withLoading = async (key: string, fn: () => Promise<void>) => {
    setLoading(key);
    setTxStatus(null);
    try {
      await fn();
      setTxStatus({ type: 'success', msg: 'Transaction confirmed on-chain ✓' });
    } catch (e: any) {
      setTxStatus({ type: 'error', msg: e.message ?? 'Transaction failed' });
    } finally {
      setLoading(null);
    }
  };

  const total = Number(state.totalVotes);
  const pctA = total > 0 ? (Number(state.votesForA) / total) * 100 : 0;
  const pctB = total > 0 ? (Number(state.votesForB) / total) * 100 : 0;
  const turnoutPct = Number(state.registeredVoterCount) > 0
    ? (Number(state.votedCount) / Number(state.registeredVoterCount)) * 100
    : 0;

  return (
    <div>
      {/* Election Header */}
      <div style={{ ...styles.card, marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              {state.electionTitle}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <ElectionStatusBadge state={state.electionState} />
              {state.isAdmin && (
                <span style={{ ...styles.statusBadge, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>
                  👑 Admin
                </span>
              )}
              {!state.isAdmin && state.isRegistered && (
                <span style={{ ...styles.statusBadge, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}>
                  ✅ Registered
                </span>
              )}
            </div>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#4b5563', maxWidth: '300px', wordBreak: 'break-all' }}>
            📍 {contractAddress}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { value: state.registeredVoterCount.toString(), label: 'Registered' },
          { value: state.votedCount.toString(), label: 'Voted' },
          { value: `${turnoutPct.toFixed(0)}%`, label: 'Turnout' },
          { value: state.totalVotes.toString(), label: 'Total Votes' },
        ].map(({ value, label }) => (
          <div key={label} style={{ ...styles.card, ...styles.stat, padding: '1.5rem' }}>
            <div style={styles.statValue}>{value}</div>
            <div style={styles.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      <div style={styles.grid}>
        {/* Results / Voting Booth */}
        {state.electionState === ElectionState.CLOSED ? (
          <div style={{ ...styles.card, gridColumn: 'span 2' }}>
            <div style={styles.cardTitle}><span>📊</span> Final Results</div>
            {[
              { label: 'Candidate A', votes: state.votesForA, pct: pctA, color: '#6366f1' },
              { label: 'Candidate B', votes: state.votesForB, pct: pctB, color: '#8b5cf6' },
            ].map(({ label, votes, pct, color }) => (
              <div key={label} style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600 }}>{label}</span>
                  <span style={{ color, fontWeight: 700 }}>{votes.toString()} votes ({pct.toFixed(1)}%)</span>
                </div>
                <div style={styles.progressBar}>
                  <div style={styles.progressFill(pct, `linear-gradient(90deg, ${color}, ${color}aa)`)} />
                </div>
              </div>
            ))}
          </div>
        ) : state.electionState === ElectionState.OPEN && !state.hasVoted && state.isRegistered ? (
          <div style={styles.card}>
            <div style={styles.cardTitle}><span>🗳️</span> Cast Your Vote</div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Your vote is encrypted inside a ZK proof. The blockchain only records that you voted — not your choice.
            </p>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              {([
                { choice: VOTE_A, label: 'Candidate A', emoji: '🅰️', color: '#6366f1' },
                { choice: VOTE_B, label: 'Candidate B', emoji: '🅱️', color: '#8b5cf6' },
              ] as const).map(({ choice, label, emoji, color }) => (
                <button
                  key={label}
                  style={styles.voteButton(selectedVote === choice, color)}
                  onClick={() => setSelectedVote(choice)}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{emoji}</div>
                  <div style={{ fontWeight: 700, color: selectedVote === choice ? color : '#e2e8f0' }}>{label}</div>
                </button>
              ))}
            </div>

            {txStatus && (
              <div style={{ ...styles.alert(txStatus.type), marginBottom: '1rem' }}>
                {txStatus.type === 'success' ? '✅' : '❌'} {txStatus.msg}
              </div>
            )}

            <button
              style={{
                ...styles.button,
                width: '100%',
                ...(selectedVote !== null ? styles.primaryButton : { background: 'rgba(99,102,241,0.3)', color: '#6366f1', cursor: 'not-allowed' }),
              }}
              disabled={selectedVote === null || loading === 'vote'}
              onClick={() => selectedVote !== null && withLoading('vote', () => onCastVote(selectedVote))}
            >
              {loading === 'vote' ? <Spinner /> : '🔒 Submit Private Vote'}
            </button>
          </div>
        ) : state.hasVoted ? (
          <div style={styles.card}>
            <div style={{ ...styles.alert('success') }}>
              <span style={{ fontSize: '2rem' }}>✅</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>Vote Recorded!</div>
                <div>Your vote has been privately counted. Results will be visible when the election closes.</div>
              </div>
            </div>
          </div>
        ) : state.electionState === ElectionState.REGISTRATION ? (
          <div style={styles.card}>
            <div style={{ ...styles.alert('info') }}>
              <span style={{ fontSize: '2rem' }}>📋</span>
              <div>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>Registration Phase</div>
                <div>The election is not yet open. Wait for the admin to open voting.</div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Live Tally (during open voting) */}
        {state.electionState === ElectionState.OPEN && (
          <div style={styles.card}>
            <div style={styles.cardTitle}><span>📈</span> Live Participation</div>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Voter Turnout</span>
                <span style={{ fontWeight: 700, color: '#10b981' }}>{turnoutPct.toFixed(0)}%</span>
              </div>
              <div style={styles.progressBar}>
                <div style={styles.progressFill(turnoutPct, 'linear-gradient(90deg, #10b981, #059669)')} />
              </div>
            </div>

            <div style={{ ...styles.alert('info'), fontSize: '0.85rem' }}>
              <span>🔒</span>
              <span>Individual votes are hidden. Only the total count is visible while voting is in progress.</span>
            </div>
          </div>
        )}
      </div>

      {/* Admin Panel */}
      {state.isAdmin && (
        <div style={styles.card}>
          <div style={styles.cardTitle}><span>⚙️</span> Admin Controls</div>

          {txStatus && (
            <div style={{ ...styles.alert(txStatus.type), marginBottom: '1rem' }}>
              {txStatus.type === 'success' ? '✅' : '❌'} {txStatus.msg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {state.electionState === ElectionState.REGISTRATION && (
              <button
                style={{ ...styles.button, ...styles.successButton }}
                onClick={() => withLoading('open', onOpenElection)}
                disabled={loading === 'open'}
              >
                {loading === 'open' ? <Spinner /> : '🚀 Open Election'}
              </button>
            )}
            {state.electionState === ElectionState.OPEN && (
              <button
                style={{ ...styles.button, ...styles.dangerButton }}
                onClick={() => withLoading('close', onCloseElection)}
                disabled={loading === 'close'}
              >
                {loading === 'close' ? <Spinner /> : '🔒 Close Election'}
              </button>
            )}
          </div>

          {state.electionState === ElectionState.REGISTRATION && (
            <div>
              <div style={styles.divider} />
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Register voters by their public key (64-char hex):
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input
                  style={{ ...styles.input, flex: 1 }}
                  placeholder="Voter public key (hex)"
                  value={voterPubKey}
                  onChange={(e) => setVoterPubKey(e.target.value)}
                />
                <button
                  style={{ ...styles.button, ...styles.primaryButton, whiteSpace: 'nowrap' }}
                  onClick={() => withLoading('register', () => onRegisterVoter(voterPubKey))}
                  disabled={loading === 'register' || !voterPubKey}
                >
                  {loading === 'register' ? <Spinner /> : '➕ Register'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Privacy Badge ────────────────────────────────────────────────────────────

const PrivacyBadge: React.FC = () => (
  <div style={{ ...styles.card, marginTop: '2rem' }}>
    <div style={styles.cardTitle}><span>🛡️</span> Privacy Model</div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
      {[
        { icon: '👁️', title: 'Public (On-chain)', items: ['Election status', 'Total vote counts', 'Voter participation (not identity)', 'Registered voter set'], color: '#6366f1' },
        { icon: '🔒', title: 'Private (ZK Only)', items: ['Vote choice (A or B)', 'Voter secret key', 'Voter identity linkage', 'Individual ballot content'], color: '#10b981' },
        { icon: '✅', title: 'Verified Without Revealing', items: ['Voter is registered', 'Voter hasn\'t voted twice', 'Vote is valid choice', 'Voter has correct key'], color: '#f59e0b' },
      ].map(({ icon, title, items, color }) => (
        <div key={title} style={{ padding: '1rem', borderRadius: '12px', background: `${color}0d`, border: `1px solid ${color}30` }}>
          <div style={{ fontWeight: 700, marginBottom: '0.75rem', color, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{icon}</span> {title}
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {items.map((item) => (
              <li key={item} style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color }}>•</span> {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </div>
);

// ─── Main App ─────────────────────────────────────────────────────────────────

export const App: React.FC = () => {
  const { resolve } = useDeployedVotingContext();
  const [deployment$, setDeployment$] = useState<Observable<VotingDeployment> | null>(null);
  const [deployment, setDeployment] = useState<VotingDeployment | null>(null);
  const [votingState, setVotingState] = useState<VotingDerivedState | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Subscribe to deployment state changes
  useEffect(() => {
    if (!deployment$) return;
    const sub = deployment$.subscribe(setDeployment);
    return () => sub.unsubscribe();
  }, [deployment$]);

  // Subscribe to voting state when deployed
  useEffect(() => {
    if (!deployment || deployment.status !== 'deployed') {
      setVotingState(null);
      return;
    }
    const sub = (deployment as DeployedVotingDeployment).api.state$.subscribe(setVotingState);
    return () => sub.unsubscribe();
  }, [deployment]);

  const handleJoin = useCallback((address: string) => {
    setWalletError(null);
    try {
      setDeployment$(() => resolve(address as any));
    } catch (e: any) {
      setWalletError(e.message);
    }
  }, [resolve]);

  const handleDeploy = useCallback((title: string) => {
    setWalletError(null);
    try {
      setDeployment$(() => resolve(undefined, title));
    } catch (e: any) {
      setWalletError(e.message);
    }
  }, [resolve]);

  const getAPI = () => {
    if (!deployment || deployment.status !== 'deployed') return null;
    return (deployment as DeployedVotingDeployment).api;
  };

  const api = getAPI();
  const network = import.meta.env.VITE_NETWORK_ID || 'preprod';

  return (
    <div style={styles.app}>
      {/* Animated CSS for spinner */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        button:hover:not(:disabled) { opacity: 0.85; transform: translateY(-1px); }
        button:active:not(:disabled) { transform: translateY(0); }
        input:focus { border-color: rgba(99, 102, 241, 0.7); }
      `}</style>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>🗳️</div>
            <span style={styles.logoText}>Private Voting System</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={styles.networkBadge}>⛓️ {network.toUpperCase()}</span>
            <span style={styles.networkBadge}>🔒 ZK-Powered</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Hero */}
        {!deployment && (
          <div style={styles.hero}>
            <h1 style={styles.heroTitle}>
              Vote Privately.<br />Verify Publicly.
            </h1>
            <p style={styles.heroSubtitle}>
              A blockchain voting system where your ballot stays completely private
              while election results remain publicly verifiable — powered by Midnight zero-knowledge proofs.
            </p>
            <div style={styles.privacyPillRow}>
              {[
                { icon: '🔒', label: 'Vote Privacy', color: '#6366f1' },
                { icon: '✅', label: 'Verifiable Results', color: '#10b981' },
                { icon: '🚫', label: 'No Double Voting', color: '#f59e0b' },
                { icon: '⚡', label: 'ZK Proofs', color: '#8b5cf6' },
              ].map(({ icon, label, color }) => (
                <span key={label} style={{
                  ...styles.privacyPill,
                  background: `${color}15`,
                  border: `1px solid ${color}30`,
                  color,
                }}>
                  {icon} {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {walletError && (
          <div style={{ ...styles.alert('error'), maxWidth: '600px', margin: '0 auto 2rem' }}>
            ❌ {walletError}
          </div>
        )}

        {/* Loading State */}
        {deployment?.status === 'in-progress' && (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>⚙️</div>
            <h3 style={{ color: '#a78bfa', marginBottom: '0.5rem' }}>Connecting to Midnight Network</h3>
            <p style={{ color: '#64748b' }}>Initializing ZK providers and wallet connection...</p>
          </div>
        )}

        {/* Failed State */}
        {deployment?.status === 'failed' && (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ ...styles.alert('error'), marginBottom: '1rem' }}>
              ❌ {(deployment as any).error.message}
            </div>
            <button
              style={{ ...styles.button, ...styles.ghostButton }}
              onClick={() => { setDeployment$(null); setDeployment(null); }}
            >
              ← Try Again
            </button>
          </div>
        )}

        {/* Connect Panel */}
        {!deployment && (
          <JoinDeployPanel
            onJoin={handleJoin}
            onDeploy={handleDeploy}
            loading={false}
          />
        )}

        {/* Election Dashboard */}
        {deployment?.status === 'deployed' && votingState && api && (
          <ElectionDashboard
            state={votingState}
            contractAddress={api.deployedContractAddress}
            onCastVote={(choice) => api.castVote(choice)}
            onRegisterVoter={(pubKeyHex) => api.registerVoter(Buffer.from(pubKeyHex, 'hex'))}
            onOpenElection={() => api.openElection()}
            onCloseElection={() => api.closeElection()}
          />
        )}

        {/* Privacy Badge */}
        <PrivacyBadge />
      </main>
    </div>
  );
};

export default App;
