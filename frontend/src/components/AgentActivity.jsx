import { useState, useEffect } from 'react'
import axios from 'axios'

function getRelativeTime(timestamp) {
  const seconds = Math.floor(Date.now() / 1000 - timestamp)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`
  return `${Math.floor(seconds / 3600)} hrs ago`
}

function AgentActivity() {
  const [activities, setActivities] = useState([])

  useEffect(() => {
    fetchActivity()
    const interval = setInterval(fetchActivity, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchActivity = async () => {
    try {
      const response = await axios.get('/api/history')
      setActivities(response.data.recent_consensus || [])
    } catch (err) {
      console.error('AgentActivity: failed to fetch', err)
    }
  }

  if (activities.length === 0) return null

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-syne font-semibold text-accent mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block"></span>
        Live Agent Activity
      </h3>
      <div className="space-y-2">
        {activities.slice(0, 5).map((activity, index) => (
          <div key={index} className="flex items-center justify-between gap-2 text-sm text-text-secondary">
            <div className="flex items-center gap-2 min-w-0">
              <span className="shrink-0">🤖</span>
              <span className="truncate">
                <span className="mono text-accent">
                  {activity.wallet ? `${activity.wallet.slice(0, 6)}…${activity.wallet.slice(-4)}` : '—'}
                </span>
                {activity.action && (
                  <span className="text-text-secondary/70 ml-1">· {activity.action.slice(0, 28)}{activity.action?.length > 28 ? '…' : ''}</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {activity.consensus ? (
                <span style={{
                  fontSize: 9, padding: '2px 7px', borderRadius: 100, fontFamily: '"JetBrains Mono",monospace',
                  background: 'rgba(27,122,81,0.12)', border: '1px solid rgba(27,122,81,0.30)', color: '#1B7A51',
                }}>CONSENSUS</span>
              ) : (
                <span style={{
                  fontSize: 9, padding: '2px 7px', borderRadius: 100, fontFamily: '"JetBrains Mono",monospace',
                  background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)', color: '#C9A84C',
                }}>DEFERRED</span>
              )}
              <span className="text-text-secondary/50 text-xs">{getRelativeTime(activity.timestamp)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AgentActivity
