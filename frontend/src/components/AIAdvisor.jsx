import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const QUICK_QUESTIONS = [
  { label: 'Am I losing to IL?',       q: 'How does impermanent loss work in veHSK LPs and when should I be worried?' },
  { label: 'Liquidation risk?',         q: 'What health factor should I maintain on WoofSwap to avoid liquidation?' },
  { label: 'stHSK vs native staking?',  q: 'Which is better right now — staking HSK natively or using stHSK liquid staking?' },
  { label: 'veHSK worth it?',           q: 'Is locking HSK for veHSK worth it? What boosts and governance power do I get?' },
  { label: 'Best yields now?',          q: 'What are the best yield opportunities on HashKey Chain right now with the lowest risk?' },
  { label: 'When to rebalance?',        q: 'My HSK has pumped a lot. Should I take profits or add more to a WoofSwap liquidity pool?' },
  { label: 'Bridge to HashKey Chain?',         q: 'What is the cheapest and fastest way to bridge assets to HashKey Chain?' },
  { label: 'New to HashKey Chain DeFi?',       q: 'I just got 100 HSK. What should I do first to start earning safely on HashKey Chain?' },
  { label: 'Gas cheapest when?',        q: 'When is gas cheapest on HashKey Chain and how do I optimize my transaction costs?' },
  { label: 'Track DeFi taxes?',         q: 'How do I track my DeFi activity on HashKey Chain for tax purposes?' },
]

function AIAdvisor({ walletAddress }) {
  const [input, setInput]     = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: "Hey! I'm your HashMind AI advisor. Ask me anything about HashKey Chain DeFi — impermanent loss, liquidation risk, yield comparison, veHSK, stHSK, WoofSwap, or just what to do with your HSK. Try a quick question below ↓",
    }
  ])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendQuestion = async (q) => {
    const question = q || input.trim()
    if (!question || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: question }])
    setLoading(true)
    const attempt = async (isRetry) => {
      try {
        const { data } = await axios.post('/api/ask', {
          question,
          wallet_address: walletAddress || null,
        }, { timeout: 35000 })
        setMessages(prev => [...prev, { role: 'ai', text: data.answer }])
      } catch {
        if (!isRetry) {
          setMessages(prev => [...prev, { role: 'ai', text: '⏳ Backend is waking up — retrying in 8s…', error: true }])
          setTimeout(async () => {
            setMessages(prev => {
              const copy = [...prev]
              copy[copy.length - 1] = { role: 'ai', text: '↻ Retrying…', error: true }
              return copy
            })
            await attempt(true)
          }, 8000)
          return
        }
        setMessages(prev => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'ai', text: 'Backend is still waking up. Please try again in ~30s.', error: true }
          return copy
        })
      } finally {
        if (isRetry) setLoading(false)
      }
    }
    await attempt(false)
    setLoading(false)
  }

  const handleSubmit = (e) => { e.preventDefault(); sendQuestion() }

  return (
    <div className="bento-card" style={{ padding: 0, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        padding: '16px 22px 14px',
        borderBottom: '1px solid rgba(201,168,76,0.10)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', background: '#1B7A51',
          boxShadow: '0 0 6px #1B7A51', flexShrink: 0,
        }} />
        <span style={{ fontSize: 9, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.20em', textTransform: 'uppercase' }}>
          AI Advisor · HashKey Chain DeFi Expert
        </span>
        {walletAddress && (
          <span style={{ marginLeft: 'auto', fontSize: 9, color: '#1B7A51', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.1em' }}>
            ● wallet context active
          </span>
        )}
      </div>

      {/* Chat window */}
      <div style={{ padding: '16px 20px', maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: msg.role === 'user'
                ? 'rgba(201,168,76,0.12)'
                : msg.error ? 'rgba(217,83,79,0.08)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${msg.role === 'user' ? 'rgba(201,168,76,0.22)' : msg.error ? 'rgba(217,83,79,0.20)' : 'rgba(255,255,255,0.07)'}`,
              fontSize: 13,
              color: msg.role === 'user' ? '#C9A84C' : msg.error ? '#D9534F' : '#C8C2B8',
              fontFamily: msg.role === 'user' ? '"Space Grotesk",sans-serif' : '"Space Grotesk",sans-serif',
              lineHeight: 1.65,
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '10px 16px', borderRadius: '12px 12px 12px 2px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', gap: 5, alignItems: 'center',
            }}>
              {[0,1,2].map(i => (
                <span key={i} style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#C9A84C', opacity: 0.7,
                  animation: `pulse-glow 1.2s ease-in-out ${i * 0.2}s infinite`,
                  display: 'inline-block',
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick questions */}
      <div style={{ padding: '0 20px 14px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {QUICK_QUESTIONS.slice(0, 5).map((q, i) => (
          <button key={i} onClick={() => sendQuestion(q.q)} disabled={loading}
            style={{
              fontSize: 9, padding: '4px 10px', borderRadius: 100, cursor: 'pointer',
              background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.18)',
              color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.08em',
              transition: 'all 0.2s', outline: 'none',
            }}
            onMouseOver={e => { e.target.style.borderColor = 'rgba(201,168,76,0.45)'; e.target.style.color = '#C9A84C' }}
            onMouseOut={e => { e.target.style.borderColor = 'rgba(201,168,76,0.18)'; e.target.style.color = '#7B7368' }}
          >{q.label}</button>
        ))}
        {QUICK_QUESTIONS.slice(5).map((q, i) => (
          <button key={i+5} onClick={() => sendQuestion(q.q)} disabled={loading}
            style={{
              fontSize: 9, padding: '4px 10px', borderRadius: 100, cursor: 'pointer',
              background: 'rgba(11,189,202,0.05)', border: '1px solid rgba(11,189,202,0.15)',
              color: '#7B7368', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.08em',
              transition: 'all 0.2s', outline: 'none',
            }}
            onMouseOver={e => { e.target.style.borderColor = 'rgba(11,189,202,0.40)'; e.target.style.color = '#0BBDCA' }}
            onMouseOut={e => { e.target.style.borderColor = 'rgba(11,189,202,0.15)'; e.target.style.color = '#7B7368' }}
          >{q.label}</button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{
        padding: '12px 16px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask anything about HashKey Chain DeFi…"
          disabled={loading}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, padding: '10px 14px', color: '#E8E2D8', fontSize: 13,
            fontFamily: '"Space Grotesk",sans-serif', outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.40)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
        />
        <button type="submit" disabled={loading || !input.trim()} className="btn-primary"
          style={{ padding: '10px 18px', fontSize: 12, flexShrink: 0 }}>
          {loading ? <div className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> : 'Ask →'}
        </button>
      </form>
    </div>
  )
}

export default AIAdvisor
