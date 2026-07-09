<div align="center">

```
╦ ╦╔═╗╔═╗╦ ╦╔╦╗╦╔╗╔╔╦╗
╠═╣╠═╣╚═╗╠═╣║║║║║║║ ║║
╩ ╩╩ ╩╚═╝╩ ╩╩ ╩╩╝╚╝═╩╝
```

### *The first trading system where 3 AI agents must agree — and every vote lives on-chain forever.*

[![HashKey Chain](https://img.shields.io/badge/HashKey_Chain-Mainnet_177-0BBDCA?style=for-the-badge&logo=ethereum&logoColor=white)](https://hsk.blockscout.com)
[![Groq AI](https://img.shields.io/badge/Groq-llama--3.3--70b-C9A84C?style=for-the-badge&logo=lightning&logoColor=white)](https://groq.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-1B7A51?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-0BBDCA?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Hackathon](https://img.shields.io/badge/HashKey_Chain_Horizon-Japan_2026-E05A3A?style=for-the-badge)](https://dorahacks.io/hackathon/hskchainjapan)

### 🌐 [Live App](https://hashmind-three.vercel.app/) &nbsp;|&nbsp; 🎥 [Demo Video](https://youtu.be/jRvGa8zOzEA) &nbsp;|&nbsp; ⚙️ [Backend API](https://hashmind.onrender.com) &nbsp;|&nbsp; 💻 [GitHub](https://github.com/JMadhan1/hashmind)

</div>

---

<div align="center">

## 🧠 No single AI can move your capital. All three must agree.

</div>

Every other AI trading tool trusts one model with your money.

**HashMind doesn't.**

Three specialist AI agents — each with a different lens on the market — independently vote on every signal. If fewer than 2 vote EXECUTE, nothing happens. And every single vote is permanently written to **HashMind.sol on HashKey Chain Mainnet** before the outcome is computed. The chain proves the AI isn't cherry-picking.

> *"Three minds. One consensus. Zero cherry-picking. The chain is the proof."*

---

## ⚡ Live on HashKey Chain Mainnet

| | |
|:---:|:---:|
| **Network** | HashKey Chain Mainnet · Chain ID `177` |
| **Contract** | HashMind.sol (deploy with `contract/deploy.py`) |
| **Explorer** | [hsk.blockscout.com ↗](https://hsk.blockscout.com) |
| **RPC** | `https://mainnet.hsk.xyz` |

---

## 🤖 The Three Agents

```
┌─────────────────────────────────────────────────────────┐
│               HashMind Consensus Loop                    │
├────────────┬────────────┬────────────┬─────────────────  │
│            │            │            │                    │
│ PERCEIVE   │ DELIBERATE │ CONSENSUS  │       PROVE        │
│            │            │            │                    │
│ Read HSK   │ AlphaAgent │ 2-of-3     │ logConsensusVotes()│
│ balances   │ → market   │ must vote  │ → all 3 votes      │
│ stHSK pos  │ signal     │ EXECUTE    │   stored on-chain  │
│ veHSK lock │            │            │ → HashKey Chain    │
│ tx history │ YieldAgent │ Consensus  │ → immutable forever│
│ from       │ → yield    │ reached?   │                    │
│ Blockscout │ action     │            │ ConsensusReached ✓ │
│ API        │            │ YES → fire │ AgentVoteCast ×3 ✓ │
│            │ GuardAgent │ NO → defer │ ReputationUpdated✓ │
│            │ → risk     │            │                    │
└────────────┴────────────┴────────────┴─────────────────  ┘
```

| Agent | Role | Data Sources |
|:---:|:---:|:---:|
| 🔵 **AlphaAgent** | Market Signal | Blockscout live stats: tx/day, gas, address growth |
| ⚡ **YieldAgent** | Yield Optimiser | stHSK APY, veHSK boost rates, WoofSwap TVL |
| 🛡 **GuardAgent** | Risk Assessor | Wallet exposure, position sizing, peer vote review |

---

## 🏗️ Architecture

```
┌─────────────────────── FRONTEND ────────────────────────────┐
│  React 18 · Tailwind · ethers.js v6 · Vite                  │
│                                                              │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Identity Passport│  │ Consensus    │  │  AI Q&A Chat   │  │
│  │ (generative SVG) │  │ Panel        │  │  (Groq/live)   │  │
│  └─────────────────┘  │ • AlphaAgent │  └────────────────┘  │
│                        │ • YieldAgent │                       │
│                        │ • GuardAgent │                       │
│                        └──────────────┘                       │
│  MetaMask (EIP-6963) ──► HashKey Chain Mainnet (Chain 177)   │
└──────────────────────────────┬───────────────────────────── ┘
                               │ /api/* proxy
┌─────────────────── BACKEND ──┼──────────────────────────────┐
│  FastAPI · Python · Groq AI  │                               │
│                              ▼                               │
│  wallet_analyzer.py  ──► HashKey RPC + Blockscout API        │
│  hsk_data.py         ──► stHSK, veHSK, WoofSwap data         │
│  consensus_agents.py ──► 3 Groq agents + consensus logic     │
│  hashkey_client.py   ──► Web3.py · HashMind contract r/w     │
└──────────────────────────────┬───────────────────────────── ┘
                               │ web3 calls
┌──────────────── HASHKEY CHAIN┼──────────────────────────────┐
│  HashMind.sol (Chain ID 177) │                               │
│                              ▼                               │
│  logConsensusVotes() ──► 3 votes stored BEFORE consensus     │
│  getAgentStats()     ──► on-chain reputation, total runs     │
│  AgentVoteCast ×3    ──► individual vote events              │
│  ConsensusReached    ──► final outcome event                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Smart Contract — HashMind.sol

```solidity
// Three votes are emitted BEFORE consensus is written — no cherry-picking
emit AgentVoteCast(msg.sender, "AlphaAgent", alphaVote, alphaConf, block.timestamp);
emit AgentVoteCast(msg.sender, "YieldAgent", yieldVote, yieldConf, block.timestamp);
emit AgentVoteCast(msg.sender, "GuardAgent", guardVote, guardConf, block.timestamp);

// 2-of-3 consensus
uint8 executeCount = 0;
if (alphaVote == EXECUTE) executeCount++;
if (yieldVote == EXECUTE) executeCount++;
if (guardVote == EXECUTE) executeCount++;
bool reached = executeCount >= 2;

// Emit outcome
if (reached) emit ConsensusReached(user, finalAction, aggConf, ...);
else         emit ConsensusFailed(user, "Less than 2 agents voted EXECUTE", ...);
```

---

## 💡 What Makes This Different

| | **HashMind** | Single-Agent AI | On-chain Bots |
|:---:|:---:|:---:|:---:|
| Multi-agent consensus | ✅ 3-of-3 deliberate | ❌ | ❌ |
| Votes logged before outcome | ✅ | ❌ | ❌ |
| Per-agent reputation on-chain | ✅ | ❌ | Partial |
| Live HashKey Chain data | ✅ | ❌ | ✅ |
| stHSK / veHSK integration | ✅ | ❌ | Rare |
| No cherry-picking proof | ✅ Cryptographic | ❌ | ❌ |
| No wallet needed (demo) | ✅ | ✅ | ❌ |

---

## 🚀 Quick Start

```bash
git clone https://github.com/JMadhan1/HashMind.git
cd HashMind

# Backend
cd backend
cp .env.example .env
# Set: GROQ_API_KEY, DEPLOYER_PRIVATE_KEY, CONTRACT_ADDRESS, HASHKEY_RPC

pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev   # → http://localhost:5173

# Deploy contract to HashKey Chain Mainnet
cd contract && python deploy.py
```

### Environment Variables
```env
GROQ_API_KEY=your_groq_key
DEPLOYER_PRIVATE_KEY=0x...
CONTRACT_ADDRESS=0x...           # after deploy.py
HASHKEY_RPC=https://mainnet.hsk.xyz
```

---

## ⚡ HSP (HashKey Settlement Protocol) Integration

HashMind is the **first trading system to gate HSP settlement behind multi-agent consensus.**

The flow:
```
User connects wallet
    ↓
AlphaAgent  votes  EXECUTE / DEFER / REJECT
YieldAgent  votes  EXECUTE / DEFER / REJECT
GuardAgent  votes  EXECUTE / DEFER / REJECT
    ↓
2-of-3 EXECUTE? → logConsensusVotes() on HashMind.sol
    ↓
Consensus confirmed on-chain → executeWithHSP(hspOrderId, amount)
    ↓
HSP settlement order created — capital moves only after consensus
```

**Why this matters for the AI track:** No existing tool proves that AI consensus happened *before* capital moved. HashMind's `executeWithHSP()` function requires an on-chain `ConsensusReached` record — you cannot submit an HSP order without proof that 3 agents agreed.

| Endpoint | Description |
|---|---|
| `POST /consensus` | Run 3-agent vote, get consensus result |
| `POST /log-consensus` | Write all 3 votes to HashMind.sol |
| `POST /hsp-execute` | Submit consensus signal to HSP settlement |
| `GET /history` | Global consensus feed |

---

## 📈 HashKey Chain Ecosystem Integration

| Protocol | Role | APY |
|:---:|:---:|:---:|
| **stHSK** | Liquid staking | 6–10% |
| **veHSK** | Yield boost + governance | Up to 4× multiplier |
| **WoofSwap** | Primary DEX | 5–30% fee APY |
| **HSK Native** | Direct staking | 5–8% |

---

## 🏆 DoraHacks Submission — HashKey Chain Horizon Japan 2026

**Track:** AI (HSP) + DeFi (both)

**One-liner:** *The first trading system where 3 AI agents must reach on-chain consensus before any HSP settlement fires.*

**Problem:** Every existing AI trading tool is a black box. One model makes a call. You can't verify when the decision was made, what the other models thought, or whether the output was cherry-picked.

**Solution:** HashMind creates the first verifiable AI accountability primitive:
- 3 specialist agents (AlphaAgent, YieldAgent, GuardAgent) vote independently
- All 3 votes recorded immutably on HashKey Chain *before* the outcome
- 2-of-3 EXECUTE required — then and only then can HSP settlement be triggered
- `executeWithHSP()` on-chain enforces this — no consensus record = no settlement

**Live proof:**
- Contract: [`0xCDb15987099FBFC1e61563F39C138dF9635c273B`](https://hsk.blockscout.com/address/0xCDb15987099FBFC1e61563F39C138dF9635c273B)
- Explorer: https://hsk.blockscout.com/address/0xCDb15987099FBFC1e61563F39C138dF9635c273B
- Chain ID: 177 (HashKey Chain Mainnet)

---

<div align="center">

**⛓ HashKey Chain Mainnet · Chain ID 177**

**Built for HashKey Chain Horizon Hackathon · Japan 2026**

*Three agents deliberated. The chain decided. HSP settled. Forever.*

</div>
