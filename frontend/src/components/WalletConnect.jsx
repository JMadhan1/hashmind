import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

const HASHKEY_CHAIN_ID  = '0xb1'
const HASHKEY_CHAIN_NUM = 177
const HASHKEY_NETWORK = {
  chainId: HASHKEY_CHAIN_ID,
  chainName: 'HashKey Chain Mainnet',
  nativeCurrency: { name: 'HSK', symbol: 'HSK', decimals: 18 },
  rpcUrls: ['https://mainnet.hsk.xyz'],
  blockExplorerUrls: ['https://hsk.blockscout.com'],
}

/**
 * EIP-6963: Discover all injected wallet providers and return MetaMask's.
 * This is the modern standard (MetaMask v11+, Phantom, Coinbase all support it).
 * Falls back to legacy window.ethereum if EIP-6963 yields nothing.
 */
async function resolveMetaMaskProvider() {
  // ── EIP-6963 (most reliable) ──────────────────────────────────────────────
  if (typeof window !== 'undefined') {
    const discovered = await new Promise((resolve) => {
      const list = []
      const handler = (e) => list.push(e.detail)
      window.addEventListener('eip6963:announceProvider', handler)
      window.dispatchEvent(new Event('eip6963:requestProvider'))
      // Wallets respond synchronously or within one tick
      setTimeout(() => {
        window.removeEventListener('eip6963:announceProvider', handler)
        resolve(list)
      }, 150)
    })

    const mmEntry = discovered.find(
      (d) => d.info?.rdns === 'io.metamask' || d.info?.name?.toLowerCase().includes('metamask')
    )
    if (mmEntry?.provider) return mmEntry.provider
  }

  // ── Legacy fallback: window.ethereum.providers array ─────────────────────
  if (!window.ethereum) return null

  if (Array.isArray(window.ethereum.providers) && window.ethereum.providers.length > 0) {
    const mm = window.ethereum.providers.find(
      (p) => p.isMetaMask === true && p.isPhantom !== true && p.isCoinbaseWallet !== true
    )
    if (mm) {
      // Activate it if the MetaMask API supports it
      window.ethereum.setSelectedProvider?.(mm)
      return mm
    }
    return null
  }

  // ── Legacy fallback: single injected wallet ───────────────────────────────
  if (window.ethereum.isMetaMask && !window.ethereum.isPhantom) {
    return window.ethereum
  }

  return null
}

const switchToHashKeyChain = async (raw) => {
  try {
    await raw.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: HASHKEY_CHAIN_ID }] })
  } catch (e) {
    if (e.code === 4902 || e.code === -32603) {
      await raw.request({ method: 'wallet_addEthereumChain', params: [HASHKEY_NETWORK] })
    } else {
      throw e
    }
  }
}

function WalletConnect({ onConnect, walletAddress }) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [awaitingApproval, setAwaitingApproval] = useState(false)
  const [balance, setBalance]           = useState(null)
  const [error, setError]               = useState(null)

  useEffect(() => {
    if (walletAddress) fetchBalance()
  }, [walletAddress])

  const fetchBalance = async () => {
    try {
      const raw = await resolveMetaMaskProvider()
      if (!raw) return
      const provider = new ethers.BrowserProvider(raw)
      const bal = await provider.getBalance(walletAddress)
      setBalance(parseFloat(ethers.formatEther(bal)).toFixed(3))
    } catch (_) {}
  }

  const connectWallet = async () => {
    setIsConnecting(true)
    setAwaitingApproval(false)
    setError(null)

    // Step 1: resolve provider (EIP-6963 → providers array → window.ethereum)
    const raw = await resolveMetaMaskProvider()

    if (!raw) {
      setError('MetaMask not found — install it at metamask.io then refresh.')
      setIsConnecting(false)
      return
    }

    try {
      // Step 2: request accounts — this triggers the MetaMask popup
      setAwaitingApproval(true)
      const accounts = await raw.request({ method: 'eth_requestAccounts' })
      setAwaitingApproval(false)
      const account = accounts[0]

      // Step 3: check chain via raw RPC (no BrowserProvider yet — avoids NETWORK_ERROR)
      const chainHex = await raw.request({ method: 'eth_chainId' })
      if (parseInt(chainHex, 16) !== HASHKEY_CHAIN_NUM) {
        await switchToHashKeyChain(raw)
        await new Promise((r) => setTimeout(r, 600))
      }

      // Step 4: BrowserProvider only after correct chain is confirmed
      const provider = new ethers.BrowserProvider(raw)
      const bal      = await provider.getBalance(account)
      setBalance(parseFloat(ethers.formatEther(bal)).toFixed(3))
      onConnect(account)
    } catch (err) {
      setAwaitingApproval(false)
      const msg = err.message || ''
      if (err.code === 4001 || msg.includes('rejected') || msg.includes('denied'))
        setError('Rejected — click Approve in the MetaMask popup.')
      else if (msg.toLowerCase().includes('no active wallet'))
        setError('MetaMask not connected to this site — open MetaMask and approve the connection request.')
      else if (msg.includes('already pending') || err.code === -32002)
        setError('Approval pending — open MetaMask and accept the pending request.')
      else if (msg.includes('network changed') || msg.includes('NETWORK_ERROR'))
        setError('Network switched — click Connect MetaMask again.')
      else
        setError(msg.slice(0, 100) || 'Connection failed — check MetaMask.')
      console.error('WalletConnect error:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  const truncate = (addr) => `${addr.slice(0, 6)}…${addr.slice(-4)}`

  if (walletAddress) {
    return (
      <div className="flex items-center gap-2">
        {balance !== null && (
          <div
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg mono text-xs"
            style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)' }}
          >
            <span className="live-dot" style={{ width: 5, height: 5 }} />
            <span style={{ color: '#C9A84C' }}>{balance} HSK</span>
          </div>
        )}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg mono text-xs"
          style={{ background: 'rgba(109,40,217,0.10)', border: '1px solid rgba(109,40,217,0.25)' }}
        >
          <span className="text-xs">🦊</span>
          <span style={{ color: '#E8E2D8', fontWeight: 500 }}>{truncate(walletAddress)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="btn-primary text-sm px-5 py-2.5"
      >
        {awaitingApproval ? (
          <>
            <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
            Check MetaMask popup…
          </>
        ) : isConnecting ? (
          <>
            <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
            Connecting…
          </>
        ) : (
          <>
            <span>🦊</span>
            Connect MetaMask
          </>
        )}
      </button>
      {error && (
        <p
          className="text-xs mt-1 max-w-[240px] text-right mono"
          style={{ color: '#D9534F' }}
        >
          {error}
        </p>
      )}
    </div>
  )
}

export default WalletConnect
