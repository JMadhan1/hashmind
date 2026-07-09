import { useState, useRef, useEffect, useCallback } from 'react'
import axios from 'axios'

const API_BASE = 'https://hashmind.onrender.com'

const QUICK_QUESTIONS = [
  { label: 'Am I losing to IL?',       q: 'How does impermanent loss work in veHSK LPs and when should I be worried?' },
  { label: 'Liquidation risk?',        q: 'What health factor should I maintain on WoofSwap to avoid liquidation?' },
  { label: 'stHSK vs native staking?', q: 'Which is better right now — staking HSK natively or using stHSK liquid staking?' },
  { label: 'veHSK worth it?',          q: 'Is locking HSK for veHSK worth it? What boosts and governance power do I get?' },
  { label: 'Best yields now?',         q: 'What are the best yield opportunities on HashKey Chain right now with the lowest risk?' },
  { label: 'When to rebalance?',       q: 'My HSK has pumped a lot. Should I take profits or add more to a WoofSwap liquidity pool?' },
  { label: 'Bridge to HashKey Chain?', q: 'What is the cheapest and fastest way to bridge assets to HashKey Chain?' },
  { label: 'New to DeFi?',             q: 'I just got 100 HSK. What should I do first to start earning safely on HashKey Chain?' },
  { label: 'Gas cheapest when?',       q: 'When is gas cheapest on HashKey Chain and how do I optimize my transaction costs?' },
  { label: 'Track DeFi taxes?',        q: 'How do I track my DeFi activity on HashKey Chain for tax purposes?' },
]

const SUGGESTED_CHIPS = QUICK_QUESTIONS.slice(0, 5)

