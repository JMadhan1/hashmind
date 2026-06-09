import { useState } from 'react'
import axios from 'axios'

/* ═══════════════════════════════════════════════════════
   GAS DISCLOSURE WIZARD — Trend 4
   States: idle → reviewing → signing → done
═══════════════════════════════════════════════════════ */
const STEPS = [
  { id: 'review',   label: 'Review'   },
  { id: 'estimate', label: 'Estimate' },
  { id: 'sign',     label: 'Sign'     },
  { id: 'done',     label: 'Done'     },
]

function WizardStep({ step, active, done }) {
  const color = done ? '#1B7A51' : active ? '#C9A84C' : 'rgba(255,255,255,0.12)'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `2px solid ${color}`,
        background: done ? 'rgba(27,122,81,0.14)' : active ? 'rgba(201,168,76,0.12)' : 'transparent',
        transition: 'all 0.3s',
        fontSize: 10, color, fontFamily: '"JetBrains Mono",monospace', fontWeight: 700,
      }}>
        {done ? '✓' : step.id === 'review' ? '1' : step.id === 'estimate' ? '2' : step.id === 'sign' ? '3' : '4'}
      </div>
      <span style={{ fontSize: 9, color: done || active ? color : '#3E3A36', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {step.label}
      </span>
    </div>
  )
}

function WizardConnector({ done }) {
  return (
    <div style={{
      flex: 1, height: 2, marginBottom: 20,
      background: done ? '#1B7A51' : 'rgba(255,255,255,0.07)',
      transition: 'background 0.4s',
    }} />
  )
}

