/**
 * ConsensusPanel — HashMind's signature UI component
 *
 * Displays the three specialist AI agent votes in real-time:
 *   AlphaAgent  — market signal (on-chain metrics)
 *   YieldAgent  — best yield action
 *   GuardAgent  — risk assessment
 *
 * Shows live vote badges, confidence bars, reasoning, and the
 * final 2-of-3 consensus outcome with on-chain logging status.
 */

import { useState } from 'react'
import axios from 'axios'

const VOTE_COLORS = {
  EXECUTE: '#00E676',
  DEFER:   '#C9A84C',
  REJECT:  '#E05A3A',
}

const VOTE_ICONS = {
  EXECUTE: '✓',
  DEFER:   '⏸',
  REJECT:  '✕',
}

const AGENT_META = {
  alpha: {
    label:    'AlphaAgent',
    subtitle: 'Market Signal',
    icon:     '📡',
    color:    '#0BBDCA',
    desc:     'Reads live HashKey Chain on-chain metrics — tx volume, gas, address growth',
  },
  yield: {
    label:    'YieldAgent',
    subtitle: 'Yield Optimiser',
    icon:     '⚡',
    color:    '#C9A84C',
    desc:     'Analyses stHSK, veHSK, WoofSwap pools to find the best yield action',
  },
  guard: {
    label:    'GuardAgent',
    subtitle: 'Risk Assessment',
    icon:     '🛡',
    color:    '#8B5CF6',
    desc:     'Reviews peer votes and wallet exposure — the final line of defence',
  },
}

function AgentCard({ agentKey, vote }) {
  const [expanded, setExpanded] = useState(false)
  if (!vote) return null

  const meta      = AGENT_META[agentKey]
  const voteColor = VOTE_COLORS[vote.vote] || '#7B7368'
  const voteIcon  = VOTE_ICONS[vote.vote]  || '?'

  return (
    <div
      onClick={() => setExpanded(e => !e)}
      style={{
        background:   'rgba(255,255,255,0.03)',
        border:       `1px solid ${voteColor}33`,
        borderRadius: 12,
        padding:      '16px 18px',
        cursor:       'pointer',
        transition:   'border-color 0.2s, background 0.2s',
        position:     'relative',
        overflow:     'hidden',
      }}
    >
      {/* Glow strip */}
      <div style={{
        position:   'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${voteColor}80, transparent)`,
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>{meta.icon}</span>
          <div>
            <div style={{ color: meta.color, fontWeight: 700, fontSize: 13, letterSpacing: '0.05em' }}>
              {meta.label}
            </div>
            <div style={{ color: '#7B7368', fontSize: 11 }}>{meta.subtitle}</div>
          </div>
        </div>

        {/* Vote badge */}
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          6,
          padding:      '4px 12px',
          borderRadius: 20,
          background:   `${voteColor}18`,
          border:       `1px solid ${voteColor}50`,
          fontFamily:   '"JetBrains Mono", monospace',
          fontSize:      12,
          fontWeight:    700,
          color:         voteColor,
        }}>
          <span>{voteIcon}</span>
          <span>{vote.vote}</span>
        </div>
      </div>

      {/* Signal */}
      <div style={{
        fontFamily:  '"JetBrains Mono", monospace',
        fontSize:    12,
        color:       '#E8E2D8',
        marginBottom: 10,
        padding:     '6px 10px',
        background:  'rgba(255,255,255,0.03)',
        borderRadius: 6,
        borderLeft:  `3px solid ${voteColor}60`,
      }}>
        {vote.signal}
      </div>

      {/* Confidence bar */}
      <div style={{ marginBottom: expanded ? 12 : 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: '#7B7368', fontSize: 11 }}>Confidence</span>
          <span style={{ color: voteColor, fontWeight: 700, fontFamily: '"JetBrains Mono", monospace', fontSize: 11 }}>
            {vote.confidence}%
          </span>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
          <div style={{
            height:      '100%',
            width:       `${vote.confidence}%`,
            background:  `linear-gradient(90deg, ${voteColor}80, ${voteColor})`,
            borderRadius: 2,
            transition:  'width 1s ease',
          }} />
        </div>
      </div>

      {/* Expanded reasoning */}
      {expanded && (
        <div style={{
          marginTop:   10,
          padding:     '10px 12px',
          background:  'rgba(0,0,0,0.25)',
          borderRadius: 8,
          fontSize:    12,
          color:       '#9E9690',
          lineHeight:  1.6,
        }}>
          <div style={{ color: '#7B7368', fontSize: 11, marginBottom: 6 }}>Reasoning:</div>
          {vote.reasoning || vote.details || 'No reasoning provided.'}
        </div>
      )}

      <div style={{ color: '#7B7368', fontSize: 10, marginTop: 8, textAlign: 'right' }}>
        {expanded ? '▲ Less' : '▼ Full reasoning'}
      </div>
    </div>
  )
}