const styles = {
  container: {
    padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column',
    height: 520,
  },
  header: {
    padding: '14px 20px', borderBottom: '1px solid rgba(201,168,76,0.10)',
    display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
  },
  statusDot: (online) => ({
    width: 8, height: 8, borderRadius: '50%',
    background: online ? '#1B7A51' : '#7B7368',
    boxShadow: online ? '0 0 8px #1B7A51' : 'none',
    flexShrink: 0, transition: 'all 0.3s',
  }),
  headerLabel: {
    fontSize: 9, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace',
    letterSpacing: '0.20em', textTransform: 'uppercase',
  },
  walletBadge: {
    marginLeft: 'auto', fontSize: 9, color: '#1B7A51',
    fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.1em',
  },
  messagesArea: {
    flex: 1, overflowY: 'auto', padding: '16px 20px',
    display: 'flex', flexDirection: 'column', gap: 14,
    scrollBehavior: 'smooth',
  },
  msgRow: (isUser) => ({
    display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
    animation: 'fadeInUp 0.3s ease-out',
  }),
  msgBubble: (isUser, isError) => ({
    maxWidth: '82%', padding: '11px 15px',
    borderRadius: isUser ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
    background: isUser
      ? 'linear-gradient(135deg, rgba(201,168,76,0.14), rgba(201,168,76,0.08))'
      : isError ? 'rgba(217,83,79,0.08)' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${
      isUser ? 'rgba(201,168,76,0.25)'
      : isError ? 'rgba(217,83,79,0.22)'
      : 'rgba(255,255,255,0.08)'
    }`,
    fontSize: 13, lineHeight: 1.65,
    color: isUser ? '#E8C876' : isError ? '#D9534F' : '#D0CCC4',
    fontFamily: '"Space Grotesk",sans-serif',
    backdropFilter: 'blur(8px)',
    wordBreak: 'break-word',
  }),
  providerTag: {
    display: 'inline-block', marginTop: 6, fontSize: 8,
    color: '#7B7368', fontFamily: '"JetBrains Mono",monospace',
    letterSpacing: '0.12em', textTransform: 'uppercase',
    padding: '1px 6px', borderRadius: 4,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
  },
  retryBtn: {
    marginTop: 8, fontSize: 10, padding: '4px 12px', borderRadius: 6,
    background: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.30)',
    color: '#C9A84C', cursor: 'pointer', fontFamily: '"JetBrains Mono",monospace',
    letterSpacing: '0.08em', transition: 'all 0.2s',
  },
  typingIndicator: {
    display: 'flex', justifyContent: 'flex-start',
  },
  typingBubble: {
    padding: '12px 18px', borderRadius: '14px 14px 14px 3px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex', gap: 6, alignItems: 'center', flexDirection: 'column',
  },
  typingDots: {
    display: 'flex', gap: 5, alignItems: 'center',
  },
  typingDot: (i) => ({
    width: 6, height: 6, borderRadius: '50%',
    background: '#C9A84C', opacity: 0.6,
    animation: `pulse-glow 1.2s ease-in-out ${i * 0.2}s infinite`,
    display: 'inline-block',
  }),
  typingLabel: {
    fontSize: 9, color: '#7B7368', fontFamily: '"JetBrains Mono",monospace',
    letterSpacing: '0.1em', marginTop: 4,
  },
  chipsRow: {
    padding: '8px 20px 10px', display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0,
  },
  chip: (color, hover) => ({
    fontSize: 9, padding: '4px 10px', borderRadius: 100, cursor: 'pointer',
    background: hover ? `${color}15` : `${color}08`,
    border: `1px solid ${hover ? `${color}50` : `${color}25`}`,
    color: hover ? color : '#7B7368',
    fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.08em',
    transition: 'all 0.2s', outline: 'none',
  }),
  inputRow: {
    padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0,
  },
  input: (focused) => ({
    flex: 1, background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${focused ? 'rgba(201,168,76,0.40)' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 10, padding: '11px 15px', color: '#E8E2D8', fontSize: 13,
    fontFamily: '"Space Grotesk",sans-serif', outline: 'none',
    transition: 'border-color 0.2s',
  }),
  sendBtn: (disabled) => ({
    padding: '11px 20px', fontSize: 12, flexShrink: 0, borderRadius: 10,
    background: disabled ? 'rgba(201,168,76,0.08)' : 'linear-gradient(135deg, #A8832A, #E0C06A)',
    border: 'none', color: disabled ? '#7B7368' : '#07080C',
    fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: '"Space Grotesk",sans-serif', transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', gap: 6,
  }),
  clearBtn: {
    marginLeft: 'auto', fontSize: 9, color: '#7B7368', cursor: 'pointer',
    background: 'none', border: 'none', fontFamily: '"JetBrains Mono",monospace',
    letterSpacing: '0.1em', padding: '2px 8px', transition: 'color 0.2s',
  },
}

function ChatPanel({ walletAddress }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const [hoveredChip, setHoveredChip] = useState(null)
  const [backendOnline, setBackendOnline] = useState(null)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const retryCount = useRef(0)

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    })
  }, [])

  useEffect(() => {
    // Check backend health on mount
    axios.get(`${API_BASE}/health`, { timeout: 10000 })
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false))

    // Welcome message
    setMessages([{
      id: Date.now(),
      role: 'ai',
      text: "Hey! I'm HashMind AI — your DeFi advisor for HashKey Chain. Ask me about staking, yields, risk, or anything DeFi. Pick a quick question below or type your own.",
    }])
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, loading, scrollToBottom])

  const sendMessage = async (question, retryOrigIdx = null) => {
    if (!question?.trim() || loading) return
    retryCount.current = 0
    setInput('')
    setLoading(true)

    // Remove the error message if this is a retry
    if (retryOrigIdx !== null) {
      setMessages(prev => prev.filter((_, i) => i !== retryOrigIdx))
    }

    // Add user message
    const userMsg = { id: Date.now(), role: 'user', text: question }
    setMessages(prev => [...prev, userMsg])

    const attempt = async (isRetry) => {
      try {
        const { data } = await axios.post(`${API_BASE}/ask`, {
          question,
          wallet_address: walletAddress || null,
        }, { timeout: 60000 })

        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'ai',
          text: data.answer || 'No response received.',
          provider: data.provider || null,
        }])
        setBackendOnline(true)
      } catch (err) {
        if (!isRetry && retryCount.current < 2) {
          retryCount.current++
          // Show waiting message
          setMessages(prev => [...prev, {
            id: Date.now() + 2,
            role: 'ai',
            text: `Warming up backend (attempt ${retryCount.current}/2)…`,
            waiting: true,
          }])
          await new Promise(r => setTimeout(r, 5000))
          // Remove waiting message
          setMessages(prev => prev.filter(m => !m.waiting))
          await attempt(true)
          return
        }
        // Final failure — show error with retry button
        setMessages(prev => [...prev, {
          id: Date.now() + 3,
          role: 'ai',
          text: 'Unable to reach the AI backend after multiple attempts.',
          error: true,
          retryQuestion: question,
        }])
        setBackendOnline(false)
      } finally {
        setLoading(false)
      }
    }

    await attempt(false)
  }

  const handleSubmit = (e) => {
    e?.preventDefault()
    sendMessage(input)
  }

  const handleRetry = (msg) => {
    if (msg.retryQuestion) sendMessage(msg.retryQuestion)
  }

  const clearChat = () => {
    setMessages([{
      id: Date.now(),
      role: 'ai',
      text: "Cleared. What would you like to know about HashKey Chain DeFi?",
    }])
  }

  return (
    <div className="bento-card" style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.statusDot(backendOnline)} />
        <span style={styles.headerLabel}>
          AI Advisor · HashKey Chain DeFi Expert
        </span>
        {walletAddress && (
          <span style={styles.walletBadge}>● wallet context active</span>
        )}
        {messages.length > 1 && (
          <button style={styles.clearBtn} onClick={clearChat}>CLEAR</button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={styles.messagesArea}>
        {messages.map((msg) => (
          <div key={msg.id} style={styles.msgRow(msg.role === 'user')}>
            <div style={styles.msgBubble(msg.role === 'user', msg.error)}>
              {msg.text}
              {msg.provider && (
                <div style={styles.providerTag}>
                  ⚡ {msg.provider}
                </div>
              )}
              {msg.error && msg.retryQuestion && (
                <button style={styles.retryBtn} onClick={() => handleRetry(msg)}>
                  ↻ Retry
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={styles.typingIndicator}>
            <div style={styles.typingBubble}>
              <div style={styles.typingDots}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={styles.typingDot(i)} />
                ))}
              </div>
              <span style={styles.typingLabel}>
                {backendOnline === false ? 'Reconnecting…' : 'Venice AI thinking…'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick question chips */}
      <div style={styles.chipsRow}>
        {SUGGESTED_CHIPS.map((q, i) => (
          <button
            key={i}
            onClick={() => sendMessage(q.q)}
            disabled={loading}
            style={styles.chip(
              i < 3 ? '#C9A84C' : '#0BBDCA',
              hoveredChip === i
            )}
            onMouseEnter={() => setHoveredChip(i)}
            onMouseLeave={() => setHoveredChip(null)}
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={styles.inputRow}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask anything about HashKey Chain DeFi…"
          disabled={loading}
          style={styles.input(focused)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={styles.sendBtn(loading || !input.trim())}
        >
          {loading ? (
            <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
          ) : (
            <>Send →</>
          )}
        </button>
      </form>
    </div>
  )
}

export default ChatPanel
