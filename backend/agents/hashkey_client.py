"""
HashKey Chain Client
Handles Web3 interactions with HashKey Chain Mainnet (Chain ID: 177)
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

# HashKey Chain Mainnet constants
HASHKEY_RPC       = "https://mainnet.hsk.xyz"
HASHKEY_CHAIN_ID  = 177
HASHKEY_EXPLORER  = "https://hsk.blockscout.com"
HASHKEY_API       = "https://hsk.blockscout.com/api/v2"

# Known token addresses on HashKey Chain Mainnet
HSK_TOKENS = {
    "USDT":  "0xF1B50eD67A9e2CC94Ad3c477779E2d4cBfFf9029",
    "WETH":  "0xefd4bC9afD210517803f293ABABd701CaeeCdfd0",
    "WHSK":  "0xB210D2120d57b758EE163cFfb43e73728c471Cf1",
    "stHSK": "0xD2fdDFf28A534300ae961c5435E16f9465253b76",
    "veHSK": "0xe1045155ee02e0997E6bB4509D854a306c50D914",
}


def _retry_call(fn, *args, **kwargs):
    last_err = None
    for attempt in range(_MAX_RETRIES):
        try:
            return fn(*args, **kwargs)
        except Exception as e:
            last_err = e
            if attempt < _MAX_RETRIES - 1:
                time.sleep(_RETRY_DELAY * (2 ** attempt))
    raise last_err


class HashKeyClient:
    def __init__(self):
        self.rpc_url         = os.getenv("HASHKEY_RPC", HASHKEY_RPC)
        self.w3              = Web3(Web3.HTTPProvider(self.rpc_url))
        self.chain_id        = HASHKEY_CHAIN_ID
        self.explorer        = HASHKEY_EXPLORER
        self.api             = HASHKEY_API
        self.contract_address = os.getenv("CONTRACT_ADDRESS")
        self.contract_abi    = self._load_contract_abi()
        self.contract        = None

        if self.contract_address and self.contract_abi:
            self.contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(self.contract_address),
                abi=self.contract_abi
            )

    def _load_contract_abi(self) -> List:
        try:
            path = os.path.join(os.path.dirname(__file__), "..", "..", "contract", "deployed.json")
            if os.path.exists(path):
                with open(path, "r") as f:
                    return json.load(f).get("abi", [])
        except Exception as e:
            print(f"ABI load error: {e}")
        return []

    # ── Chain reads ────────────────────────────────────────────────────────────

    async def get_balance(self, address: str) -> float:
        try:
            wei = _retry_call(self.w3.eth.get_balance, address)
            return float(self.w3.from_wei(wei, "ether"))
        except Exception as e:
            print(f"Balance error: {e}")
            return 0.0

    async def get_gas_price(self) -> int:
        try:
            return _retry_call(lambda: self.w3.eth.gas_price)
        except Exception:
            return 10_000_000  # 0.01 gwei — HashKey is cheap

    async def get_block_number(self) -> int:
        try:
            return _retry_call(lambda: self.w3.eth.block_number)
        except Exception:
            return 0

    # ── Contract write ─────────────────────────────────────────────────────────

    async def log_consensus_to_contract(
        self,
        private_key: str,
        alpha_vote: int, alpha_signal: str, alpha_reason: str, alpha_conf: int,
        yield_vote: int, yield_signal: str, yield_reason: str,  yield_conf: int,
        guard_vote: int, guard_signal: str, guard_reason: str,  guard_conf: int,
        final_action: str,
    ) -> str:
        """Write the 3-agent consensus vote to HashMind.sol on HashKey Chain Mainnet."""
        if not self.contract:
            raise Exception("Contract not deployed")

        account = self.w3.eth.account.from_key(private_key)
        nonce      = _retry_call(self.w3.eth.get_transaction_count, account.address)
        gas_price  = _retry_call(lambda: self.w3.eth.gas_price)

        fn = self.contract.functions.logConsensusVotes(
            alpha_vote, alpha_signal[:50], alpha_reason[:300], alpha_conf,
            yield_vote, yield_signal[:50], yield_reason[:300], yield_conf,
            guard_vote, guard_signal[:50], guard_reason[:300], guard_conf,
            final_action[:100],
        )
        gas = fn.estimate_gas({"from": account.address})
        tx  = fn.build_transaction({
            "gas":      int(gas * 1.2),
            "gasPrice": gas_price,
            "nonce":    nonce,
            "chainId":  self.chain_id,
        })

        signed  = self.w3.eth.account.sign_transaction(tx, private_key)
        tx_hash = _retry_call(self.w3.eth.send_raw_transaction, signed.raw_transaction)
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)

        if receipt["status"] == 1:
            return tx_hash.hex()
        raise Exception("Transaction reverted")

    # ── Contract reads ─────────────────────────────────────────────────────────

    async def get_agent_stats(self) -> dict:
        try:
            if not self.contract:
                return self._default_stats()
            result = _retry_call(self.contract.functions.getAgentStats().call)
            name, version, owner, total, reputation, created = result
            return {
                "name": name, "version": version, "owner": owner,
                "total_consensus": total, "reputation_score": reputation,
                "created_at": created, "source": "on-chain",
            }
        except Exception as e:
            print(f"Agent stats error: {e}")
            return self._default_stats()

    async def get_total_consensus(self) -> int:
        try:
            if not self.contract:
                return 0
            return _retry_call(self.contract.functions.getTotalConsensus().call)
        except Exception:
            return 0

    def _default_stats(self) -> dict:
        return {
            "name": "HashMind", "version": "2.0.0",
            "owner": self.contract_address or "not deployed",
            "total_consensus": 0, "reputation_score": 80,
            "created_at": 0, "source": "default",
        }

    # ── Network info ───────────────────────────────────────────────────────────

    def explorer_tx(self, tx_hash: str) -> str:
        return f"{self.explorer}/tx/{tx_hash}"

    def explorer_address(self, address: str) -> str:
        return f"{self.explorer}/address/{address}"
