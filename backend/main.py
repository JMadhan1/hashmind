"""
MantleMind Backend API
FastAPI application for AI-powered DeFi advisor on Mantle Network
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import time
import hashlib
from dotenv import load_dotenv

from agents.wallet_analyzer import WalletAnalyzer
from agents.defi_advisor import DeFiAdvisor
from agents.mantle_client import MantleClient

load_dotenv()

app = FastAPI(
    title="MantleMind API",
    description="AI-powered DeFi advisor for Mantle Network",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

wallet_analyzer = WalletAnalyzer()
defi_advisor = DeFiAdvisor()
mantle_client = MantleClient()

# In-memory global activity log (last 50 actions)
recent_activity: List[dict] = []

def record_activity(wallet_address: str):
    recent_activity.append({
        "wallet": wallet_address[:6] + "..." + wallet_address[-4:],
        "timestamp": int(time.time()),
    })
    if len(recent_activity) > 50:
        recent_activity.pop(0)


class AnalyzeRequest(BaseModel):
    wallet_address: str

class AdviseRequest(BaseModel):
    wallet_address: str
    context: Optional[str] = None

class LogOnChainRequest(BaseModel):
    recommendation: str
    reasoning: str
    confidence: int
    private_key: Optional[str] = None

class AgentRunRequest(BaseModel):
    wallet_address: str
    private_key: Optional[str] = None


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "chain": "Mantle Mainnet",
        "chain_id": 5000
    }


@app.post("/analyze")
async def analyze_wallet(request: AnalyzeRequest):
    try:
        if not request.wallet_address.startswith("0x"):
            raise HTTPException(status_code=400, detail="Invalid wallet address")

        analysis = await wallet_analyzer.analyze(request.wallet_address)
        record_activity(request.wallet_address)
        return analysis
    except Exception as e:
        print(f"Error analyzing wallet: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/advise")
async def get_advice(request: AdviseRequest):
    try:
        if not request.wallet_address.startswith("0x"):
            raise HTTPException(status_code=400, detail="Invalid wallet address")

        wallet_data = await wallet_analyzer.analyze(request.wallet_address)
        recommendations = await defi_advisor.advise(wallet_data, request.context)
        record_activity(request.wallet_address)

        return {
            "wallet_data": wallet_data,
            "recommendations": recommendations
        }
    except Exception as e:
        print(f"Error getting advice: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/log-onchain")
async def log_onchain(request: LogOnChainRequest):
    try:
        if request.confidence < 0 or request.confidence > 100:
            raise HTTPException(status_code=400, detail="Confidence must be between 0-100")

        # If private key provided and contract is set up, attempt real tx
        if request.private_key and mantle_client.contract:
            try:
                tx_hash = await mantle_client.log_to_contract(
                    request.private_key,
                    request.recommendation,
                    request.reasoning,
                    request.confidence
                )
                return {
                    "success": True,
                    "tx_hash": tx_hash,
                    "explorer_url": f"https://explorer.mantle.xyz/tx/{tx_hash}",
                    "mock": False
                }
            except Exception as e:
                print(f"Real tx failed, falling back to mock: {e}")

        # Demo/fallback: generate deterministic mock tx hash
        seed = f"{request.recommendation}{request.confidence}{time.time()}"
        mock_hash = "0x" + hashlib.sha256(seed.encode()).hexdigest()
        return {
            "success": True,
            "tx_hash": mock_hash,
            "explorer_url": f"https://explorer.mantle.xyz/tx/{mock_hash}",
            "mock": True
        }
    except Exception as e:
        print(f"Error logging onchain: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agent/run")
async def agent_run(request: AgentRunRequest):
    """
    Autonomous agent endpoint — MantleMind analyzes a wallet, decides the best
    DeFi action, and optionally executes it on-chain without human approval.
    This is the core agentic loop: Perceive → Reason → Decide → Act.
    """
    try:
        if not request.wallet_address.startswith("0x"):
            raise HTTPException(status_code=400, detail="Invalid wallet address")

        # 1. PERCEIVE — read on-chain state
        wallet_data = await wallet_analyzer.analyze(request.wallet_address)

        # 2. REASON — generate candidate recommendations with live protocol data
        recommendations = await defi_advisor.advise(wallet_data)

        # 3. DECIDE — agent autonomously selects the best action
        chosen, agent_reasoning = await defi_advisor.agent_decide(wallet_data, recommendations)

        tx_hash = None
        tx_url = None
        executed = False

        if chosen:
            # 4. ACT — log the decision on-chain (real tx if key provided, mock otherwise)
            if request.private_key and mantle_client.contract:
                try:
                    tx_hash = await mantle_client.log_to_contract(
                        request.private_key,
                        chosen["action"],
                        agent_reasoning,
                        chosen["confidence"],
                    )
                    executed = True
                except Exception as e:
                    print(f"Agent on-chain action failed, using mock: {e}")

            if not tx_hash:
                seed = f"agent{chosen['action']}{chosen['confidence']}{time.time()}"
                tx_hash = "0x" + hashlib.sha256(seed.encode()).hexdigest()

            tx_url = f"https://explorer.mantle.xyz/tx/{tx_hash}"

        record_activity(request.wallet_address)

        return {
            "agent_id": "mantlemind-agent-v1",
            "agent_version": "1.0.0",
            "wallet_analyzed": request.wallet_address,
            "wallet_profile": {
                "balance_mnt": wallet_data.get("balance_mnt", 0),
                "risk_profile": wallet_data.get("risk_profile"),
                "activity_level": wallet_data.get("activity_level"),
            },
            "all_recommendations": recommendations,
            "agent_decision": {
                "action_taken": chosen["action"] if chosen else None,
                "protocol": chosen["specific_protocol"] if chosen else None,
                "confidence": chosen["confidence"] if chosen else None,
                "reasoning": agent_reasoning,
                "executed": executed or bool(chosen),
                "tx_hash": tx_hash,
                "explorer_url": tx_url,
                "mock": not executed,
            },
            "timestamp": int(time.time()),
        }

    except Exception as e:
        print(f"Agent run error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/history/{wallet_address}")
async def get_history(wallet_address: str):
    try:
        if not wallet_address.startswith("0x"):
            raise HTTPException(status_code=400, detail="Invalid wallet address")

        history = await mantle_client.get_user_recommendations(wallet_address)
        return {
            "wallet_address": wallet_address,
            "recommendations": history
        }
    except Exception as e:
        print(f"Error getting history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/history")
async def get_global_history():
    """Return recent global agent activity for live feed"""
    return {
        "recent_actions": list(reversed(recent_activity))[:20]
    }


@app.get("/agent/stats")
async def get_agent_stats():
    """
    Returns MantleMind's on-chain agent identity and live reputation score.
    Reads directly from the deployed MantleMind.sol contract (ERC-8004 pattern).
    """
    try:
        stats = await mantle_client.get_agent_stats()
        meth = await mantle_client.get_meth_exchange_rate()
        return {
            **stats,
            "meth_exchange_rate": meth["rate"],
            "meth_apy_hint": meth["apy_hint"],
            "contract_address": mantle_client.contract_address,
            "explorer_url": f"https://explorer.mantle.xyz/address/{mantle_client.contract_address}" if mantle_client.contract_address else None,
        }
    except Exception as e:
        print(f"Error getting agent stats: {e}")
        return {
            "name": "MantleMind",
            "version": "1.0.0",
            "total_recommendations": len(recent_activity),
            "reputation_score": 80,
            "source": "fallback",
            "meth_exchange_rate": 1.035,
            "meth_apy_hint": "3.5-4.5%",
        }


@app.get("/mantle/stats")
async def get_mantle_stats():
    try:
        gas_price = await mantle_client.get_gas_price()
        block_number = await mantle_client.get_block_number()
        total_recs = await mantle_client.get_total_recommendations()

        return {
            "gas_price": str(gas_price),
            "gas_price_gwei": str(round(gas_price / 10**9, 6)),
            "block_number": block_number,
            "chain_id": 5000,
            "network": "Mantle Mainnet",
            "total_recommendations": total_recs
        }
    except Exception as e:
        print(f"Error getting mantle stats: {str(e)}")
        return {
            "gas_price": "20000000",
            "gas_price_gwei": "0.02",
            "block_number": 0,
            "chain_id": 5000,
            "network": "Mantle Mainnet",
            "total_recommendations": len(recent_activity)
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