function ConsensusResult({ consensus, txHash, explorerUrl, isMock, isLogging, onLog }) {
  if (!consensus) return null
  const reached  = consensus.reached
  const barColor = reached ? '#00E676' : '#C9A84C'

  return (
    <div style={{
      marginTop:    24,
      padding:      '20px 22px',
      borderRadius: 14,
      background:   reached ? 'rgba(0,230,118,0.04)' : 'rgba(201,168,76,0.04)',
      border:       `1px solid ${barColor}30`,
      position:     'relative',
      overflow:     'hidden',
    }}>
      {/* Top strip */}
      <div style={{
        position:   'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, transparent, ${barColor}80, transparent)`,
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: `${barColor}18`,
          border:     `2px solid ${barColor}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>
          {reached ? '✅' : '⏸'}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: barColor }}>
            {reached ? 'CONSENSUS REACHED' : 'DEFERRED — No Consensus'}
          </div>
          <div style={{ color: '#7B7368', fontSize: 12 }}>
            {consensus.execute_count}/3 agents voted EXECUTE
            {' · '}Avg confidence: {consensus.aggregated_confidence}%
          </div>
        </div>
      </div>

      {reached && (
        <div style={{
          padding:     '10px 14px',
          background:  'rgba(0,230,118,0.06)',
          borderRadius: 8,
          border:      '1px solid rgba(0,230,118,0.15)',
          fontFamily:  '"JetBrains Mono", monospace',
          fontSize:    13,
          color:       '#E8E2D8',
          marginBottom: 16,
        }}>
          <span style={{ color: '#7B7368', fontSize: 11 }}>Final Action: </span>
          {consensus.final_action}
        </div>
      )}

      {/* On-chain log button */}
      {reached && !txHash && (
        <button
          onClick={onLog}
          disabled={isLogging}
          style={{
            width:        '100%',
            padding:      '11px 0',
            borderRadius: 8,
            border:       '1px solid rgba(0,230,118,0.30)',
            background:   isLogging ? 'rgba(0,230,118,0.05)' : 'rgba(0,230,118,0.10)',
            color:        '#00E676',
            fontWeight:   700,
            fontSize:     13,
            cursor:       isLogging ? 'not-allowed' : 'pointer',
            fontFamily:   '"JetBrains Mono", monospace',
            letterSpacing: '0.06em',
          }}
        >
          {isLogging ? '⏳ Logging to HashKey Chain...' : '⛓ Log Consensus On-Chain'}
        </button>
      )}

      {/* Tx confirmation */}
      {txHash && (
        <div style={{
          padding:     '12px 14px',
          background:  'rgba(27,122,81,0.08)',
          borderRadius: 8,
          border:      '1px solid rgba(27,122,81,0.20)',
        }}>
          <div style={{ color: '#1B7A51', fontWeight: 700, fontSize: 12, marginBottom: 6 }}>
            ✓ {isMock ? 'Demo logged' : 'Logged on HashKey Chain Mainnet'}
          </div>
          <div style={{
            fontFamily:  '"JetBrains Mono", monospace',
            fontSize:    10,
            color:       '#7B7368',
            wordBreak:   'break-all',
          }}>
            {txHash.slice(0, 30)}...{txHash.slice(-8)}
          </div>
          {explorerUrl && !isMock && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#0BBDCA', fontSize: 11, display: 'block', marginTop: 6 }}
            >
              View on HashKey Explorer ↗
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function ConsensusPanel({ walletAddress, onComplete }) {
  const [loading,    setLoading]    = useState(false)
  const [result,     setResult]     = useState(null)
  const [txHash,     setTxHash]     = useState(null)
  const [explorerUrl,setExplorerUrl]= useState(null)
  const [isMock,     setIsMock]     = useState(false)
  const [isLogging,  setIsLogging]  = useState(false)
  const [error,      setError]      = useState(null)

  const runConsensus = async () => {
    setLoading(true)
    setResult(null)
    setTxHash(null)
    setError(null)
    try {
      const r = await axios.post('/api/consensus', {
        wallet_address: walletAddress,
      })
      setResult(r.data)
      if (onComplete) onComplete(r.data)
    } catch (e) {
      setError('Agent consensus failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const logOnChain = async () => {
    if (!result) return
    setIsLogging(true)
    try {
      const agents = result.agents
      const voteNum = { EXECUTE: 1, DEFER: 0, REJECT: 2 }
      const r = await axios.post('/api/log-consensus', {
        wallet_address: walletAddress,
        alpha_vote:    voteNum[agents.alpha.vote]  ?? 0,
        alpha_signal:  agents.alpha.signal,
        alpha_reason:  agents.alpha.reasoning,
        alpha_conf:    agents.alpha.confidence,
        yield_vote:    voteNum[agents.yield.vote]  ?? 0,
        yield_signal:  agents.yield.signal,
        yield_reason:  agents.yield.reasoning,
        yield_conf:    agents.yield.confidence,
        guard_vote:    voteNum[agents.guard.vote]  ?? 0,
        guard_signal:  agents.guard.signal,
        guard_reason:  agents.guard.reasoning,
        guard_conf:    agents.guard.confidence,
        final_action:  result.consensus.final_action,
      })
      setTxHash(r.data.tx_hash)
      setExplorerUrl(r.data.explorer_url)
      setIsMock(r.data.mock)
    } catch (e) {
      setError('On-chain logging failed. Please retry.')
    } finally {
      setIsLogging(false)
    }
  }

  return (
    <div style={{ width: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(11,189,202,0.12)',
            border: '1px solid rgba(11,189,202,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>🧠</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#E8E2D8' }}>
              Triple-Agent Consensus
            </div>
            <div style={{ color: '#7B7368', fontSize: 12 }}>
              2-of-3 agents must vote EXECUTE before any signal fires
            </div>
          </div>
        </div>
      </div>

      {/* Run button */}
      {!loading && !result && (
        <button
          onClick={runConsensus}
          style={{
            width:        '100%',
            padding:      '14px 0',
            borderRadius: 10,
            border:       '1px solid rgba(11,189,202,0.35)',
            background:   'rgba(11,189,202,0.08)',
            color:        '#0BBDCA',
            fontWeight:   700,
            fontSize:     14,
            cursor:       'pointer',
            letterSpacing: '0.05em',
            fontFamily:   '"JetBrains Mono", monospace',
          }}
        >
          ▶ Run Agent Consensus
        </button>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>🧠</div>
          <div style={{ color: '#0BBDCA', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
            Agents deliberating...
          </div>
          <div style={{ color: '#7B7368', fontSize: 12 }}>
            AlphaAgent → YieldAgent → GuardAgent → Consensus
          </div>
        </div>
      )}

      {/* Agent cards */}
      {result && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 4 }}>
            <AgentCard agentKey="alpha" vote={result.agents?.alpha} />
            <AgentCard agentKey="yield" vote={result.agents?.yield} />
            <AgentCard agentKey="guard" vote={result.agents?.guard} />
          </div>

          <ConsensusResult
            consensus={result.consensus}
            txHash={txHash}
            explorerUrl={explorerUrl}
            isMock={isMock}
            isLogging={isLogging}
            onLog={logOnChain}
          />

          {/* Re-run */}
          <button
            onClick={runConsensus}
            style={{
              width:        '100%',
              marginTop:    12,
              padding:      '9px 0',
              borderRadius: 8,
              border:       '1px solid rgba(255,255,255,0.07)',
              background:   'transparent',
              color:        '#7B7368',
              fontSize:     12,
              cursor:       'pointer',
              fontFamily:   '"JetBrains Mono", monospace',
            }}
          >
            ↻ Re-run Consensus
          </button>
        </>
      )}

      {error && (
        <div style={{
          marginTop:    12,
          padding:      '10px 14px',
          borderRadius: 8,
          background:   'rgba(224,90,58,0.08)',
          border:       '1px solid rgba(224,90,58,0.20)',
          color:        '#E05A3A',
          fontSize:     12,
        }}>
          {error}
        </div>
      )}
    </div>
  )
}

export default ConsensusPanel
