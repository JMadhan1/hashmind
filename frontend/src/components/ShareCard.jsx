function ShareCard({ recommendation }) {
  const handleShareTwitter = () => {
    const text = encodeURIComponent(
      `Just got my AI DeFi analysis from MantleMind 🤖⛓️\n\n` +
      `Top pick: ${recommendation.action}\n` +
      `Confidence: ${recommendation.confidence}%\n` +
      `Recorded forever on @0xMantle\n\n` +
      `#MantleMind #TuringTest2026 #DeFiAI\n\n` +
      `Try free: ${window.location.origin}`
    )
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
  }

  const handleShareCopy = () => {
    const text =
      `Just got my AI DeFi analysis from MantleMind 🤖⛓️\n\n` +
      `Top pick: ${recommendation.action}\n` +
      `Confidence: ${recommendation.confidence}%\n` +
      `Recorded forever on @0xMantle\n\n` +
      `#MantleMind #TuringTest2026 #DeFiAI\n\n` +
      `Try free: ${window.location.origin}`

    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!')
    }).catch(() => {
      alert('Failed to copy to clipboard')
    })
  }

  return (
    <div className="glass-card p-6 mt-8 animate-fade-in">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent/20 to-accent-secondary/20 flex items-center justify-center">
            <span className="text-2xl">📢</span>
          </div>
          <div>
            <h3 className="font-syne font-semibold text-lg">Share Your Analysis</h3>
            <p className="text-sm text-text-secondary">Help spread the word about MantleMind</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={handleShareTwitter} className="btn-primary flex items-center gap-2">
            <span>𝕏</span>
            Share on X
          </button>
          <button onClick={handleShareCopy} className="btn-secondary flex items-center gap-2">
            <span>📋</span>
            Copy
          </button>
        </div>
      </div>

      <div className="mt-4 p-4 bg-accent/5 rounded-lg border border-accent/10">
        <p className="text-xs text-text-secondary">
          <span className="text-accent">💡</span> Sharing on X helps us win the Community Voting prize! Every share counts.
        </p>
      </div>
    </div>
  )
}

export default ShareCard
