"""
Mantle Network Client
Handles Web3 interactions with Mantle Mainnet
"""

import json
import os
import time
from web3 import Web3
from typing import List, Dict
from dotenv import load_dotenv

load_dotenv()

_MAX_RETRIES = 3
_RETRY_DELAY = 1.0


def _retry_call(fn, *args, **kwargs):
    """Call fn with up to _MAX_RETRIES attempts, exponential backoff."""
    last_err = None
    for attempt in range(_MAX_RETRIES):
        try:
            return fn(*args, **kwargs)
        except Exception as e:
            last_err = e
            if attempt < _MAX_RETRIES - 1:
                time.sleep(_RETRY_DELAY * (2 ** attempt))
    raise last_err


class MantleClient:
    def __init__(self):
        self.rpc_url = os.getenv("MANTLE_RPC", "https://rpc.mantle.xyz")
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        self.chain_id = 5003 if "sepolia" in self.rpc_url.lower() else 5000
        self.contract_address = os.getenv("CONTRACT_ADDRESS")
        self.contract_abi = self._load_contract_abi()
        self.contract = None

        if self.contract_address and self.contract_abi:
            self.contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(self.contract_address),
                abi=self.contract_abi
            )

    def _load_contract_abi(self) -> List:
        try:
            contract_path = os.path.join(os.path.dirname(__file__), "..", "..", "contract", "deployed.json")
            if os.path.exists(contract_path):
                with open(contract_path, 'r') as f:
                    data = json.load(f)
                    return data.get("abi", [])
        except Exception as e:
            print(f"Error loading contract ABI: {str(e)}")
        return []

    async def get_balance(self, address: str) -> float:
        try:
            balance_wei = _retry_call(self.w3.eth.get_balance, address)
            return float(self.w3.from_wei(balance_wei, 'ether'))
        except Exception as e:
            print(f"Error getting balance: {str(e)}")
            return 0.0

    async def get_gas_price(self) -> int:
        try:
            return _retry_call(lambda: self.w3.eth.gas_price)
        except Exception as e:
            print(f"Error getting gas price: {str(e)}")
            return 20_000_000  # 0.02 gwei fallback

    async def get_block_number(self) -> int:
        try:
            return _retry_call(lambda: self.w3.eth.block_number)
        except Exception as e:
            print(f"Error getting block number: {str(e)}")
            return 0

    async def log_to_contract(self, private_key: str, action: str, reasoning: str, confidence: int) -> str:
        try:
            if not self.contract:
                raise Exception("Contract not deployed or not loaded")

            account = self.w3.eth.account.from_key(private_key)
            nonce = _retry_call(self.w3.eth.get_transaction_count, account.address)
            gas_price = _retry_call(lambda: self.w3.eth.gas_price)

            estimated_gas = self.contract.functions.logRecommendation(
                action, reasoning, confidence
            ).estimate_gas({"from": account.address})

            transaction = self.contract.functions.logRecommendation(
                action, reasoning, confidence
            ).build_transaction({
                'gas': int(estimated_gas * 1.2),
                'gasPrice': gas_price,
                'nonce': nonce,
                'chainId': self.chain_id
            })

            signed_txn = self.w3.eth.account.sign_transaction(transaction, private_key)
            tx_hash = _retry_call(self.w3.eth.send_raw_transaction, signed_txn.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

            if receipt['status'] == 1:
                return tx_hash.hex()
            else:
                raise Exception("Transaction failed")

        except Exception as e:
            print(f"Error logging to contract: {str(e)}")
            raise

    async def get_user_recommendations(self, wallet_address: str) -> List[Dict]:
        try:
            if not self.contract:
                return []

            wallet_address = Web3.to_checksum_address(wallet_address)
            recommendations = _retry_call(
                self.contract.functions.getUserRecommendations(wallet_address).call
            )

            return [
                {
                    "user": rec[0],
                    "action": rec[1],
                    "reasoning": rec[2],
                    "confidence": rec[3],
                    "timestamp": rec[4]
                }
                for rec in recommendations
            ]

        except Exception as e:
            print(f"Error getting user recommendations: {str(e)}")
            return []

    async def get_total_recommendations(self) -> int:
        try:
            if not self.contract:
                return 0
            return _retry_call(self.contract.functions.getTotalRecommendations().call)
        except Exception as e:
            print(f"Error getting total recommendations: {str(e)}")
            return 0

    async def get_agent_stats(self) -> dict:
        """Read agent identity + reputation directly from the deployed contract."""
        try:
            if not self.contract:
                return self._default_agent_stats()

            result = _retry_call(self.contract.functions.getAgentStats().call)
            name, version, owner, total_recs, reputation, created_at = result
            return {
                "name": name,
                "version": version,
                "owner": owner,
                "total_recommendations": total_recs,
                "reputation_score": reputation,
                "created_at": created_at,
                "source": "on-chain"
            }
        except Exception as e:
            print(f"Error getting agent stats: {e}")
            return self._default_agent_stats()

    def _default_agent_stats(self) -> dict:
        return {
            "name": "MantleMind",
            "version": "1.0.0",
            "owner": self.contract_address or "not deployed",
            "total_recommendations": 0,
            "reputation_score": 80,
            "created_at": 0,
            "source": "default"
        }

    async def get_meth_exchange_rate(self) -> dict:
        """
        Read mETH staking exchange rate directly from the mETH contract on Mantle.
        Uses ERC-4626 convertToAssets(1e18) pattern.
        Falls back to public baseline if call fails.
        """
        # mETH staking vault contract on Mantle mainnet
        METH_CONTRACT = "0xe3dbc4f88ee185163ee7b798c8b4e5de13fb6b05"
        CONVERT_SIG = self.w3.keccak(text="convertToAssets(uint256)").hex()[:10]

        try:
            amount_in = (1 * 10**18).to_bytes(32, 'big')
            data = CONVERT_SIG + amount_in.hex()
            raw = _retry_call(self.w3.eth.call, {
                "to": Web3.to_checksum_address(METH_CONTRACT),
                "data": data
            })
            assets = int(raw.hex(), 16)
            rate = assets / 10**18
            return {"rate": rate, "apy_hint": "3.5-4.5%", "source": "on-chain"}
        except Exception as e:
            print(f"mETH rate fallback: {e}")
            return {"rate": 1.035, "apy_hint": "3.5-4.5%", "source": "fallback"}
