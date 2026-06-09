# MantleMind — AI Agent with On-Chain Reputation on Mantle

> The first autonomous AI DeFi agent that builds a verifiable on-chain reputation. Every recommendation it makes permanently updates its accountability score on Mantle — confidence, reasoning, and decision, all stored on-chain as immutable proof.

**Turing Test Hackathon 2026 — Consumer & Viral DApps Track**

---

## Contract (Deploy + Verify)

| | |
|---|---|
| **Address** | `YOUR_DEPLOYED_CONTRACT_ADDRESS` — run `python deploy.py` |
| **Network** | Mantle Mainnet (Chain ID 5000) |
| **Explorer** | `https://explorer.mantle.xyz/address/YOUR_DEPLOYED_CONTRACT_ADDRESS` |
| **Verified** | Auto-verified by `deploy.py` on Mantle Explorer |

> **Deploy instructions:** Set `DEPLOYER_PRIVATE_KEY` and `GROQ_API_KEY` in `backend/.env`, then `cd contract && python deploy.py`. The script auto-compiles, deploys, and submits for verification on Mantle Explorer. After deployment, update `CONTRACT_ADDRESS` in `.env`.

---

## One-Line Pitch

MantleMind is the first AI agent on Mantle that doesn't just advise — it acts autonomously, then permanently records its confidence score and reasoning on-chain, building a public reputation that anyone can audit.

---

## Why This Wins

Most AI × DeFi tools are chatbots. MantleMind introduces a new primitive: **verifiable AI accountability on a public blockchain**.

When MantleMind's agent makes a recommendation, three things happen automatically:
1. The action, reasoning, and confidence score are stored on Mantle — forever, immutably
2. The agent's on-chain reputation score updates based on its decision history
3. An `AIRecommendation` + `ReputationUpdated` event is emitted — indexable by Nansen, Elfa, anyone

This creates the first AI that can be **publicly benchmarked by its on-chain track record** — not claimed benchmarks, not whitepapers. Real decisions, real chain, real history.

---

## Agentic Loop (Perceive → Reason → Decide → Act)

```
POST /agent/run
│
├── PERCEIVE  — WalletAnalyzer reads balance, tx history, token holdings from Mantle RPC
│
├── REASON    — defi_data.py fetches live data:
│               • MNT native staking APY from protocol docs
│               • mETH exchange rate from contract (ERC-4626 convertToAssets)
│               • Agni Finance supply APY via API
│               • Merchant Moe TVL/volume via API
│               → All injected into Groq llama-3.3-70b context
│
├── DECIDE    — agent_decide() autonomously selects best action
│               if confidence ≥ 75% AND risk ∈ {low, medium} → execute
│               else → defer with explanation
│
└── ACT       → MantleMind.sol.logRecommendation(action, reasoning, confidence)
                 emits: AIRecommendation, AgentDecision, ReputationUpdated
                 updates: agentIdentity.reputationScore (rolling avg of last 20)
```

---

## Smart Contract — ERC-8004 Agent Identity

`MantleMind.sol` implements ERC-8004 inspired agent identity:

```solidity
// Minted on deploy — agent exists on-chain as a named identity
emit AgentMinted(owner, "MantleMind", "1.0.0", block.timestamp);

// Called by the agent autonomously
function logRecommendation(action, reasoning, confidence) public {
    // stores recommendation permanently
    // updates rolling reputation score (last 20 confidence values)
    emit ReputationUpdated(newScore, totalRecs, block.timestamp);
}

// Anyone can query the agent's track record
function getAgentStats() public view returns (name, version, totalRecs, reputationScore, ...)
```

---

## Business Model

**Market:** 1M+ MNT holders who want DeFi yield but lack confidence or knowledge.

**Revenue streams:**
| Stream | Mechanism | Est. Revenue |
|---|---|---|
| Protocol referrals | Merchant Moe / Agni pay 0.1–0.3% of TVL routed via MantleMind | Scales with usage |
| MantleMind Pro | $5/mo: unlimited agent runs, alert bots, portfolio tracking | SaaS recurring |
| White-label API | Sell advisory engine to wallets / DEX frontends | B2B licensing |

**GTM:**
- Day 1: Mantle Discord + Twitter — target "I have MNT but don't know what to do with it" users
- Week 1: Protocol co-marketing with Merchant Moe and Agni Finance
- Month 1: Every user tweet via Share Card drives organic K-factor > 1
- The demo mode (no wallet needed) removes cold-start friction entirely

---

## Architecture

```
React + Tailwind Frontend
  │  MetaMask → Mantle Mainnet (Chain ID 5000)
  │  /api/* proxy → FastAPI
  │  Dashboard: wallet stats, AI recommendations, agent reputation, share card
  │  AI Q&A Advisor: natural language DeFi questions → Groq AI answers
  │
FastAPI Backend (agents/)
  ├── wallet_analyzer.py — Mantle RPC + Explorer API (USDT, USDC, mETH, WETH, WMNT)
  ├── defi_data.py       — live APY: mETH contract + Agni + Merchant Moe + MNT Staking APIs
  ├── defi_advisor.py    — Groq llama-3.3-70b + agent_decide() autonomous selection
  └── mantle_client.py  — Web3 tx, retry, get_agent_stats(), get_meth_exchange_rate()
  │
Mantle Mainnet
  └── MantleMind.sol
      ├── ERC-8004: AgentMinted event on deploy
      ├── logRecommendation() — stores AI decision permanently
      ├── getAgentStats()     — returns name, version, totalRecs, reputationScore
      └── ReputationUpdated   — event emitted on every decision
```

