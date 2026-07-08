"""
HashKey Chain Wallet Analyzer
Analyzes on-chain activity on HashKey Chain Mainnet (Chain ID: 177)
Uses Blockscout API for transaction history and token balances.
"""

import httpx
import time
from web3 import Web3
from typing import Dict, List
import os
from dotenv import load_dotenv

load_dotenv()

HASHKEY_RPC      = os.getenv("HASHKEY_RPC", "https://mainnet.hsk.xyz")
BLOCKSCOUT_API   = "https://hsk.blockscout.com/api/v2"

# Token contracts on HashKey Chain Mainnet
HSK_TOKEN_CONTRACTS = {
    "USDT":  "0xF1B50eD67A9e2CC94Ad3c477779E2d4cBfFf9029",
    "WETH":  "0xefd4bC9afD210517803f293ABABd701CaeeCdfd0",
    "WHSK":  "0xB210D2120d57b758EE163cFfb43e73728c471Cf1",
    "stHSK": "0xD2fdDFf28A534300ae961c5435E16f9465253b76",
    "veHSK": "0xe1045155ee02e0997E6bB4509D854a306c50D914",
}

MOCK_TRANSACTIONS = [
    {"hash": "0xabc123", "from": "0x0000", "to": "0x1111",
     "value": 100.0, "timestamp": int(time.time()) - 3600,  "gas_used": 21000},
    {"hash": "0xdef456", "from": "0x0000", "to": "0x2222",
     "value": 50.0,  "timestamp": int(time.time()) - 7200,  "gas_used": 45000},
    {"hash": "0x789abc", "from": "0x3333", "to": "0x0000",
     "value": 200.0, "timestamp": int(time.time()) - 86400, "gas_used": 21000},
]


class WalletAnalyzer:
    def __init__(self):
        self.rpc_url = HASHKEY_RPC
        self.w3      = Web3(Web3.HTTPProvider(self.rpc_url))

    async def analyze(self, wallet_address: str) -> Dict:
        if not Web3.is_address(wallet_address):
            raise ValueError("Invalid wallet address")

        wallet_address  = Web3.to_checksum_address(wallet_address)
        balance_hsk     = await self.get_balance(wallet_address)
        transactions    = await self.get_transactions(wallet_address)
        tokens          = await self.get_token_balances(wallet_address)
        risk_profile    = self.calculate_risk_profile(transactions, balance_hsk)
        activity_level  = self.calculate_activity_level(transactions, balance_hsk)

        return {
            "wallet_address": wallet_address,
            "balance_hsk":    balance_hsk,
            "transactions":   transactions,
            "tokens":         tokens,
            "risk_profile":   risk_profile,
            "activity_level": activity_level,
            "total_tx_count": len(transactions),
            "chain":          "HashKey Chain",
            "chain_id":       177,
        }

    async def get_balance(self, wallet_address: str) -> float:
        try:
            wei = self.w3.eth.get_balance(wallet_address)
            return float(self.w3.from_wei(wei, "ether"))
        except Exception as e:
            print(f"Balance error: {e}")
            return 0.0

    async def get_transactions(self, wallet_address: str, limit: int = 10) -> List[Dict]:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                r = await client.get(
                    f"{BLOCKSCOUT_API}/addresses/{wallet_address}/transactions",
                    params={"filter": "to | from", "limit": limit},
                )
                if r.status_code == 200:
                    items = r.json().get("items", [])
                    result = []
                    for tx in items[:limit]:
                        val_raw = tx.get("value", "0") or "0"
                        try:
                            val_eth = float(self.w3.from_wei(int(val_raw), "ether"))
                        except Exception:
                            val_eth = 0.0
                        ts_raw = tx.get("timestamp", "")
                        try:
                            from datetime import datetime
                            ts = int(datetime.fromisoformat(ts_raw.replace("Z", "")).timestamp())
                        except Exception:
                            ts = int(time.time())
                        result.append({
                            "hash":      tx.get("hash", ""),
                            "from":      tx.get("from", {}).get("hash", ""),
                            "to":        (tx.get("to") or {}).get("hash", ""),
                            "value":     val_eth,
                            "timestamp": ts,
                            "gas_used":  int(tx.get("gas_used", 0) or 0),
                        })
                    return result
        except Exception as e:
            print(f"Tx fetch failed, using mock: {e}")
        return MOCK_TRANSACTIONS

    async def get_token_balances(self, wallet_address: str) -> Dict[str, float]:
        tokens: Dict[str, float] = {}
        for symbol, contract in HSK_TOKEN_CONTRACTS.items():
            try:
                sig  = self.w3.keccak(text="balanceOf(address)").hex()[:10]
                data = sig + wallet_address[2:].lower().zfill(64)
                raw  = self.w3.eth.call({"to": contract, "data": data})
                decimals = 6 if symbol == "USDT" else 18
                tokens[symbol] = int(raw.hex(), 16) / (10 ** decimals)
            except Exception:
                tokens[symbol] = 0.0
        return tokens

    def calculate_risk_profile(self, transactions: List[Dict], balance_hsk: float) -> str:
        if not transactions:
            return "conservative"
        n   = len(transactions)
        avg = sum(t["value"] for t in transactions) / n if n else 0
        if n > 50 and avg > 1000:
            return "aggressive"
        elif n > 10 or avg > 100:
            return "moderate"
        return "conservative"

    def calculate_activity_level(self, transactions: List[Dict], balance_hsk: float) -> str:
        n = len(transactions)
        if n > 100 or balance_hsk > 10000:
            return "whale"
        elif n > 10 or balance_hsk > 1000:
            return "active"
        return "new"
