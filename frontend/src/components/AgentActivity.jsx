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
      setActivities(response.data.recent_actions || [])
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
          <div key={index} className="flex items-center gap-2 text-sm text-text-secondary">
            <span className="shrink-0">🤖</span>
            <span>
              AI analyzed wallet{' '}
              <span className="mono text-accent">{activity.wallet}</span>
              {' — '}
              <span className="text-text-secondary/70">{getRelativeTime(activity.timestamp)}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AgentActivity
