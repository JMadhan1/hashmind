import { useState, useEffect } from 'react'
import axios from 'axios'
import WalletConnect from './components/WalletConnect'
import Dashboard from './components/Dashboard'
import OnChainLog from './components/OnChainLog'
import NetworkBadge from './components/NetworkBadge'

/* ─── Stat terminal box ────────────────────────────────── */
function StatBox({ label, value, green, teal }) {
  return (
    <div className="stat-box">
      <div className={`stat-value${green ? ' green' : teal ? ' teal' : ''}`}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

/* ─── Constants ────────────────────────────────────────── */
const PROTOCOLS = [
  { name: 'stHSK Liquid Staking', icon: '◆' },
  { name: 'veHSK Governance',     icon: '◈' },
  { name: 'WoofSwap DEX',         icon: '◉' },
  { name: 'HSK Native Staking',   icon: '○' },
  { name: 'HSP Settlement',       icon: '⚡' },
  { name: 'HashKey Chain 177',    icon: '●' },
  { name: 'AlphaAgent',           icon: '◎' },
  { name: 'YieldAgent',           icon: '◈' },
  { name: 'GuardAgent',           icon: '◉' },
]

const STEPS = [
  {
    num: '01', title: 'Perceive', color: '#C9A84C',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
    desc: 'Reads live wallet data, HSK balances, stHSK & veHSK positions from HashKey Chain Mainnet via Blockscout API.',
  },
  {
    num: '02', title: 'Deliberate', color: '#0BBDCA',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/><path d="M10 21h4"/>
      </svg>
    ),
    desc: 'AlphaAgent reads on-chain metrics. YieldAgent finds best APY. GuardAgent reviews risk. All three vote independently.',
  },
  {
    num: '03', title: 'Consensus', color: '#1B7A51',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    desc: '2-of-3 agents must vote EXECUTE before any signal fires. No single AI can move capital alone.',
  },
  {
    num: '04', title: 'Prove', color: '#8B5CF6',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    desc: 'All 3 votes written to HashMind.sol on HashKey Chain Mainnet. Immutable. Auditable. Forever. Anyone can verify.',
  },
  {
    num: '05', title: 'HSP Settle', color: '#E05A3A',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
    desc: 'Consensus confirmed on-chain → executeWithHSP() fires. Capital moves only after cryptographic proof of 3-agent agreement.',
  },
]


/* ─── App ──────────────────────────────────────────────── */
function App() {
  const [walletAddress, setWalletAddress] = useState(null)
  const [walletData, setWalletData] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentView, setCurrentView] = useState('home')
  const [globalCount, setGlobalCount] = useState(null)
  const [liveStats, setLiveStats] = useState(null)

  useEffect(() => {
    // Pre-warm Render backend immediately on page load
    axios.get('/api/health', { timeout: 35000 }).catch(() => {})

    const fetchStats = () => {
      axios.get('/api/hashkey/stats')
        .then(r => {
          setLiveStats(r.data)
          if (r.data.total_consensus > 0) setGlobalCount(r.data.total_consensus)
        })
        .catch(() => {})
    }
    fetchStats()
    const poll = setInterval(fetchStats, 30000)
    return () => clearInterval(poll)
  }, [])

  const handleWalletConnect = addr => { setWalletAddress(addr); setCurrentView('dashboard') }
  const handleAnalysisComplete = (data, recs) => { setWalletData(data); setRecommendations(recs); setIsAnalyzing(false) }
  const handleAnalyze = () => { setIsAnalyzing(true); setCurrentView('dashboard') }

  const S = { maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }

  return (
    <div style={{ minHeight: '100vh', background: '#07080C', color: '#E8E2D8', display: 'flex', flexDirection: 'column' }}>
      <div className="noise" />

      {/* ═══════════════ HEADER ═════════════════════════════ */}
      <header style={{
        borderBottom: '1px solid rgba(201,168,76,0.10)',
        padding: '0 24px', height: 64, position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(7,8,12,0.92)', backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          {/* Logo */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, cursor: 'pointer' }}
            onClick={() => { setCurrentView('home'); setWalletAddress(null) }}
          >
            <img
              src="/logo.png"
              alt="HashMind"
              style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, objectFit: 'cover', boxShadow: '0 0 16px rgba(201,168,76,0.35)' }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, fontFamily: '"Space Grotesk",sans-serif', letterSpacing: '-0.02em', color: '#E8E2D8' }}>HashMind</div>
              <div style={{ fontSize: 9, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.10em', textTransform: 'uppercase' }}>Triple-Agent · HSP · Chain 177</div>
            </div>
          </div>

          <NetworkBadge />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {walletAddress && (
              <div style={{ display: 'flex', gap: 4 }}>
                {['dashboard','history'].map(v => (
                  <button key={v} onClick={() => setCurrentView(v)} style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    textTransform: 'capitalize', fontFamily: '"Space Grotesk",sans-serif',
                    border: currentView === v ? '1px solid rgba(201,168,76,0.32)' : '1px solid transparent',
                    background: currentView === v ? 'rgba(201,168,76,0.08)' : 'transparent',
                    color: currentView === v ? '#C9A84C' : '#7B7368', transition: 'all 0.2s ease',
                  }}>
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            )}
            <WalletConnect onConnect={handleWalletConnect} walletAddress={walletAddress} />
          </div>
        </div>
      </header>

      {/* ═══════════════ MAIN ════════════════════════════════ */}
      <main style={{ flex: 1 }}>

        {/* ────────── LANDING ──────────────────────────────── */}
        {currentView === 'home' && !walletAddress && (
          <>
            {/* ══════ HERO ════════════════════════════════════ */}
            <section style={{ position: 'relative', minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>

              {/* 3D Perspective grid — Trend 2: Functional 3D */}
              <div className="perspective-scene">
                <div className="perspective-grid" />
              </div>

              {/* Warm orbs */}
              <div className="orb orb-gold"   style={{ width: 700, height: 700, top: -200, left: -150 }} />
              <div className="orb orb-teal"   style={{ width: 500, height: 500, top: 60, right: -130, animationDelay: '-6s' }} />
              <div className="orb orb-forest" style={{ width: 400, height: 400, bottom: -120, left: '42%', animationDelay: '-11s' }} />

              {/* Bottom fade */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to bottom, transparent, #07080C)', pointerEvents: 'none', zIndex: 2 }} />

              {/* Content — Trend 1: Calm Institutional */}
              <div style={{
                position: 'relative', zIndex: 3,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                textAlign: 'center', padding: '80px 24px', maxWidth: 820, margin: '0 auto',
              }}>

                {/* Live badge */}
                <div className="neon-badge animate-fade-in" style={{ marginBottom: 36 }}>
                  <span className="live-dot" />
                  LIVE ON HASHKEY CHAIN MAINNET · HSP INTEGRATED · CONTRACT DEPLOYED
                </div>

                {/* Serif display heading — Trend 1: institutional typography */}
                <div style={{ marginBottom: 10 }}>
                  <span style={{
                    fontFamily: '"DM Serif Display", Georgia, serif',
                    fontSize: 'clamp(2.2rem, 7vw, 4.5rem)',
                    fontWeight: 400,
                    fontStyle: 'italic',
                    color: 'rgba(232,226,216,0.45)',
                    letterSpacing: '-0.01em',
                    lineHeight: 1,
                    display: 'block',
                  }}>
                    Autonomous. Transparent.
                  </span>
                </div>

                {/* Giant sans-serif title */}
                <h1
                  className="gradient-text"
                  style={{
                    fontSize: 'clamp(4rem, 13vw, 9.5rem)',
                    fontWeight: 800,
                    letterSpacing: '-0.045em',
                    lineHeight: 0.86,
                    marginBottom: 28,
                    fontFamily: '"Space Grotesk", sans-serif',
                  }}
                >
                  HashMind
                </h1>

                <p style={{ color: '#7B7368', maxWidth: 560, fontSize: 15, lineHeight: 1.78, marginBottom: 24 }}>
                  <span style={{ color: '#C9A84C', fontWeight: 600 }}>3 AI agents must agree</span> before any trade signal fires.
                  {' '}AlphaAgent, YieldAgent, and GuardAgent vote independently — 2-of-3 EXECUTE required.
                  <br /><br />
                  Every vote is <span style={{ color: '#0BBDCA', fontWeight: 600 }}>immutably on-chain</span> before the outcome is known.
                  {' '}Then and only then does{' '}
                  <span style={{ color: '#E05A3A', fontWeight: 600 }}>HSP settlement</span> fire.
                </p>

                {/* Live Contract address */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40,
                  padding: '10px 18px', borderRadius: 10,
                  background: 'rgba(11,189,202,0.05)', border: '1px solid rgba(11,189,202,0.18)',
                  fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
                  flexWrap: 'wrap', justifyContent: 'center',
                }}>
                  <span style={{ color: '#7B7368' }}>Contract live:</span>
                  <a
                    href="https://hsk.blockscout.com/address/0xCDb15987099FBFC1e61563F39C138dF9635c273B"
                    target="_blank" rel="noopener noreferrer"
                    style={{ color: '#0BBDCA', textDecoration: 'none', letterSpacing: '0.03em' }}
                  >
                    0xCDb1...273B
                  </a>
                  <span style={{ color: 'rgba(201,168,76,0.3)' }}>·</span>
                  <span style={{ color: '#C9A84C' }}>Chain 177</span>
                  <span style={{ color: 'rgba(201,168,76,0.3)' }}>·</span>
                  <span style={{ color: '#00E676' }}>● MAINNET</span>
                </div>

                {/* Live stats terminal — Trend 4: High-Disclosure UX */}
                {liveStats && (
                  <div style={{
                    display: 'flex', marginBottom: 44,
                    background: 'rgba(0,0,0,0.65)',
                    border: '1px solid rgba(201,168,76,0.14)',
                    borderRadius: 12, overflow: 'hidden',
                    backdropFilter: 'blur(16px)',
                    boxShadow: '0 0 40px rgba(201,168,76,0.04), inset 0 1px 0 rgba(255,255,255,0.02)',
                  }}>
                    <StatBox label="BLOCK" value={Number(liveStats.block_number).toLocaleString()} />
                    <div style={{ width: 1, background: 'rgba(201,168,76,0.08)' }} />
                    <StatBox label="GWEI"  value={parseFloat(liveStats.gas_price_gwei).toFixed(4)} teal />
                    <div style={{ width: 1, background: 'rgba(201,168,76,0.08)' }} />
                    <StatBox label="STATUS" value="LIVE" green />
                  </div>
                )}

                {/* On-chain count */}
                {globalCount && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    marginBottom: 36, padding: '9px 22px',
                    background: 'rgba(27,122,81,0.08)',
                    border: '1px solid rgba(27,122,81,0.20)',
                    borderRadius: 100, fontSize: 13,
                    fontFamily: '"JetBrains Mono", monospace',
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: '#1B7A51', boxShadow: '0 0 8px #1B7A51', display: 'inline-block' }} />
                    <span style={{ color: '#7B7368' }}>
                      <span style={{ color: '#1B7A51', fontWeight: 700 }}>{globalCount.toLocaleString()}</span>
                      {' '}AI decisions recorded on HashKey Chain
                    </span>
                  </div>
                )}

                {/* CTAs */}
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
                  <WalletConnect onConnect={handleWalletConnect} />
                  <button
                    onClick={() => handleWalletConnect('0xDEMO000000000000000000000000000000000001')}
                    className="btn-secondary"
                  >
                    <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 12 }}>◎</span>
                    Try Demo — No Wallet
                  </button>
                </div>
                <p style={{ color: '#3E3A36', fontSize: 11.5, fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.05em' }}>
                  Demo uses example data · No real transactions · Safe to explore
                </p>
              </div>
            </section>

            {/* ══════ AGENTIC LOOP — Trend 2: Functional 3D ══ */}
            <section style={{ padding: '96px 24px', borderTop: '1px solid rgba(201,168,76,0.07)' }}>
              <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 64 }}>
                  <div className="section-eyebrow" style={{ marginBottom: 22 }}>THE AGENTIC LOOP</div>
                  <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 700, letterSpacing: '-0.025em', fontFamily: '"Space Grotesk",sans-serif', marginBottom: 12, color: '#E8E2D8' }}>
                    How the Agent{' '}
                    <span className="gradient-text-static">Thinks, Decides & Proves</span>
                  </h2>
                  <p style={{ color: '#7B7368', fontSize: 14, maxWidth: 460, margin: '0 auto' }}>
                    Every cycle produces an immutable on-chain audit trail. No black boxes. Ever.
                  </p>
                </div>

                {/* 3D step cards — Trend 2 */}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {STEPS.map((step, i) => (
                    <div key={step.num} style={{ flex: '1 1 220px', display: 'flex', alignItems: 'center', gap: 0 }}>
                      {/* Card with 3D hover */}
                      <div
                        className="holo-card card-3d"
                        style={{ flex: 1, padding: '28px 24px', animation: `rise 0.6s ease-out ${i * 0.13}s both` }}
                      >
                        {/* Top row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                          <div style={{
                            width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                            background: `linear-gradient(135deg, ${step.color}22, ${step.color}0a)`,
                            border: `1px solid ${step.color}35`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: step.color,
                          }}>
                            {step.icon}
                          </div>
                          <span style={{
                            fontFamily: '"JetBrains Mono",monospace', fontSize: 36, fontWeight: 800,
                            color: `${step.color}14`, lineHeight: 1, letterSpacing: '-0.04em', userSelect: 'none',
                          }}>
                            {step.num}
                          </span>
                        </div>

                        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: step.color, fontWeight: 700, marginBottom: 8, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                          Step {step.num}
                        </div>
                        <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 10, fontFamily: '"Space Grotesk",sans-serif', letterSpacing: '-0.02em', color: '#E8E2D8' }}>
                          {step.title}
                        </h3>
                        <p style={{ fontSize: 13, color: '#7B7368', lineHeight: 1.72 }}>{step.desc}</p>
                      </div>

                      {/* Arrow */}
                      {i < STEPS.length - 1 && (
                        <div className="hidden md:flex" style={{ alignItems: 'center', width: 32, flexShrink: 0, justifyContent: 'center' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M5 12h14M14 6l6 6-6 6" stroke={step.color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.45" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ══════ AGENT VOTE VISUALIZER ══════════════════════ */}
            <section style={{ padding: '80px 24px', borderTop: '1px solid rgba(201,168,76,0.07)', background: 'rgba(0,0,0,0.18)' }}>
              <div style={{ maxWidth: 960, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 44 }}>
                  <div className="section-eyebrow" style={{ marginBottom: 14 }}>TRIPLE-AGENT CONSENSUS ENGINE</div>
                  <h2 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 700, letterSpacing: '-0.025em', fontFamily: '"Space Grotesk",sans-serif', color: '#E8E2D8' }}>
                    No Single AI Controls Your Capital
                  </h2>
                </div>

                {/* Agent vote cards */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 28 }}>
                  {[
                    { name: 'AlphaAgent', role: 'Market Signal', icon: '📡', color: '#0BBDCA', vote: 'EXECUTE', conf: 82, signal: 'On-chain activity up 34% · accumulate HSK' },
                    { name: 'YieldAgent', role: 'Yield Optimiser', icon: '⚡', color: '#C9A84C', vote: 'EXECUTE', conf: 78, signal: 'stHSK APY 8.4% · add liquidity to stHSK pool' },
                    { name: 'GuardAgent', role: 'Risk Assessment', icon: '🛡', color: '#8B5CF6', vote: 'DEFER',   conf: 55, signal: 'Portfolio at 62% exposure · monitor for 24h' },
                  ].map(agent => (
                    <div key={agent.name} style={{
                      flex: '1 1 260px', maxWidth: 300,
                      padding: '20px', borderRadius: 12,
                      background: 'rgba(255,255,255,0.02)',
                      border: `1px solid ${agent.color}28`,
                      position: 'relative', overflow: 'hidden',
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${agent.color}80, transparent)` }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{agent.icon}</span>
                          <div>
                            <div style={{ color: agent.color, fontWeight: 700, fontSize: 13 }}>{agent.name}</div>
                            <div style={{ color: '#7B7368', fontSize: 10 }}>{agent.role}</div>
                          </div>
                        </div>
                        <div style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          fontFamily: '"JetBrains Mono",monospace',
                          background: agent.vote === 'EXECUTE' ? 'rgba(0,230,118,0.12)' : 'rgba(201,168,76,0.12)',
                          border: `1px solid ${agent.vote === 'EXECUTE' ? 'rgba(0,230,118,0.35)' : 'rgba(201,168,76,0.35)'}`,
                          color: agent.vote === 'EXECUTE' ? '#00E676' : '#C9A84C',
                        }}>{agent.vote === 'EXECUTE' ? '✓' : '⏸'} {agent.vote}</div>
                      </div>
                      <div style={{ fontSize: 12, color: '#9E9690', marginBottom: 12, lineHeight: 1.5, fontStyle: 'italic' }}>"{agent.signal}"</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: '#7B7368' }}>Confidence</span>
                        <span style={{ fontSize: 10, color: agent.color, fontFamily: '"JetBrains Mono",monospace', fontWeight: 700 }}>{agent.conf}%</span>
                      </div>
                      <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${agent.conf}%`, background: `linear-gradient(90deg, ${agent.color}80, ${agent.color})`, borderRadius: 2 }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Consensus result */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
                  padding: '18px 28px', borderRadius: 12, flexWrap: 'wrap',
                  background: 'rgba(0,230,118,0.04)', border: '1px solid rgba(0,230,118,0.20)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#00E676', boxShadow: '0 0 8px #00E676', display: 'inline-block' }} />
                    <span style={{ color: '#00E676', fontWeight: 700, fontSize: 14, fontFamily: '"JetBrains Mono",monospace' }}>2 / 3 EXECUTE — CONSENSUS REACHED</span>
                  </div>
                  <span style={{ color: 'rgba(201,168,76,0.3)' }}>·</span>
                  <span style={{ fontSize: 12, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace' }}>logConsensusVotes() fired on HashKey Chain</span>
                  <span style={{ color: 'rgba(201,168,76,0.3)' }}>·</span>
                  <span style={{ fontSize: 12, color: '#E05A3A', fontFamily: '"JetBrains Mono",monospace' }}>⚡ executeWithHSP() ready</span>
                </div>
              </div>
            </section>

            {/* ══════ BENTO GRID — Trend 3: Structural Brutalism ══ */}
            <section style={{ padding: '80px 24px', borderTop: '1px solid rgba(201,168,76,0.07)' }}>
              <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 56 }}>
                  <div className="section-eyebrow" style={{ marginBottom: 22 }}>WHY HASHMIND</div>
                  <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 700, letterSpacing: '-0.025em', fontFamily: '"Space Grotesk",sans-serif', color: '#E8E2D8' }}>
                    Built Different.{' '}
                    <span className="gradient-text-static">Provably Better.</span>
                  </h2>
                </div>

                {/* Bento grid — Trend 3 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gridTemplateRows: 'auto', gap: 12 }}>

                  {/* Large card — spans 7 cols */}
                  <div className="bento-card card-3d" style={{ gridColumn: '1 / 8', padding: '36px', animation: 'rise 0.6s ease-out 0s both' }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 20 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#C9A84C', flexShrink: 0, fontFamily: '"JetBrains Mono",monospace' }}>◈</div>
                      <div>
                        <div style={{ fontSize: 10, color: '#C9A84C', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.15em', marginBottom: 6, textTransform: 'uppercase' }}>Core Feature · 01</div>
                        <h3 style={{ fontSize: 22, fontWeight: 700, color: '#E8E2D8', letterSpacing: '-0.02em', marginBottom: 8, fontFamily: '"Space Grotesk",sans-serif' }}>Radical Transparency</h3>
                        <p style={{ fontSize: 14, color: '#7B7368', lineHeight: 1.75, maxWidth: 420 }}>
                          Every AI decision is a public on-chain event. Anyone can verify what HashMind recommended — confidence score, wallet analyzed, reasoning — from day one to now.
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
                      {['Immutable', 'Verifiable', 'Public'].map(tag => (
                        <span key={tag} style={{ padding: '3px 10px', borderRadius: 4, border: '1px solid rgba(201,168,76,0.18)', fontSize: 11, color: '#C9A84C', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.08em', background: 'rgba(201,168,76,0.04)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Top-right small card — 5 cols */}
                  <div className="bento-card" style={{ gridColumn: '8 / 13', padding: '28px', animation: 'rise 0.6s ease-out 0.1s both' }}>
                    <div style={{ fontSize: 10, color: '#0BBDCA', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.15em', marginBottom: 10, textTransform: 'uppercase' }}>Live · On-Chain</div>
                    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 13, color: '#7B7368', lineHeight: 1.8 }}>
                      {liveStats ? (
                        <>
                          <div>Block <span style={{ color: '#C9A84C' }}>#{Number(liveStats.block_number).toLocaleString()}</span></div>
                          <div>Gas <span style={{ color: '#0BBDCA' }}>{parseFloat(liveStats.gas_price_gwei).toFixed(4)} Gwei</span></div>
                          <div>Status <span style={{ color: '#00E676' }}>● LIVE</span></div>
                          {globalCount && <div>Decisions <span style={{ color: '#1B7A51', fontWeight: 700 }}>{globalCount}</span></div>}
                        </>
                      ) : (
                        <div style={{ color: '#3E3A36' }}>Connecting to HashKey Chain…</div>
                      )}
                    </div>
                  </div>

                  {/* Bottom-left — 5 cols */}
                  <div className="bento-card card-3d" style={{ gridColumn: '1 / 6', padding: '28px', animation: 'rise 0.6s ease-out 0.2s both' }}>
                    <div style={{ fontSize: 10, color: '#0BBDCA', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.15em', marginBottom: 10, textTransform: 'uppercase' }}>Core Feature · 02</div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#E8E2D8', letterSpacing: '-0.02em', marginBottom: 10, fontFamily: '"Space Grotesk",sans-serif' }}>Reputation on Rails</h3>
                    <p style={{ fontSize: 13, color: '#7B7368', lineHeight: 1.72 }}>
                      The agent's accuracy score compounds on-chain. Bad advice hurts its score. Good advice builds trust. Provably.
                    </p>
                    <div style={{ marginTop: 18, height: 4, borderRadius: 3, background: 'rgba(11,189,202,0.10)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '80%', borderRadius: 3, background: 'linear-gradient(90deg, #0BBDCA, #1B7A51)', transition: 'width 1.5s ease' }} />
                    </div>
                    <div style={{ fontSize: 10, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', marginTop: 6 }}>Reputation score: 80/100</div>
                  </div>

                  {/* Bottom-center — 4 cols */}
                  <div className="bento-card card-3d" style={{ gridColumn: '6 / 10', padding: '28px', animation: 'rise 0.6s ease-out 0.3s both' }}>
                    <div style={{ fontSize: 10, color: '#E05A3A', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.15em', marginBottom: 10, textTransform: 'uppercase' }}>Core Feature · 03</div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#E8E2D8', letterSpacing: '-0.02em', marginBottom: 10, fontFamily: '"Space Grotesk",sans-serif' }}>HSP Settlement</h3>
                    <p style={{ fontSize: 13, color: '#7B7368', lineHeight: 1.72 }}>
                      Consensus confirmed → <code style={{ color: '#E05A3A', fontSize: 12 }}>executeWithHSP()</code> fires. Capital moves only after cryptographic proof of agent agreement.
                    </p>
                    <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#E05A3A', boxShadow: '0 0 6px #E05A3A', display: 'inline-block' }} />
                      <span style={{ fontSize: 11, fontFamily: '"JetBrains Mono",monospace', color: '#E05A3A' }}>HSP · HASHKEY SETTLEMENT PROTOCOL</span>
                    </div>
                  </div>

                  {/* Bottom-right — 3 cols */}
                  <div className="bento-card" style={{ gridColumn: '10 / 13', padding: '28px', animation: 'rise 0.6s ease-out 0.4s both' }}>
                    <div style={{ fontSize: 10, color: '#8B5CF6', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.15em', marginBottom: 14, textTransform: 'uppercase' }}>Protocols</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {PROTOCOLS.map(p => (
                        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace' }}>
                          <span style={{ color: '#C9A84C', fontSize: 9 }}>{p.icon}</span>
                          {p.name}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </section>

            {/* ══════ PROTOCOL TICKER ══════════════════════════ */}
            <section style={{
              padding: '40px 0',
              borderTop: '1px solid rgba(201,168,76,0.07)',
              borderBottom: '1px solid rgba(201,168,76,0.07)',
              background: 'rgba(0,0,0,0.25)', overflow: 'hidden',
            }}>
              <div style={{ textAlign: 'center', marginBottom: 26 }}>
                <span className="section-eyebrow">INTEGRATED HASHKEY PROTOCOLS</span>
              </div>
              <div className="ticker-wrap">
                <div className="ticker-track">
                  {[...PROTOCOLS, ...PROTOCOLS].map((p, i) => (
                    <div key={i} className="protocol-pill">
                      <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 12 }}>{p.icon}</span>
                      <span>{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ══════ IDENTITY PREVIEW — Trend 5 ══════════════ */}
            <section style={{ padding: '80px 24px', borderBottom: '1px solid rgba(201,168,76,0.07)' }}>
              <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 48 }}>
                  <div className="section-eyebrow" style={{ marginBottom: 20 }}>SPATIAL ON-CHAIN IDENTITY</div>
                  <h2 style={{ fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', fontWeight: 700, letterSpacing: '-0.025em', fontFamily: '"Space Grotesk",sans-serif', color: '#E8E2D8', marginBottom: 10 }}>
                    Your Wallet Has a <span className="gradient-text-static">Unique Identity</span>
                  </h2>
                  <p style={{ color: '#7B7368', fontSize: 13, maxWidth: 420, margin: '0 auto' }}>
                    Connect your wallet and HashMind generates a personalized profile — colors, archetype, and reputation score — directly from your on-chain history.
                  </p>
                </div>

                {/* Example identity previews — generative cards */}
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {[
                    { seed: '0xA1B2', archetype: 'The Strategist', color1: '#C9A84C', color2: '#1B7A51', score: 84, txs: '47', risk: 'Conservative' },
                    { seed: '0xD4E5', archetype: 'The Explorer',   color1: '#0BBDCA', color2: '#8B5CF6', score: 71, txs: '112', risk: 'Moderate' },
                    { seed: '0xF6A3', archetype: 'The Whale',      color1: '#8B5CF6', color2: '#C9A84C', score: 91, txs: '8',   risk: 'Aggressive' },
                  ].map((id, i) => (
                    <div
                      key={id.seed}
                      className="bento-card card-3d"
                      style={{ width: 220, padding: '24px', textAlign: 'center', animation: `rise 0.6s ease-out ${i * 0.12}s both`, flexShrink: 0 }}
                    >
                      {/* Generative SVG avatar */}
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                        <div style={{ position: 'relative', width: 64, height: 64 }}>
                          <svg width="64" height="64" viewBox="0 0 64 64">
                            <defs>
                              <linearGradient id={`gid-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={id.color1} />
                                <stop offset="100%" stopColor={id.color2} />
                              </linearGradient>
                            </defs>
                            {/* Generative hexagon shape */}
                            <polygon
                              points="32,5 55,18 55,46 32,59 9,46 9,18"
                              fill={`url(#gid-${i})`}
                              opacity="0.88"
                            />
                            {/* Inner detail triangle */}
                            <polygon
                              points={`32,${18 + i*3} ${44-i*2},${40+i} ${20+i*2},${40+i}`}
                              fill="rgba(255,255,255,0.18)"
                            />
                            <circle cx="32" cy="32" r="3.5" fill="rgba(255,255,255,0.65)" />
                          </svg>
                          {/* Score ring */}
                          <svg style={{ position: 'absolute', inset: -8, width: 80, height: 80 }} viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r="35" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                            <circle
                              cx="40" cy="40" r="35"
                              fill="none"
                              stroke={id.color1}
                              strokeWidth="2"
                              strokeDasharray={`${id.score * 2.2} 220`}
                              strokeDashoffset="55"
                              strokeLinecap="round"
                              transform="rotate(-90 40 40)"
                              opacity="0.6"
                            />
                          </svg>
                        </div>
                      </div>

                      <div style={{ fontSize: 10, color: id.color1, fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
                        {id.seed}•••
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#E8E2D8', marginBottom: 4, fontFamily: '"Space Grotesk",sans-serif' }}>
                        {id.archetype}
                      </div>
                      <div style={{ fontSize: 12, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', marginBottom: 12 }}>
                        {id.txs} txs · {id.risk}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: '"JetBrains Mono",monospace' }}>
                        <span style={{ color: '#3E3A36' }}>Reputation</span>
                        <span style={{ color: id.color1, fontWeight: 700 }}>{id.score}/100</span>
                      </div>
                    </div>
                  ))}
                </div>

                <p style={{ textAlign: 'center', marginTop: 28, fontSize: 12, color: '#3E3A36', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.05em' }}>
                  Generative identity derived deterministically from your wallet address · Connect to see yours
                </p>
              </div>
            </section>

          </>
        )}

        {/* Dashboard */}
        {currentView === 'dashboard' && walletAddress && (
          <div style={S}>
            <Dashboard
              walletAddress={walletAddress}
              walletData={walletData}
              recommendations={recommendations}
              isAnalyzing={isAnalyzing}
              onAnalyze={handleAnalyze}
              onAnalysisComplete={handleAnalysisComplete}
            />
          </div>
        )}

        {/* History */}
        {currentView === 'history' && walletAddress && (
          <div style={S}>
            <OnChainLog walletAddress={walletAddress} />
          </div>
        )}

      </main>

      {/* ═══════════════ FOOTER ══════════════════════════════ */}
      <footer style={{ borderTop: '1px solid rgba(201,168,76,0.10)', padding: '28px 24px', background: 'rgba(0,0,0,0.22)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#C9A84C', fontFamily: '"Space Grotesk",sans-serif', marginBottom: 5 }}>HashMind</div>
            <div style={{ fontSize: 11, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.04em' }}>
              Built for{' '}
              <a href="https://dorahacks.io/hackathon/hskchainjapan" target="_blank" rel="noopener noreferrer"
                style={{ color: '#0BBDCA', fontWeight: 600, textDecoration: 'none' }}>
                HashKey Chain Horizon Japan 2026
              </a>
              {' '}· AI (HSP) + DeFi Track
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 12, color: '#7B7368', flexWrap: 'wrap' }}>
            <span>Powered by</span>
            <span style={{ color: '#C9A84C', fontWeight: 600 }}>HashKey Chain</span>
            <span style={{ color: 'rgba(201,168,76,0.20)' }}>·</span>
            <span style={{ color: '#0BBDCA', fontWeight: 600 }}>Groq AI</span>
            <span style={{ color: 'rgba(201,168,76,0.20)' }}>·</span>
            <a href="https://github.com/JMadhan1/hashmind" target="_blank" rel="noopener noreferrer"
              style={{ color: '#C9A84C', textDecoration: 'none', fontWeight: 600 }}>
              GitHub ↗
            </a>
            <span style={{ color: 'rgba(201,168,76,0.20)' }}>·</span>
            <a href="https://hsk.blockscout.com/address/0xCDb15987099FBFC1e61563F39C138dF9635c273B" target="_blank" rel="noopener noreferrer"
              style={{ color: '#0BBDCA', textDecoration: 'none', fontWeight: 600 }}>
              Contract ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
