import { useState, useEffect } from 'react'
import axios from 'axios'

function NetworkBadge() {
  const [stats, setStats] = useState(null)
  const [pulse, setPulse] = useState(true)

  useEffect(() => {
    fetchStats()
    const poll    = setInterval(fetchStats, 30000)
    const blinker = setInterval(() => setPulse(p => !p), 1600)
    return () => { clearInterval(poll); clearInterval(blinker) }
  }, [])

  const fetchStats = async () => {
    try {
      const r = await axios.get('/api/mantle/stats')
      setStats(r.data)
    } catch (_) {}
  }

  if (!stats) return null

  return (
    <div
      className="hidden lg:flex items-center"
      style={{
        padding: '5px 14px',
        borderRadius: 8,
        background: 'rgba(201,168,76,0.04)',
        border: '1px solid rgba(201,168,76,0.14)',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 11,
        gap: 10,
      }}
    >
      {/* Live dot */}
      <span style={{
        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
        background: '#00E676',
        boxShadow: pulse
          ? '0 0 5px #00E676, 0 0 10px rgba(0,230,118,0.4)'
          : '0 0 2px #00E676',
        transition: 'box-shadow 0.5s ease',
        display: 'inline-block',
      }} />

      <span style={{ color: '#7B7368' }}>Mantle Sepolia</span>

      <span style={{ color: 'rgba(201,168,76,0.20)', fontWeight: 300 }}>|</span>

      <span style={{ color: '#7B7368' }}>
        Block{' '}
        <span style={{ color: '#C9A84C', fontWeight: 600 }}>
          {Number(stats.block_number).toLocaleString()}
        </span>
      </span>

      <span style={{ color: 'rgba(201,168,76,0.20)', fontWeight: 300 }}>|</span>

      <span style={{ color: '#7B7368' }}>
        Gas{' '}
        <span style={{ color: '#0BBDCA', fontWeight: 600 }}>
          {parseFloat(stats.gas_price_gwei).toFixed(4)}
        </span>
        {' '}Gwei
      </span>

      {stats.total_recommendations > 0 && (
        <>
          <span style={{ color: 'rgba(201,168,76,0.20)', fontWeight: 300 }}>|</span>
          <span style={{ color: '#7B7368' }}>
            <span style={{ color: '#1B7A51', fontWeight: 700 }}>
              {stats.total_recommendations}
            </span>
            {' '}on-chain
          </span>
        </>
      )}
    </div>
  )
}

export default NetworkBadge