## Key Mantle Integrations

| Protocol | How Integrated |
|---|---|
| MNT Staking | AI recommends native MNT staking (3-5% APY + veMNT boosts) |
| Merchant Moe | Live TVL/volume fetched, referenced in all AI recommendations |
| Agni Finance | Live supply APY fetched via API, used in AI context |
| mETH | Exchange rate read directly from contract (ERC-4626), APY in AI context |
| Fluxion | Advanced strategy recommendations for high-risk profiles |
| WETH | Token balance read from on-chain contract |
| WMNT | Wrapped MNT token balance read from on-chain contract |
| Mantle RPC | Balance, tx count, token holdings, gas price, block number |
| Mantle Explorer | Tx history via Blockscout API |

---

## Judging Criteria Mapping

### General Scorecard (All Tracks)

| Dimension | Weight | How MantleMind Satisfies |
|---|---|---|
| **Technical Depth** | 30% | Full agentic loop (PERCEIVE→REASON→DECIDE→ACT) implemented end-to-end. Smart contract stores every recommendation immutably with rolling reputation score. mETH exchange rate read directly from ERC-4626 contract. Live protocol data (Agni, Merchant Moe, MNT Staking) fetched and injected into Groq llama-3.3-70b context. |
| **Ecosystem Fit** | 20% | Deep Mantle integration: MNT native staking, mETH, Agni Finance, Merchant Moe, Fluxion. Reads USDT, USDC, mETH, WETH, WMNT balances directly from Mantle contracts. Uses Mantle RPC + Blockscout Explorer API. Smart contract emits `ReputationUpdated` events indexable by Nansen. |
| **Business Potential** | 20% | Three revenue streams (protocol referrals, Pro SaaS, white-label API). Clear go-to-market with demo mode removing cold-start friction. 1M+ MNT holders as addressable market. |
| **Innovation** | 20% | First AI × DeFi primitive: **verifiable on-chain AI accountability**. ERC-8004 Agent Identity pattern. Publicly benchmarkable AI via on-chain track record — not claimed benchmarks, real decisions on a real chain. |
| **User Experience** | 10% | Clean dark UI with Tailwind, animated numbers, glass cards. Demo mode (no wallet needed) for instant onboarding. Share card for Twitter/X viral mechanics. AI Q&A advisor for natural interaction. "Log to Mantle" one-click on-chain recording. |

### Consumer Viral DApp Track

| Criteria | How We Satisfy |
|---|---|
| Growth potential | K-factor > 1: every user share on X/Twitter exposes MantleMind to new users |
| Organic community engagement | Live agent activity feed. Share card drives organic reach. Demo mode lowers barrier to zero. |
| User virality | Share card auto-generates tweet with confidence score, action, and link. |
| AI interaction design | Q&A advisor for natural DeFi questions. Agent decision panel shows transparent reasoning. |
| Accessibility for Web2 users | Demo mode with no wallet required. Explains DeFi in plain language. |

---

## Project Deployment Award Checklist

> Must satisfy ALL of the following (first-come, first-served — 20 spots only).

### Technical Deployment
- [ ] Smart contract deployed on **Mantle Mainnet or Testnet** — run `cd contract && python deploy.py`
- [ ] Contract verified on Mantle Explorer — handled automatically by `deploy.py`
- [ ] At least one AI-powered function is callable on-chain: `logRecommendation(action, reasoning, confidence)`

### Product Completeness
- [ ] Frontend demo is publicly accessible (not localhost) — deploy via `npx vercel --prod`
- [ ] Deployment address included in your DoraHacks submission
- [ ] Submit a demo video (>= 2 min) walking through the core use case

### Documentation
- [ ] Open-source GitHub repo with README (this file)
- [ ] Architecture overview in README
- [ ] Deployed contract address in README and `.env`

---

## Quick Start

```bash
# 1. Clone & setup
# 2. Set environment variables
cd backend && cp .env.example .env
#    - GROQ_API_KEY (get free at console.groq.com)
#    - DEPLOYER_PRIVATE_KEY (for contract deploy)

# 3. Install backend dependencies
pip install -r requirements.txt

# 4. Deploy smart contract
cd contract && python deploy.py
# Copy the deployed contract address into backend/.env as CONTRACT_ADDRESS

# 5. Start backend
cd backend && uvicorn main:app --reload --port 8000

# 6. Start frontend
cd frontend && npm install && npm run dev  # http://localhost:5173

# 7. Deploy frontend publicly
#    a) Edit frontend/vercel.json → set your deployed backend URL
#    b) npx vercel --prod
```

---

Powered by **Mantle Network** • **Groq AI** • **Open Source** | Turing Test Hackathon 2026
