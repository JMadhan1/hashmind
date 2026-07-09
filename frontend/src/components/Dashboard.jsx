import { useState, useEffect } from 'react'
import RecommendationCard from './RecommendationCard'
import ShareCard from './ShareCard'
import AgentActivity from './AgentActivity'
import ChatPanel from './ChatPanel'
import ConsensusPanel from './ConsensusPanel'
import axios from 'axios'

/* ═══════════════════════════════════════════════════════
   GENERATIVE IDENTITY — deterministic from wallet address
═══════════════════════════════════════════════════════ */
function hashAddr(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i)
    h = h >>> 0
  }
  return h
}

function deriveIdentity(address) {
  if (!address || address.startsWith('0xDEMO')) {
    return { color1: '#C9A84C', color2: '#0BBDCA', archetype: 'Explorer', trait: 'Curious & diversified', score: 65 }
  }
  const h0 = hashAddr(address)
  const h1 = hashAddr(address + '1')
  const h2 = hashAddr(address + '2')
  const COLORS    = ['#C9A84C','#0BBDCA','#1B7A51','#8B5CF6','#E05A3A','#3B82F6']
  const TYPES     = ['The Strategist','The Explorer','The Whale','The Builder','The Sentinel','The Harvester']
  const TRAITS    = ['Risk-aware & precise','Yield-focused & active','Diversified across protocols','Long-term & patient','Opportunistic & fast','Conservative & steady']
  return {
    color1:    COLORS[h0 % COLORS.length],
    color2:    COLORS[(h0 + 2) % COLORS.length],
    archetype: TYPES[h1 % TYPES.length],
    trait:     TRAITS[h2 % TRAITS.length],
    score:     50 + (h0 % 41),
  }
}

const ARCHETYPE_CHIPS = {
  'The Strategist': ['Risk-Calibrated', 'Yield-Maximizer', 'Data-Driven'],
  'The Explorer':   ['Multi-Protocol',  'Early-Adopter',   'Diversified'],
  'The Whale':      ['High-Volume',     'Long-Term',       'Influential'],
  'The Builder':    ['LP-Active',       'Governance',      'Protocol-Native'],
  'The Sentinel':   ['Capital-Guard',   'Low-Risk',        'Stable-First'],
  'The Harvester':  ['Yield-Focused',   'Compounding',     'Stablecoin-Heavy'],
}

function GenerativeAvatar({ address, color1, color2, size = 68 }) {
  const gradId = `av-${(address || '').slice(2, 10)}`
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 - 90) * Math.PI / 180
    const r = 22 + (hashAddr((address || '') + i) % 6)
    return `${30 + r * Math.cos(a)},${30 + r * Math.sin(a)}`
  }).join(' ')
  const inner = Array.from({ length: 3 }, (_, i) => {
    const a = (i * 120 - 90 + (hashAddr(address || '') % 50)) * Math.PI / 180
    const r = 9 + (hashAddr((address || '') + 'i' + i) % 5)
    return `${30 + r * Math.cos(a)},${30 + r * Math.sin(a)}`
  }).join(' ')
  return (
    <svg width={size} height={size} viewBox="0 0 60 60">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color1} />
          <stop offset="100%" stopColor={color2} />
        </linearGradient>
        <filter id={`glow-${gradId}`}>
          <feGaussianBlur stdDeviation="3" result="b" />
          <feComposite in="SourceGraphic" in2="b" operator="over" />
        </filter>
      </defs>
      <polygon points={pts} fill={`url(#${gradId})`} opacity="0.9" filter={`url(#glow-${gradId})`} />
      <polygon points={inner} fill="rgba(255,255,255,0.20)" />
      <circle cx="30" cy="30" r="4.5" fill="rgba(255,255,255,0.75)" />
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════
   IDENTITY PASSPORT — premium NFT-style card
