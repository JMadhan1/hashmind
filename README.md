<div align="center">

```
╔╦╗╔═╗╔╗╔╔╦╗╦  ╔═╗╔╦╗╦╔╗╔╔╦╗
║║║╠═╣║║║ ║ ║  ║╣ ║║║║║║║ ║║
╩ ╩╩ ╩╝╚╝ ╩ ╩═╝╚═╝╩ ╩╩╝╚╝═╩╝
```

### *The AI agent that puts its money where its mouth is — on-chain.*

[![Mantle Sepolia](https://img.shields.io/badge/Mantle-Sepolia%205003-00D4FF?style=for-the-badge&logo=ethereum&logoColor=white)](https://explorer.sepolia.mantle.xyz)
[![Groq AI](https://img.shields.io/badge/Groq-llama--3.3--70b-C9A84C?style=for-the-badge&logo=lightning&logoColor=white)](https://groq.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-1B7A51?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-0BBDCA?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-8B5CF6?style=for-the-badge)](LICENSE)
[![Hackathon](https://img.shields.io/badge/Turing%20Test%202026-Consumer%20%26%20Viral%20DApps-E05A3A?style=for-the-badge)](https://dorahacks.io)

</div>

---

<div align="center">

## 🧠 What if your AI advisor had to put its reputation on the line — permanently?

</div>

Every other AI DeFi tool whispers advice and disappears.

**MantleMind commits.**

Every single recommendation the agent makes is permanently written to the Mantle blockchain — the action, the reasoning, the confidence score. The agent's reputation score updates in real-time. There is no delete. No edit. No hiding behind a chatbot interface. **The chain never forgets.**

> *"Not claimed benchmarks. Not whitepapers. Real decisions, on a real chain, building a real track record — forever."*

---

## ⚡ Live Contract

<div align="center">

| | |
|:---:|:---:|
| **Network** | Mantle Sepolia Testnet · Chain ID `5003` |
| **Contract** | [`0x4dE6AF7329E88F08C0560DAf1290a0DF152901E3`](https://explorer.sepolia.mantle.xyz/address/0x4dE6AF7329E88F08C0560DAf1290a0DF152901E3) |
| **Explorer** | [View on Mantle Explorer ↗](https://explorer.sepolia.mantle.xyz/address/0x4dE6AF7329E88F08C0560DAf1290a0DF152901E3) |
| **Standard** | ERC-8004 Agent Identity |

</div>

---

## 🔥 The Problem Nobody's Solving

> There are **thousands** of AI crypto advisors. Every single one of them:
> - Gives you advice with zero accountability
> - Disappears after the conversation ends
> - Can never be audited, fact-checked, or held responsible

**MantleMind breaks this pattern entirely.**

When our agent decides to recommend staking MNT or swapping on Merchant Moe — that decision, the full reasoning, and the confidence score are **written to a smart contract on Mantle. Permanently. In milliseconds.**

The agent can't take it back. It either builds a stellar track record or it doesn't. The chain is the judge.

---

## 🤖 The Agentic Loop

```
┌─────────────────────────────────────────────────────────────┐
│                    MantleMind Agent Loop                     │
├──────────┬──────────┬──────────┬──────────────────────────── │
│          │          │          │                              │
│ PERCEIVE │  REASON  │  DECIDE  │          ACT                 │
│          │          │          │                              │
│  Read    │  Fetch   │ Agent    │  logRecommendation()         │
│  wallet  │  live    │ scores   │  → stored on Mantle          │
│  on-     │  APY     │ each     │  → reputation updates        │
│  chain   │  from 5  │ option   │  → events emitted            │
│          │  DeFi    │          │  → immutable forever         │
│  MNT     │  proto-  │ conf≥75% │                              │
│  tokens  │  cols    │ → execute│  ReputationUpdated ✓         │
│  tx hist │          │ else     │  AIRecommendation  ✓         │
│          │  Groq    │ → defer  │  AgentDecision     ✓         │
│          │  70b     │          │                              │
└──────────┴──────────┴──────────┴──────────────────────────── ┘
```

### The 5 Live Mantle Protocol Sources
| Protocol | What We Fetch | Why It Matters |
|:---:|:---:|:---:|
| 🟡 **MNT Staking** | Native APY + veMNT boosts | Core Mantle yield primitive |
| 🟢 **mETH Protocol** | Exchange rate from ERC-4626 contract | Real-time ETH staking yield |
| 🔵 **Agni Finance** | Live supply APY via API | Best stable yields on Mantle |
| 🟠 **Merchant Moe** | TVL + volume data | Leading Mantle DEX liquidity |
| 🟣 **Fluxion** | Advanced strategy data | High-yield options for bold wallets |

---

## 🧬 Generative On-Chain Identity

Connect your wallet and MantleMind **instantly mints you a unique identity** derived entirely from your address — no server, no database, no API call.

```
Wallet Address → deterministic hash → unique archetype
                                    → color palette
                                    → reputation score
                                    → trait chips
```

Every address generates a completely unique **"The Strategist"**, **"The Whale"**, **"The Harvester"** etc. — with a matching SVG avatar and score ring. Your on-chain fingerprint, visualized.

---

## 🏗️ Architecture

```
┌─────────────────────── FRONTEND ────────────────────────────┐
│  React 18 · Tailwind · ethers.js v6 · Vite                  │
│                                                              │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Identity Passport│  │  APY Chart   │  │  AI Q&A Chat   │  │
│  │ (generative SVG) │  │  (5 protos)  │  │  (Groq/live)   │  │
│  └─────────────────┘  └──────────────┘  └────────────────┘  │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Recommendation  │  │ Agent Decision│  │  Share Card    │  │
│  │ Cards + OnChain │  │ Hero Panel    │  │  (X/Twitter)   │  │
│  └─────────────────┘  └──────────────┘  └────────────────┘  │
│                                                              │
│  MetaMask (EIP-6963) ──► Mantle Sepolia (Chain 5003)         │
└──────────────────────────────┬───────────────────────────── ┘
                               │ /api/* proxy
┌─────────────────── BACKEND ──┼──────────────────────────────┐
│  FastAPI · Python · Groq AI  │                               │
│                              ▼                               │
│  wallet_analyzer.py ──► Mantle RPC + Blockscout API          │
│  defi_data.py       ──► 5 live protocol APY fetchers         │
│  defi_advisor.py    ──► Groq llama-3.3-70b + agent_decide()  │
│  mantle_client.py   ──► Web3.py · contract read/write        │
└──────────────────────────────┬───────────────────────────── ┘
                               │ web3 calls
┌──────────────── MANTLE CHAIN ┼──────────────────────────────┐
│  MantleMind.sol (ERC-8004)   │                               │
│                              ▼                               │
│  logRecommendation()  ──► immutable on-chain record          │
│  getAgentStats()      ──► reputation score, total recs       │
│  ReputationUpdated    ──► event (indexable by Nansen/Elfa)   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Smart Contract — ERC-8004 Agent Identity

```solidity
// Agent is minted as an on-chain identity on deploy
emit AgentMinted(owner, "MantleMind", "1.0.0", block.timestamp);

// Every AI decision is permanently recorded
function logRecommendation(
    string memory action,
    string memory reasoning,
    uint8 confidence          // 0–100, affects rolling reputation
) public onlyOwner {
    // → stored permanently in recommendations[]
    // → reputation = rolling average of last 20 confidence scores
    emit AIRecommendation(action, reasoning, confidence, block.timestamp);
    emit ReputationUpdated(newScore, totalRecs, block.timestamp);
}

// Fully auditable, fully public
function getAgentStats() external view
    returns (string name, string version, uint256 totalRecs, uint8 reputationScore)
```

---

## 💡 What Makes This Different

<div align="center">

| | **MantleMind** | ChatGPT / Other AI | On-chain Bots |
|:---:|:---:|:---:|:---:|
| AI-powered advice | ✅ | ✅ | ❌ |
| Live DeFi protocol data | ✅ | ❌ | ❌ |
| Autonomous decision-making | ✅ | ❌ | ✅ |
| **On-chain reputation** | ✅ | ❌ | ❌ |
| **Immutable decision history** | ✅ | ❌ | Partial |
| No wallet needed (demo) | ✅ | ✅ | ❌ |
| Generative identity | ✅ | ❌ | ❌ |

</div>

---

## 📈 Business Model

**1M+ MNT holders** who want DeFi yield but don't know where to start.

```
┌──────────────────────────────────────────────────────┐
│  Revenue Stream         │  Mechanism                  │
├──────────────────────────────────────────────────────┤
│  Protocol Referrals     │  0.1–0.3% of TVL routed     │
│  MantleMind Pro ($5/mo) │  Unlimited runs, alerts      │
│  White-label API        │  B2B: wallets, DEX UIs       │
└──────────────────────────────────────────────────────┘
```

**Viral flywheel:** Every user runs the agent → Share Card auto-generates a tweet → New users discover MantleMind → K-factor > 1 from day one.

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/JMadhan1/MantleMind.git
cd MantleMind

# Backend setup
cd backend
cp .env.example .env
# Fill in: GROQ_API_KEY (free at console.groq.com)
#          DEPLOYER_PRIVATE_KEY, CONTRACT_ADDRESS, MANTLE_RPC

pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev   # → http://localhost:5173

# Deploy contract (optional — already deployed on Sepolia)
cd contract && python deploy.py
```

### 🌐 Production Deployment
| Service | Config |
|:---:|:---|
| **Backend** | [Render](https://render.com) → connect repo → `render.yaml` auto-configures everything |
| **Frontend** | [Vercel](https://vercel.com) → import repo → set root dir to `frontend/` → done |

---

## 🏆 Hackathon Judging

| Criterion | Weight | MantleMind Answer |
|:---:|:---:|:---|
| Technical Depth | 30% | Full PERCEIVE→REASON→DECIDE→ACT loop. ERC-8004 contract. Live mETH ERC-4626 rate. 5 protocol integrations. |
| Ecosystem Fit | 20% | MNT staking, mETH, Agni, Merchant Moe, Fluxion, WMNT, WETH — all live data on Mantle Sepolia. |
| Business Potential | 20% | 3 revenue streams. Demo mode = zero cold-start friction. Viral share card = organic growth. |
| Innovation | 20% | **First verifiable AI accountability primitive on a public blockchain.** The chain is the benchmark. |
| User Experience | 10% | Glassmorphic Web3 UI. No wallet needed. Generative identity. Real-time APY chart. |

---

<div align="center">

**Built on [Mantle Network](https://mantle.xyz)** · **Powered by [Groq AI](https://groq.com)** · **Turing Test Hackathon 2026**

*The agent has entered the chat. The chain has entered the record.*

⭐ Star this repo if you believe AI should be accountable.

</div>
