import { useState, useEffect } from 'react'
import axios from 'axios'

function OnChainLog({ walletAddress }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchHistory()
  }, [walletAddress])

  const fetchHistory = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.get('/api/history')
      setHistory(response.data.recent_consensus || [])
    } catch (err) {
      console.error('Error fetching history:', err)
      setError('Failed to fetch consensus log')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const truncateWallet = (addr) =>
    addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '—'

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="spinner mb-6"></div>
        <p className="text-text-secondary">Loading consensus log...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-syne font-bold text-red-400 mb-2">Error Loading Consensus Log</h2>
        <p className="text-text-secondary mb-6">{error}</p>
        <button onClick={fetchHistory} className="btn-primary">
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold font-syne text-accent">
          Consensus Log
        </h2>
        <button onClick={fetchHistory} className="btn-secondary">
          <span className="flex items-center gap-2">
            <span>🔄</span>
            Refresh
          </span>
        </button>
      </div>

      {history.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-6xl mb-4">📜</div>
          <h3 className="text-xl font-syne font-semibold mb-2">No Consensus Records Yet</h3>
          <p className="text-text-secondary mb-6">
            Run a consensus analysis to log agent votes on HashKey Chain.
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-accent/20">
                  <th className="text-left p-4 text-text-secondary text-sm font-medium">Time</th>
                  <th className="text-left p-4 text-text-secondary text-sm font-medium">Wallet</th>
                  <th className="text-left p-4 text-text-secondary text-sm font-medium">Action</th>
                  <th className="text-left p-4 text-text-secondary text-sm font-medium">Consensus</th>
                </tr>
              </thead>
              <tbody>
                {history.map((rec, index) => (
                  <tr
                    key={index}
                    className="border-b border-accent/10 hover:bg-accent/5 transition-colors"
                  >
                    <td className="p-4 text-sm mono text-text-secondary">
                      {formatDate(rec.timestamp)}
                    </td>
                    <td className="p-4 mono text-xs text-text-secondary">
                      <a
                        href={`https://hsk.blockscout.com/address/${rec.wallet}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ color: '#C9A84C', textDecoration: 'none' }}
                      >
                        {truncateWallet(rec.wallet)}
                      </a>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-text-primary">{rec.action}</p>
                    </td>
                    <td className="p-4">
                      {rec.consensus ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                          CONSENSUS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                          DEFERRED
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 glass-card p-4">
        <p className="text-text-secondary text-sm">
          <span className="text-accent">ℹ️</span> All consensus votes are permanently recorded on <a href="https://hsk.blockscout.com" target="_blank" rel="noopener noreferrer" style={{ color: '#C9A84C' }}>hsk.blockscout.com</a> and can be verified by anyone.
        </p>
      </div>
    </div>
  )
}

export default OnChainLog