═══════════════════════════════════════════════════════ */
function IdentityPassport({ address, walletData }) {
  const id = deriveIdentity(address)
  const isDemo = address?.startsWith('0xDEMO')
  const chips = ARCHETYPE_CHIPS[id.archetype] || ['DeFi-Native', 'Active']
  const circumference = 2 * Math.PI * 46
  const dash = (id.score / 100) * circumference

  return (
    <div
      className="holo-card"
      style={{
        position: 'relative', overflow: 'hidden',
        marginBottom: 20, borderRadius: 16,
        animation: 'rise 0.55s ease-out both',
      }}
    >
      {/* Wallet-derived ambient glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 55% 120% at 12% 50%, ${id.color1}16, transparent),
                     radial-gradient(ellipse 45% 100% at 88% 50%, ${id.color2}10, transparent)`,
      }} />
      {/* Subtle blueprint grid tinted by wallet color */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.028,
        backgroundImage: `linear-gradient(${id.color1} 1px, transparent 1px), linear-gradient(90deg, ${id.color1} 1px, transparent 1px)`,
        backgroundSize: '28px 28px',
      }} />

      {/* Scanner line animation */}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: '30%',
        background: `linear-gradient(to bottom, transparent, ${id.color1}08, transparent)`,
        animation: 'scanner 6s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', padding: '28px 32px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 26, flexWrap: 'wrap' }}>

          {/* Avatar + score ring */}
          <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
            {/* Outer glow */}
            <div style={{
              position: 'absolute', inset: -10, borderRadius: '50%',
              background: `radial-gradient(circle, ${id.color1}30, transparent 70%)`,
              animation: 'identity-pulse 3.5s ease-in-out infinite',
            }} />
            {/* Score ring SVG */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: 100, height: 100 }} viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
              <circle cx="50" cy="50" r="46" fill="none" stroke={id.color1}
                strokeWidth="3.5"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                opacity="0.85"
                style={{ transition: 'stroke-dasharray 1.8s cubic-bezier(0.4,0,0.2,1)' }}
              />
              {/* Score tick marks */}
              {[0, 25, 50, 75, 100].map(v => {
                const a = ((v / 100) * 360 - 90) * Math.PI / 180
                return (
                  <circle key={v}
                    cx={50 + 46 * Math.cos(a)} cy={50 + 46 * Math.sin(a)}
                    r="1.5" fill={v <= id.score ? id.color1 : 'rgba(255,255,255,0.08)'}
                  />
                )
              })}
            </svg>
            {/* Avatar centered */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <GenerativeAvatar address={address} color1={id.color1} color2={id.color2} size={68} />
            </div>
          </div>

          {/* Text block */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 9, color: id.color1, fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
                {isDemo ? 'Demo · ' : ''}On-Chain Identity
              </span>
              <span style={{
                fontSize: 8, padding: '2px 8px', borderRadius: 100,
                background: `${id.color1}10`, border: `1px solid ${id.color1}28`,
                color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.12em'
              }}>HASHKEY · 177</span>
            </div>

            <div style={{
              fontSize: 38, fontFamily: '"DM Serif Display", Georgia, serif', fontStyle: 'italic',
              color: '#E8E2D8', lineHeight: 1.05, marginBottom: 7, letterSpacing: '-0.01em',
            }}>
              {id.archetype}
            </div>

            <div style={{ fontSize: 13, color: id.color2, fontFamily: '"JetBrains Mono",monospace', marginBottom: 14, opacity: 0.9 }}>
              {id.trait}
            </div>

            {/* Trait chips */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {chips.map((c, i) => (
                <span key={i} style={{
                  fontSize: 9, padding: '3px 9px', borderRadius: 100,
                  background: `${id.color1}0c`, border: `1px solid ${id.color1}20`,
                  color: '#5E5954', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>{c}</span>
              ))}
              {walletData?.risk_profile && (
                <span style={{
                  fontSize: 9, padding: '3px 9px', borderRadius: 100,
                  background: `${id.color2}0c`, border: `1px solid ${id.color2}22`,
                  color: id.color2, fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>{walletData.risk_profile}</span>
              )}
            </div>
          </div>

          {/* Stats column */}
          <div style={{ display: 'flex', gap: 22, flexShrink: 0, alignItems: 'flex-start' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 34, fontWeight: 700, color: id.color1, fontFamily: '"JetBrains Mono",monospace', lineHeight: 1, letterSpacing: '-0.02em' }}>
                {id.score}
              </div>
              <div style={{ fontSize: 9, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 4 }}>Reputation</div>
            </div>
            {walletData?.balance_hsk !== undefined && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 34, fontWeight: 700, color: '#0BBDCA', fontFamily: '"JetBrains Mono",monospace', lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {Number(walletData.balance_hsk).toFixed(1)}
                </div>
                <div style={{ fontSize: 9, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 4 }}>HSK</div>
              </div>
            )}
            {walletData?.total_tx_count !== undefined && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 34, fontWeight: 700, color: '#1B7A51', fontFamily: '"JetBrains Mono",monospace', lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {walletData.total_tx_count}
                </div>
                <div style={{ fontSize: 9, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 4 }}>Txs</div>
              </div>
            )}
          </div>
        </div>

        {/* Address footer bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 20, padding: '10px 0',
          borderTop: `1px solid ${id.color1}10`,
        }}>
          <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: '#3E3A36', letterSpacing: '0.04em' }}>
            {address}
          </span>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: '#3E3A36', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.12em', marginRight: 4 }}>PALETTE</span>
            {[id.color1, id.color2, '#1B7A51'].map((c, i) => (
              <div key={i} style={{ width: 16, height: 16, borderRadius: 4, background: c }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   APY COMPARISON CHART
═══════════════════════════════════════════════════════ */
const PROTO_COLORS = {
  'veHSK Governance': '#C9A84C', 'WoofSwap DEX': '#0BBDCA', 'stHSK Liquid Staking': '#1B7A51',
  'HSK Staking': '#C9A84C', 'HSK Native Staking': '#8B5CF6', 'HashKey Chain Ecosystem': '#0BBDCA',
}

function APYChart({ recommendations }) {
  const recs = recommendations?.filter(r => r.estimated_apy) || []
  if (!recs.length) return null
  const parseMax = apy => Math.max(...(apy || '0').replace(/%/g, '').split('-').map(Number))
  const maxAPY = Math.max(...recs.map(r => parseMax(r.estimated_apy)), 8)

  return (
    <div className="bento-card" style={{ padding: '20px 24px', marginBottom: 20 }}>
      <div style={{ fontSize: 9, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16 }}>
        ◆ APY Comparison · AI-Selected Protocols
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {recs.map((rec, i) => {
          const apy = parseMax(rec.estimated_apy)
          const pct = (apy / maxAPY) * 100
          const color = PROTO_COLORS[rec.specific_protocol] || '#C9A84C'
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 112, fontSize: 10, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {rec.specific_protocol}
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 4, height: 22, overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${color}40, ${color}cc)`,
                  borderRadius: 4,
                  animation: `apy-fill 1.4s ${i * 0.15}s ease-out both`,
                  display: 'flex', alignItems: 'center',
                }}>
                  {pct > 30 && (
                    <span style={{ paddingLeft: 8, fontSize: 10, color: '#E8E2D8', fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {rec.estimated_apy}
                    </span>
                  )}
                </div>
                {pct <= 30 && (
                  <span style={{ position: 'absolute', left: `${pct}%`, paddingLeft: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: color, fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {rec.estimated_apy}
                  </span>
                )}
              </div>
              <div style={{ width: 36, fontSize: 11, color, fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, flexShrink: 0, textAlign: 'right' }}>
                {apy}%
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   AGENT DECISION HERO — top recommendation featured large
═══════════════════════════════════════════════════════ */
function AgentDecisionHero({ recommendation }) {
  if (!recommendation) return null
  const conf = recommendation.confidence
  const confColor = conf >= 70 ? '#1B7A51' : conf >= 50 ? '#C9A84C' : '#D9534F'

  return (
    <div className="bento-card-accent card-3d" style={{
      padding: '24px 28px', marginBottom: 20,
      background: 'linear-gradient(135deg, rgba(201,168,76,0.03), rgba(11,189,202,0.02), transparent)',
      animation: 'rise 0.5s ease-out both',
    }}>
      <div style={{ fontSize: 9, color: '#C9A84C', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 12 }}>
        ◆ Top AI Decision · HashKey Chain DeFi
      </div>
      <div style={{
        fontSize: 24, fontFamily: '"DM Serif Display", Georgia, serif', fontStyle: 'italic',
        color: '#E8E2D8', marginBottom: 10, lineHeight: 1.25, letterSpacing: '-0.01em',
      }}>
        {recommendation.action}
      </div>
      <div style={{ fontSize: 13, color: '#7B7368', marginBottom: 18, lineHeight: 1.75, maxWidth: 680 }}>
        {recommendation.reasoning}
      </div>
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 9, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Protocol</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', fontFamily: '"Space Grotesk",sans-serif', letterSpacing: '-0.01em' }}>
            {recommendation.specific_protocol}
          </div>
        </div>
        {recommendation.estimated_apy && (
          <div>
            <div style={{ fontSize: 9, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Est. APY</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0BBDCA', fontFamily: '"JetBrains Mono",monospace' }}>{recommendation.estimated_apy}</div>
          </div>
        )}
        <div>
          <div style={{ fontSize: 9, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Confidence</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: confColor, fontFamily: '"JetBrains Mono",monospace' }}>{conf}%</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Risk</div>
          <span style={{
            fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 5,
            background: recommendation.risk_level === 'low' ? 'rgba(27,122,81,0.12)' : recommendation.risk_level === 'high' ? 'rgba(217,83,79,0.10)' : 'rgba(201,168,76,0.10)',
            color: recommendation.risk_level === 'low' ? '#1B7A51' : recommendation.risk_level === 'high' ? '#D9534F' : '#C9A84C',
            border: `1px solid currentColor`,
            fontFamily: '"JetBrains Mono",monospace',
          }}>
            {recommendation.risk_level?.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   AGENT REPUTATION
═══════════════════════════════════════════════════════ */
function AgentReputationCard({ agentStats }) {
  if (!agentStats) return null
  const score = agentStats.reputation_score ?? 80
  const scoreColor = score >= 80 ? '#1B7A51' : score >= 60 ? '#C9A84C' : '#D9534F'
  return (
    <div className="bento-card" style={{ padding: '16px 22px', marginBottom: 20, borderLeft: `3px solid ${scoreColor}` }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
            <svg viewBox="0 0 36 36" style={{ width: 48, height: 48, transform: 'rotate(-90deg)' }}>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={scoreColor}
                strokeWidth="3" strokeDasharray={`${score} ${100 - score}`} strokeLinecap="round" />
            </svg>
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"JetBrains Mono",monospace', fontSize: 11, fontWeight: 700, color: scoreColor }}>
              {score}
            </span>
          </div>
          <div>
            <div style={{ fontSize: 9, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 3 }}>Agent Reputation</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#C9A84C', fontFamily: '"Space Grotesk",sans-serif' }}>
              {agentStats.name} <span style={{ color: '#7B7368', fontWeight: 400, fontSize: 12 }}>v{agentStats.version}</span>
            </div>
            <div style={{ fontSize: 10, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace' }}>
              <span style={{ color: '#C9A84C', fontWeight: 700 }}>{agentStats.total_consensus ?? 0}</span> on-chain
              {agentStats.source === 'on-chain' && <span style={{ marginLeft: 8, color: '#1B7A51' }}>● live</span>}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 11, fontFamily: '"JetBrains Mono",monospace', textAlign: 'right' }}>
          <div style={{ color: '#7B7368', marginBottom: 2 }}>stHSK APY</div>
          <div style={{ color: '#0BBDCA', fontWeight: 700 }}>6–10%</div>
          <div style={{ color: '#7B7368', fontSize: 9 }}>HashKey Chain Mainnet</div>
          {agentStats.explorer_url && (
            <a href={agentStats.explorer_url} target="_blank" rel="noopener noreferrer"
              style={{ color: '#0BBDCA', fontSize: 9, textDecoration: 'none', display: 'block', marginTop: 2 }}>
              View contract ↗
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   DEMO DATA
═══════════════════════════════════════════════════════ */
const DEMO_WALLET_DATA = {
  balance_hsk: 500.0, total_tx_count: 23,
  risk_profile: 'moderate', activity_level: 'active',
  tokens: { USDT: 200, WETH: 0.12, stHSK: 100, veHSK: 0, WHSK: 50 },
  chain: 'HashKey Chain', chain_id: 177,
}
const DEMO_RECOMMENDATIONS = [
  { action: 'Stake HSK as stHSK', reasoning: 'stHSK offers 6–10% APY with no lockup. Your 500 HSK balance makes this the highest-confidence yield action on HashKey Chain.', confidence: 85, risk_level: 'low', specific_protocol: 'stHSK Liquid Staking', estimated_apy: '6-10%' },
  { action: 'Lock stHSK in veHSK', reasoning: 'Boost your stHSK yield up to 4× through veHSK governance lock. Your moderate risk profile suits a 3-month lock.', confidence: 74, risk_level: 'medium', specific_protocol: 'veHSK Governance', estimated_apy: 'Up to 4× boost' },
  { action: 'Provide HSK/USDT on WoofSwap', reasoning: 'WoofSwap offers 5–30% fee APY on HSK/USDT pairs. IL risk is moderate — suitable for your risk profile.', confidence: 68, risk_level: 'medium', specific_protocol: 'WoofSwap DEX', estimated_apy: '5-30%' },
]

/* ═══════════════════════════════════════════════════════
   ANIMATED NUMBER
═══════════════════════════════════════════════════════ */
function AnimatedNumber({ value, decimals = 2 }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const end = parseFloat(value) || 0
    if (end === 0) { setDisplay(0); return }
    const inc = end / (900 / 16)
    let cur = 0
    const t = setInterval(() => {
      cur += inc
      if (cur >= end) { setDisplay(end); clearInterval(t) }
      else setDisplay(cur)
    }, 16)
    return () => clearInterval(t)
  }, [value])
  return (
    <span>
      {decimals === 0
        ? Math.round(display).toLocaleString()
        : display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════ */
function Dashboard({ walletAddress, walletData, recommendations, isAnalyzing, onAnalyze, onAnalysisComplete }) {
  const [localWalletData, setLocalWalletData] = useState(walletData)
  const [localRecommendations, setLocalRecommendations] = useState(recommendations)
  const [loading, setLoading] = useState(isAnalyzing)
  const [usingDemo, setUsingDemo] = useState(false)
  const [agentRunning, setAgentRunning] = useState(false)
  const [agentResult, setAgentResult] = useState(null)
  const [agentStats, setAgentStats] = useState(null)

  useEffect(() => {
    axios.get('/api/agent/stats').then(r => setAgentStats(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (walletAddress && !walletData && !isAnalyzing) analyzeWallet()
  }, [walletAddress])

  useEffect(() => {
    setLocalWalletData(walletData)
    setLocalRecommendations(recommendations)
    setLoading(isAnalyzing)
  }, [walletData, recommendations, isAnalyzing])

  const analyzeWallet = async () => {
    setLoading(true); setUsingDemo(false)
    try {
      const r = await axios.post('/api/analyze', { wallet_address: walletAddress })
      setLocalWalletData(r.data)
      setLocalRecommendations([])
      onAnalysisComplete(r.data, [])
    } catch {
      setLocalWalletData(DEMO_WALLET_DATA)
      setLocalRecommendations(DEMO_RECOMMENDATIONS)
      setUsingDemo(true)
      onAnalysisComplete(DEMO_WALLET_DATA, DEMO_RECOMMENDATIONS)
    } finally { setLoading(false) }
  }

  const handleAnalyze = () => { onAnalyze(); analyzeWallet() }

  const handleAgentRun = async () => {
    // Now redirects users to the ConsensusPanel below — no separate agent run
    setAgentRunning(true); setAgentResult(null)
    try {
      const r = await axios.post('/api/consensus', { wallet_address: walletAddress })
      setAgentResult({
        agent_id: 'hashmind-consensus-v2',
        agent_decision: {
          action_taken: r.data.consensus?.final_action,
          protocol:     r.data.agents?.yield?.signal,
          confidence:   r.data.consensus?.aggregated_confidence,
          reasoning:    r.data.consensus?.summary,
          executed:     r.data.consensus?.reached,
          mock:         true,
        },
        wallet_profile: r.data.wallet_profile,
      })
    } catch {
      setAgentResult({ error: 'Consensus agents unavailable — backend may be offline.' })
    } finally { setAgentRunning(false) }
  }

  const riskColor = p => ({ conservative: '#1B7A51', moderate: '#C9A84C', aggressive: '#D9534F' }[p] || '#1B7A51')
  const riskBg    = p => ({ conservative: 'rgba(27,122,81,0.10)', moderate: 'rgba(201,168,76,0.10)', aggressive: 'rgba(217,83,79,0.10)' }[p] || 'rgba(27,122,81,0.10)')
  const actColor  = l => ({ new: '#3B82F6', active: '#1B7A51', whale: '#8B5CF6' }[l] || '#7B7368')

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ marginBottom: 24, width: 40, height: 40 }} />
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#C9A84C', marginBottom: 8, fontFamily: '"Space Grotesk",sans-serif', fontStyle: 'italic' }}>
          Analyzing your on-chain history…
        </h2>
        <p style={{ color: '#7B7368', fontSize: 13, fontFamily: '"JetBrains Mono",monospace' }}>
          Reading HashKey Chain · Fetching live APY · Generating identity
        </p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">

      {/* ① Identity Passport — full-width premium card */}
      <IdentityPassport address={walletAddress} walletData={localWalletData} />

      {/* ② Agent reputation */}
      <AgentReputationCard agentStats={agentStats} />

      {/* Demo banner */}
      {usingDemo && (
        <div style={{ marginBottom: 16, padding: '9px 16px', borderRadius: 8, background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.22)', color: '#C9A84C', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, fontFamily: '"JetBrains Mono",monospace' }}>
          <span>◎</span>
          Backend unreachable — showing demo data. Start the backend to see real analysis.
        </div>
      )}

      {/* ③ Bento stats + action buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 16 }}>
        <div className="bento-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 9, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 7 }}>HSK Balance</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#C9A84C', fontFamily: '"JetBrains Mono",monospace', lineHeight: 1, marginBottom: 2 }}>
            <AnimatedNumber value={localWalletData?.balance_hsk || 0} />
          </div>
          <div style={{ fontSize: 10, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace' }}>HSK</div>
        </div>

        <div className="bento-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 9, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 7 }}>Transactions</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0BBDCA', fontFamily: '"JetBrains Mono",monospace', lineHeight: 1, marginBottom: 2 }}>
            <AnimatedNumber value={localWalletData?.total_tx_count || 0} decimals={0} />
          </div>
          <div style={{ fontSize: 10, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace' }}>on-chain</div>
        </div>

        <div className="bento-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 9, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 10 }}>Risk Profile</div>
          <span style={{
            padding: '4px 12px', borderRadius: 5, fontSize: 12, fontWeight: 600,
            color: riskColor(localWalletData?.risk_profile),
            background: riskBg(localWalletData?.risk_profile),
            border: `1px solid ${riskColor(localWalletData?.risk_profile)}30`,
            fontFamily: '"Space Grotesk",sans-serif',
          }}>{localWalletData?.risk_profile || 'Unknown'}</span>
        </div>

        <div className="bento-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 9, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 7 }}>Activity Level</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: '"Space Grotesk",sans-serif', color: actColor(localWalletData?.activity_level) }}>
            {localWalletData?.activity_level || 'Unknown'}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        <button onClick={handleAnalyze} className="btn-ghost">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Re-analyze
        </button>
        <button onClick={handleAgentRun} disabled={agentRunning} className="btn-primary" style={{ fontSize: 13 }}>
          {agentRunning
            ? <><div className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} />Agent deciding…</>
            : <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Run Agent Autonomously
              </>
          }
        </button>
      </div>

      {/* Agent result panel */}
      {agentResult && !agentResult.error && (
        <div className="bento-card" style={{ padding: '20px 24px', marginBottom: 20, borderLeft: '3px solid #1B7A51', animation: 'rise 0.4s ease-out both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1B7A51', boxShadow: '0 0 6px #1B7A51', display: 'inline-block' }} />
            <h3 style={{ fontWeight: 700, color: '#C9A84C', fontSize: 14, fontFamily: '"Space Grotesk",sans-serif' }}>Agent Execution Report</h3>
            <span style={{ marginLeft: 'auto', fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7B7368' }}>{agentResult.agent_id}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 9, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Decision</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#E8E2D8' }}>{agentResult.agent_decision?.action_taken || 'No action — deferred to human'}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Protocol</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#C9A84C' }}>{agentResult.agent_decision?.protocol || '—'}</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 9, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Reasoning</div>
              <div style={{ fontSize: 12, color: '#7B7368', lineHeight: 1.7 }}>{agentResult.agent_decision?.reasoning}</div>
            </div>
          </div>
          {agentResult.agent_decision?.tx_hash && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(201,168,76,0.10)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: '#1B7A51', fontWeight: 600 }}>✓ Logged on HashKey Chain{agentResult.agent_decision.mock ? ' (demo)' : ''}</span>
              <a href={agentResult.agent_decision.explorer_url} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#C9A84C', textDecoration: 'none' }}>
                {agentResult.agent_decision.tx_hash.slice(0, 18)}… ↗
              </a>
            </div>
          )}
        </div>
      )}

      {agentResult?.error && (
        <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 8, background: 'rgba(217,83,79,0.08)', border: '1px solid rgba(217,83,79,0.22)', color: '#D9534F', fontSize: 12, fontFamily: '"JetBrains Mono",monospace' }}>
          {agentResult.error}
        </div>
      )}

      {/* ④ APY Comparison Chart */}
      <APYChart recommendations={localRecommendations} />

      {/* ⑤ Agent Decision Hero — top recommendation featured */}
      {localRecommendations?.length > 0 && (
        <AgentDecisionHero recommendation={localRecommendations[0]} />
      )}

      {/* ⑥ All Recommendation Cards */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#E8E2D8', fontFamily: '"Space Grotesk",sans-serif', letterSpacing: '-0.02em' }}>
            AI Recommendations
          </h2>
          {localRecommendations?.length > 0 && (
            <span style={{ fontSize: 9, padding: '3px 9px', borderRadius: 100, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.20)', color: '#C9A84C', fontFamily: '"JetBrains Mono",monospace' }}>
              {localRecommendations.length} protocols
            </span>
          )}
        </div>
        {localRecommendations?.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            {localRecommendations.map((rec, i) => (
              <div key={i} style={{ animation: `rise 0.5s ease-out ${i * 0.1}s both` }}>
                <RecommendationCard recommendation={rec} walletAddress={walletAddress} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bento-card" style={{ padding: 28, textAlign: 'center', color: '#7B7368', fontSize: 13, fontFamily: '"JetBrains Mono",monospace' }}>
            No recommendations yet — click "Re-analyze" to get started.
          </div>
        )}
      </div>

      {/* ⑦ Triple-Agent Consensus Panel — HashMind signature feature */}
      <div className="bento-card" style={{ padding: '22px 24px', marginBottom: 24, borderTop: '2px solid rgba(11,189,202,0.20)' }}>
        <ConsensusPanel walletAddress={walletAddress} />
      </div>

      {/* ⑧ AI Advisor */}
      <div style={{ marginBottom: 24 }}>
        <ChatPanel walletAddress={walletAddress} />
      </div>

      {/* ⑧ Share card */}
      {localRecommendations?.length > 0 && <ShareCard recommendation={localRecommendations[0]} />}

      {/* ⑨ Agent activity feed */}
      <div style={{ marginTop: 24 }}>
        <AgentActivity />
      </div>

      {/* ⑩ Token balances */}
      {localWalletData?.tokens && Object.keys(localWalletData.tokens).length > 0 && (
        <div className="bento-card" style={{ padding: '18px 22px', marginTop: 20 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: '#C9A84C', marginBottom: 14, fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Token Balances
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 12 }}>
            {Object.entries(localWalletData.tokens).map(([token, balance]) => (
              <div key={token}>
                <div style={{ fontSize: 10, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', marginBottom: 3 }}>{token}</div>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 15, fontWeight: 700, color: '#E8E2D8' }}>{Number(balance).toFixed(4)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

export default Dashboard