function GasDisclosureWizard({ recommendation, onConfirm, onCancel }) {
  const [step, setStep] = useState(0) // 0=review, 1=estimate, 2=sign, 3=done
  const [gasData, setGasData] = useState(null)
  const [estimating, setEstimating] = useState(false)

  const GAS_UNITS = 65000

  const fetchGas = async () => {
    setEstimating(true)
    try {
      const r = await axios.get('/api/mantle/stats')
      setGasData({
        priceGwei: parseFloat(r.data.gas_price_gwei || 0.02),
        blockNumber: r.data.block_number,
      })
    } catch {
      setGasData({ priceGwei: 0.02, blockNumber: 'unknown' })
    } finally {
      setEstimating(false)
      setStep(1)
    }
  }

  const gasFeeEth = gasData ? ((GAS_UNITS * gasData.priceGwei) / 1e9).toFixed(8) : '—'
  const gasFeeUsd = gasData ? ((GAS_UNITS * gasData.priceGwei / 1e9) * 3200).toFixed(4) : '—'

  return (
    <div className="tx-disclosure-box" style={{ marginTop: 12, animation: 'rise 0.35s ease-out both' }}>

      {/* Step indicators */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, marginBottom: 16 }}>
        {STEPS.map((s, i) => (
          <>
            <WizardStep key={s.id} step={s} active={step === i} done={step > i} />
            {i < STEPS.length - 1 && <WizardConnector key={`c${i}`} done={step > i} />}
          </>
        ))}
      </div>

      {/* Step 0: Review */}
      {step === 0 && (
        <div>
          <div style={{ fontSize: 11, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', marginBottom: 10, lineHeight: 1.7 }}>
            <div><span style={{ color: '#C9A84C' }}>Action:</span> {recommendation.action}</div>
            <div><span style={{ color: '#C9A84C' }}>Protocol:</span> {recommendation.specific_protocol}</div>
            <div><span style={{ color: '#C9A84C' }}>Risk:</span> {recommendation.risk_level?.toUpperCase()}</div>
            <div style={{ marginTop: 8, color: '#4A4540', fontSize: 10, lineHeight: 1.6 }}>
              This will write a recommendation hash to <span style={{ color: '#7B7368' }}>MantleMind.sol</span> on Mantle Sepolia.
              No funds will be moved — only metadata is stored.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={fetchGas}
              className="btn-primary"
              style={{ fontSize: 12, padding: '7px 14px', flex: 1, justifyContent: 'center' }}
              disabled={estimating}
            >
              {estimating ? <><div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />Fetching gas…</> : 'Estimate Gas →'}
            </button>
            <button onClick={onCancel} className="btn-ghost" style={{ fontSize: 12, padding: '7px 14px' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Step 1: Gas estimate */}
      {step === 1 && (
        <div>
          <div style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.14)', borderRadius: 8, padding: '12px 14px', marginBottom: 12 }}>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, lineHeight: 2.0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#7B7368' }}>Gas limit</span>
                <span style={{ color: '#E8E2D8' }}>{GAS_UNITS.toLocaleString()} units</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#7B7368' }}>Gas price</span>
                <span style={{ color: '#0BBDCA' }}>{gasData?.priceGwei?.toFixed(4)} Gwei</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(201,168,76,0.10)', paddingTop: 8, marginTop: 4 }}>
                <span style={{ color: '#7B7368' }}>Est. fee (ETH)</span>
                <span style={{ color: '#C9A84C', fontWeight: 700 }}>{gasFeeEth} ETH</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#7B7368' }}>Est. fee (USD)</span>
                <span style={{ color: '#C9A84C' }}>≈ ${gasFeeUsd}</span>
              </div>
            </div>
          </div>
          <div style={{ fontSize: 10, color: '#4A4540', fontFamily: '"JetBrains Mono",monospace', marginBottom: 12, lineHeight: 1.65 }}>
            Contract: MantleMind.sol · Network: Mantle Sepolia (5003)<br/>
            Block: {gasData?.blockNumber?.toLocaleString?.() ?? gasData?.blockNumber}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setStep(2)} className="btn-primary" style={{ fontSize: 12, padding: '7px 14px', flex: 1, justifyContent: 'center' }}>
              Proceed to Sign →
            </button>
            <button onClick={() => setStep(0)} className="btn-ghost" style={{ fontSize: 12, padding: '7px 14px' }}>Back</button>
          </div>
        </div>
      )}

      {/* Step 2: Sign confirmation */}
      {step === 2 && (
        <div>
          <div style={{ fontSize: 11, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', marginBottom: 12, lineHeight: 1.7 }}>
            <div style={{ color: '#E8E2D8', fontWeight: 600, marginBottom: 8, fontSize: 12 }}>You are about to sign:</div>
            <div style={{ background: 'rgba(11,189,202,0.04)', border: '1px solid rgba(11,189,202,0.12)', borderRadius: 6, padding: '10px 12px', color: '#E8E2D8', fontSize: 10, lineHeight: 1.8 }}>
              <div><span style={{ color: '#0BBDCA' }}>function</span> <span style={{ color: '#C9A84C' }}>logRecommendation</span>(</div>
              <div style={{ paddingLeft: 16 }}>action: <span style={{ color: '#1B7A51' }}>"{recommendation.action.slice(0, 30)}{recommendation.action.length > 30 ? '…' : ''}"</span>,</div>
              <div style={{ paddingLeft: 16 }}>confidence: <span style={{ color: '#C9A84C' }}>{recommendation.confidence}</span></div>
              <div>)</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onConfirm} className="btn-primary" style={{ fontSize: 12, padding: '7px 14px', flex: 1, justifyContent: 'center' }}>
              Sign & Log to Mantle
            </button>
            <button onClick={() => setStep(1)} className="btn-ghost" style={{ fontSize: 12, padding: '7px 14px' }}>Back</button>
          </div>
        </div>
      )}

    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   RECOMMENDATION CARD
═══════════════════════════════════════════════════════ */
function RecommendationCard({ recommendation }) {
  const [wizardOpen, setWizardOpen] = useState(false)
  const [isLogging, setIsLogging] = useState(false)
  const [txHash, setTxHash] = useState(null)
  const [logFailed, setLogFailed] = useState(false)

  const handleLogOnChain = async () => {
    setWizardOpen(false)
    setIsLogging(true)
    setLogFailed(false)
    try {
      const r = await axios.post('/api/log-onchain', {
        recommendation: recommendation.action,
        reasoning: recommendation.reasoning,
        confidence: recommendation.confidence,
      })
      setTxHash(r.data.tx_hash)
    } catch {
      setLogFailed(true)
    } finally {
      setIsLogging(false)
    }
  }

  const conf = recommendation.confidence
  const isHigh = conf >= 70
  const isMed  = conf >= 50

  const borderColor = isHigh ? 'rgba(27,122,81,0.30)' : isMed ? 'rgba(201,168,76,0.25)' : 'rgba(217,83,79,0.22)'
  const confColor   = isHigh ? '#1B7A51' : isMed ? '#C9A84C' : '#D9534F'
  const confFill    = isHigh ? 'confidence-high' : isMed ? 'confidence-medium' : 'confidence-low'

  const PROTOCOL_ICONS = {
    'Merchant Moe': '◈',
    'Agni Finance':  '◉',
    'Fluxion':       '◎',
    'mETH':          '◆',
    'Mantle Ecosystem': '○',
  }
  const icon = PROTOCOL_ICONS[recommendation.specific_protocol] || '●'

  return (
    <div
      className="bento-card card-3d"
      style={{
        padding: '20px 22px',
        display: 'flex', flexDirection: 'column', height: '100%',
        borderTop: `2px solid ${borderColor}`,
      }}
    >
      {/* Protocol header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.14)',
          fontSize: 18, color: '#C9A84C', flexShrink: 0, fontFamily: '"JetBrains Mono",monospace',
        }}>
          {icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 9, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 3 }}>Protocol</div>
          <div style={{ fontWeight: 600, color: '#C9A84C', fontSize: 13, fontFamily: '"Space Grotesk",sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {recommendation.specific_protocol}
          </div>
        </div>
        {recommendation.estimated_apy && (
          <div style={{ marginLeft: 'auto', flexShrink: 0, textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 3 }}>Est. APY</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#0BBDCA', fontFamily: '"JetBrains Mono",monospace' }}>{recommendation.estimated_apy}</div>
          </div>
        )}
      </div>

      {/* Action */}
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#E8E2D8', marginBottom: 8, lineHeight: 1.35, fontFamily: '"Space Grotesk",sans-serif', letterSpacing: '-0.01em' }}>
        {recommendation.action}
      </h3>

      {/* Reasoning */}
      <p style={{ color: '#7B7368', fontSize: 12, marginBottom: 16, flexGrow: 1, lineHeight: 1.7 }}>
        {recommendation.reasoning}
      </p>

      {/* Confidence bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 9, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Confidence</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: confColor, fontFamily: '"JetBrains Mono",monospace' }}>{conf}%</span>
        </div>
        <div className="confidence-bar">
          <div className={`confidence-fill ${confFill}`} style={{ width: `${conf}%` }} />
        </div>
      </div>

      {/* Risk badge + auto-exec */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span className={recommendation.risk_level === 'low' ? 'risk-low' : recommendation.risk_level === 'high' ? 'risk-high' : 'risk-medium'}>
          {recommendation.risk_level?.toUpperCase()} RISK
        </span>
        {conf >= 75 && (
          <span style={{
            fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 100,
            background: 'rgba(11,189,202,0.08)', color: '#0BBDCA', border: '1px solid rgba(11,189,202,0.20)',
            fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.08em',
          }}>
            AUTO-EXEC ELIGIBLE
          </span>
        )}
      </div>

      {/* Gas disclosure wizard (Trend 4) */}
      {wizardOpen && !txHash && !isLogging && (
        <GasDisclosureWizard
          recommendation={recommendation}
          onConfirm={handleLogOnChain}
          onCancel={() => setWizardOpen(false)}
        />
      )}

      {/* Action button states */}
      {txHash ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: 'rgba(27,122,81,0.10)', border: '1px solid rgba(27,122,81,0.28)', color: '#1B7A51',
          }}>
            ✓ Logged on Mantle
          </div>
          <a
            href={`https://explorer.sepolia.mantle.xyz/tx/${txHash}`}
            target="_blank" rel="noopener noreferrer"
            style={{ textAlign: 'center', fontSize: 10, color: '#C9A84C', textDecoration: 'none', fontFamily: '"JetBrains Mono",monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {txHash.slice(0, 18)}…{txHash.slice(-6)} ↗
          </a>
        </div>
      ) : logFailed ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: 'rgba(217,83,79,0.08)', border: '1px solid rgba(217,83,79,0.25)', color: '#D9534F',
          }}>
            ✕ Log failed — retry
          </div>
          <button onClick={() => { setLogFailed(false); setWizardOpen(true) }} className="btn-ghost" style={{ fontSize: 12 }}>
            Retry
          </button>
        </div>
      ) : isLogging ? (
        <button className="btn-primary" disabled style={{ fontSize: 13, justifyContent: 'center' }}>
          <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
          Signing…
        </button>
      ) : !wizardOpen ? (
        <button onClick={() => setWizardOpen(true)} className="btn-primary" style={{ fontSize: 13, justifyContent: 'center' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          Log to Mantle
        </button>
      ) : null}

    </div>
  )
}

export default RecommendationCard
