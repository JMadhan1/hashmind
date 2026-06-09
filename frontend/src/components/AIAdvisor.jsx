import { useState } from 'react'
import axios from 'axios'

function AIAdvisor({ walletAddress }) {
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleAsk = async (e) => {
    e.preventDefault()
    if (!question.trim() || !walletAddress) return

    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const result = await axios.post('/api/advise', {
        wallet_address: walletAddress,
        context: question
      })

      setResponse(result.data)
    } catch (err) {
      console.error('Error asking AI:', err)
      setError('Failed to get AI response. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-xl font-bold font-syne mb-4 text-accent">Ask AI Advisor</h3>
      
      <form onSubmit={handleAsk} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a DeFi question about your wallet..."
            className="flex-1 px-4 py-3 rounded-lg bg-background/50 border border-accent/30 text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent transition-colors"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="btn-primary px-6"
          >
            {loading ? (
              <div className="spinner w-4 h-4 border-2"></div>
            ) : (
              'Ask'
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      {response && response.recommendations && (
        <div className="space-y-4">
          <p className="text-text-secondary text-sm">Here are personalized recommendations:</p>
          {response.recommendations.map((rec, index) => (
            <div key={index} className="p-4 rounded-lg bg-accent/5 border border-accent/10">
              <p className="font-semibold text-text-primary mb-2">{rec.action}</p>
              <p className="text-sm text-text-secondary mb-2">{rec.reasoning}</p>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-accent">Confidence: {rec.confidence}%</span>
                <span className="text-accent-secondary">Protocol: {rec.specific_protocol}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AIAdvisor
