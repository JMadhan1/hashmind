"""
HashMind Backend API
Triple-Agent Consensus Trading System — HashKey Chain Horizon Hackathon 2026

Endpoints:
  POST /analyze          — Analyze wallet on HashKey Chain
  POST /consensus        — Run 3-agent consensus and return votes
  POST /log-consensus    — Write consensus votes to HashMind.sol on-chain
  POST /ask              — Conversational DeFi Q&A
  GET  /agent/stats      — On-chain agent identity + reputation
  GET  /hashkey/stats    — Live HashKey Chain network stats
  GET  /history          — Recent global consensus activity feed
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import time
import hashlib
from dotenv import load_dotenv

from agents.wallet_analyzer import WalletAnalyzer
from agents.consensus_agents import ConsensusAgents
from agents.hashkey_client  import HashKeyClient

load_dotenv()

app = FastAPI(
    title="HashMind API",
    description="Triple-Agent Consensus Trading on HashKey Chain",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

wallet_analyzer   = WalletAnalyzer()
consensus_agents  = ConsensusAgents()
hashkey_client    = HashKeyClient()

# In-memory activity log (last 50 consensus runs)
recent_activity: List[dict] = []


def record_activity(wallet_address: str, consensus_reached: bool, action: str):
    recent_activity.append({
        "wallet":           wallet_address[:6] + "..." + wallet_address[-4:],
        "consensus":        consensus_reached,
        "action":           action[:50] if action else "DEFERRED",
        "timestamp":        int(time.time()),
    })
    if len(recent_activity) > 50:
        recent_activity.pop(0)


# ── Request models ─────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    wallet_address: str

class ConsensusRequest(BaseModel):
    wallet_address: str
    context: Optional[str] = None

class LogConsensusRequest(BaseModel):
    wallet_address: str
    alpha_vote: int          # 0=DEFER 1=EXECUTE 2=REJECT
    alpha_signal: str
    alpha_reason: str
    alpha_conf: int
    yield_vote: int
    yield_signal: str
    yield_reason: str
    yield_conf: int
    guard_vote: int
    guard_signal: str
    guard_reason: str
    guard_conf: int
    final_action: str
    private_key: Optional[str] = None

class AskRequest(BaseModel):
    question: str
    wallet_address: Optional[str] = None


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {
        "status":   "ok",
        "chain":    "HashKey Chain Mainnet",
        "chain_id": 177,
        "version":  "2.0.0",
        "project":  "HashMind — Triple-Agent Consensus Trading",
    }


@app.post("/analyze")
async def analyze_wallet(request: AnalyzeRequest):
    if not request.wallet_address.startswith("0x"):
        raise HTTPException(400, "Invalid wallet address")
    try:
        return await wallet_analyzer.analyze(request.wallet_address)
    except Exception as e:
        raise HTTPException(500, str(e))


@app.post("/consensus")
async def run_consensus(request: ConsensusRequest):
    """
    Core endpoint — runs all 3 AI agents and returns their individual votes
    plus the consensus outcome.

    Flow:
      1. Analyze wallet on HashKey Chain
      2. AlphaAgent: market signal from live chain metrics
      3. YieldAgent: best yield action for this wallet
      4. GuardAgent: risk review of Alpha + Yield votes
      5. Compute 2-of-3 consensus
      6. Return all votes + final action
    """
    if not request.wallet_address.startswith("0x"):
        raise HTTPException(400, "Invalid wallet address")
    try:
        wallet_data = await wallet_analyzer.analyze(request.wallet_address)
        result      = await consensus_agents.run_consensus(wallet_data, request.context)

        record_activity(
            request.wallet_address,
            result["consensus_reached"],
            result["final_action"],
        )

        return {
            "wallet_address":   request.wallet_address,
            "wallet_profile": {
                "balance_hsk":    wallet_data.get("balance_hsk", 0),
                "risk_profile":   wallet_data.get("risk_profile"),
                "activity_level": wallet_data.get("activity_level"),
                "tx_count":       wallet_data.get("total_tx_count", 0),
            },
            "agents": {
                "alpha": result["alpha"],
                "yield": result["yield"],
                "guard": result["guard"],
            },
            "consensus": {
                "reached":               result["consensus_reached"],
                "execute_count":         result["execute_count"],
                "final_action":          result["final_action"],
                "aggregated_confidence": result["aggregated_confidence"],
                "summary":               result["reasoning_summary"],
            },
            "timestamp": int(time.time()),
        }
    except Exception as e:
        print(f"Consensus error: {e}")
        raise HTTPException(500, str(e))


@app.post("/log-consensus")
async def log_consensus_onchain(request: LogConsensusRequest):
    """
    Write the 3-agent consensus votes to HashMind.sol on HashKey Chain Mainnet.
    If private_key is provided, sends a real transaction.
    Otherwise generates a deterministic mock tx hash for demo mode.
    """
    try:
        vote_map = {"EXECUTE": 1, "DEFER": 0, "REJECT": 2}

        if request.private_key and hashkey_client.contract:
            try:
                tx_hash = await hashkey_client.log_consensus_to_contract(
                    private_key    = request.private_key,
                    alpha_vote     = request.alpha_vote,
                    alpha_signal   = request.alpha_signal,
                    alpha_reason   = request.alpha_reason,
                    alpha_conf     = request.alpha_conf,
                    yield_vote     = request.yield_vote,
                    yield_signal   = request.yield_signal,
                    yield_reason   = request.yield_reason,
                    yield_conf     = request.yield_conf,
                    guard_vote     = request.guard_vote,
                    guard_signal   = request.guard_signal,
                    guard_reason   = request.guard_reason,
                    guard_conf     = request.guard_conf,
                    final_action   = request.final_action,
                )
                return {
                    "success":      True,
                    "tx_hash":      tx_hash,
                    "explorer_url": hashkey_client.explorer_tx(tx_hash),
                    "mock":         False,
                    "chain":        "HashKey Chain Mainnet",
                }
            except Exception as e:
                print(f"Real tx failed, falling back to mock: {e}")

        # Demo / fallback mock
        seed      = f"{request.final_action}{request.alpha_conf}{time.time()}"
        mock_hash = "0x" + hashlib.sha256(seed.encode()).hexdigest()
        return {
            "success":      True,
            "tx_hash":      mock_hash,
            "explorer_url": hashkey_client.explorer_tx(mock_hash),
            "mock":         True,
            "chain":        "HashKey Chain Mainnet (demo)",
        }
    except Exception as e:
        raise HTTPException(500, str(e))


class LogOnchainRequest(BaseModel):
    recommendation: str
    reasoning: Optional[str] = ""
    confidence: int = 75


@app.post("/log-onchain")
async def log_onchain_simple(request: LogOnchainRequest):
    """
    Simplified on-chain log for single recommendation cards (demo mode).
    Generates a mock tx hash — no private key required.
    """
    import hashlib as _hl
    seed      = f"{request.recommendation}{request.confidence}{time.time()}"
    mock_hash = "0x" + _hl.sha256(seed.encode()).hexdigest()
    return {
        "success":      True,
        "tx_hash":      mock_hash,
        "explorer_url": hashkey_client.explorer_tx(mock_hash),
        "mock":         True,
        "chain":        "HashKey Chain Mainnet (demo)",
    }


@app.post("/ask")
async def ask_advisor(request: AskRequest):
    if not request.question.strip():
        raise HTTPException(400, "Question cannot be empty")
    try:
        wallet_data = None
        if request.wallet_address and request.wallet_address.startswith("0x"):
            try:
                wallet_data = await wallet_analyzer.analyze(request.wallet_address)
            except Exception:
                pass
        answer = await consensus_agents.ask(request.question, wallet_data)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(500, str(e))


@app.get("/agent/stats")
async def get_agent_stats():
    try:
        stats = await hashkey_client.get_agent_stats()
        return {
            **stats,
            "contract_address": hashkey_client.contract_address,
            "explorer_url":     hashkey_client.explorer_address(
                hashkey_client.contract_address or ""
            ) if hashkey_client.contract_address else None,
            "chain":            "HashKey Chain Mainnet",
            "chain_id":         177,
        }
    except Exception as e:
        print(f"Agent stats error: {e}")
        return {
            "name":             "HashMind",
            "version":          "2.0.0",
            "total_consensus":  len(recent_activity),
            "reputation_score": 80,
            "source":           "fallback",
            "chain_id":         177,
        }


@app.get("/hashkey/stats")
async def get_hashkey_stats():
    """Live HashKey Chain network stats from Blockscout."""
    import httpx
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get("https://hsk.blockscout.com/api/v2/stats")
            if r.status_code == 200:
                s = r.json()
                gas_price = await hashkey_client.get_gas_price()
                block_num = await hashkey_client.get_block_number()
                return {
                    "gas_price_gwei":        s.get("gas_prices", {}).get("average", 0.01),
                    "block_number":          block_num,
                    "avg_block_time_ms":     s.get("average_block_time", 2000),
                    "transactions_today":    s.get("transactions_today", 0),
                    "total_transactions":    s.get("total_transactions", 0),
                    "total_addresses":       s.get("total_addresses", 0),
                    "network_utilization":   round(s.get("network_utilization_percentage", 0), 4),
                    "chain_id":              177,
                    "network":               "HashKey Chain Mainnet",
                    "total_consensus_logged": len(recent_activity),
                }
    except Exception as e:
        print(f"HashKey stats error: {e}")
    return {
        "gas_price_gwei":        0.01,
        "block_number":          0,
        "chain_id":              177,
        "network":               "HashKey Chain Mainnet",
        "total_consensus_logged": len(recent_activity),
    }


@app.get("/history")
async def get_global_history():
    return {
        "recent_consensus": list(reversed(recent_activity))[:20],
        "total":            len(recent_activity),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
