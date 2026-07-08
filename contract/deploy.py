#!/usr/bin/env python3
"""
Deploy HashMind.sol to HashKey Chain Mainnet (Chain ID: 177)
"""

import os
import json
import sys
import time
import requests
from web3 import Web3
from solcx import compile_standard, install_solc
from dotenv import load_dotenv

load_dotenv()

CHAIN_ID      = 177
NETWORK_NAME  = "HashKey Chain Mainnet"
RPC_URL       = os.getenv("HASHKEY_RPC", "https://mainnet.hsk.xyz")
EXPLORER      = "https://hsk.blockscout.com"
EXPLORER_API  = "https://hsk.blockscout.com/api/v2"

print("Installing Solidity compiler v0.8.19...")
install_solc("0.8.19")

with open("HashMind.sol", "r") as f:
    solidity_source = f.read()

print("Compiling HashMind.sol...")
compiled_sol = compile_standard(
    {
        "language": "Solidity",
        "sources": {"HashMind.sol": {"content": solidity_source}},
        "settings": {
            "viaIR": True,
            "optimizer": {"enabled": True, "runs": 200},
            "outputSelection": {
                "*": {"*": ["abi", "metadata", "evm.bytecode", "evm.sourceMap"]}
            }
        },
    },
    solc_version="0.8.19",
)

bytecode = compiled_sol["contracts"]["HashMind.sol"]["HashMind"]["evm"]["bytecode"]["object"]
abi      = compiled_sol["contracts"]["HashMind.sol"]["HashMind"]["abi"]
print("✅ Compilation successful")

print(f"Connecting to {NETWORK_NAME}...")
w3 = Web3(Web3.HTTPProvider(RPC_URL))

if not w3.is_connected():
    print(f"❌ Failed to connect to {NETWORK_NAME}")
    sys.exit(1)

detected_chain = w3.eth.chain_id
print(f"✅ Connected — Chain ID: {detected_chain} (expected {CHAIN_ID}), Block: {w3.eth.block_number}")

if detected_chain != CHAIN_ID:
    print(f"⚠️  WARNING: Chain ID mismatch! Got {detected_chain}, expected {CHAIN_ID}. Check HASHKEY_RPC.")
    sys.exit(1)

private_key = os.getenv("DEPLOYER_PRIVATE_KEY")
if not private_key:
    print("❌ DEPLOYER_PRIVATE_KEY not found in .env")
    sys.exit(1)

account = w3.eth.account.from_key(private_key)
print(f"Deploying from: {account.address}")

balance = w3.eth.get_balance(account.address)
balance_hsk = float(w3.from_wei(balance, "ether"))
print(f"Balance: {balance_hsk:.4f} HSK")

if balance_hsk < 0.01:
    print("⚠️  WARNING: Low HSK balance. Deployment may fail.")

HashMindContract = w3.eth.contract(abi=abi, bytecode=bytecode)

print("Building deployment transaction...")
nonce     = w3.eth.get_transaction_count(account.address)
gas_price = w3.eth.gas_price
if gas_price < w3.to_wei(1, 'gwei'):
    gas_price = w3.to_wei(1, 'gwei')
print(f"Gas price: {w3.from_wei(gas_price, 'gwei'):.4f} Gwei")

transaction = HashMindContract.constructor().build_transaction({
    "gas":      4_000_000,
    "gasPrice": gas_price,
    "nonce":    nonce,
    "chainId":  CHAIN_ID,
})

print("Signing and sending transaction...")
signed_txn = w3.eth.account.sign_transaction(transaction, private_key)
tx_hash    = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
print(f"Transaction sent: {tx_hash.hex()}")

print("Waiting for confirmation...")
receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

if receipt["status"] != 1:
    print("❌ Deployment failed!")
    sys.exit(1)

contract_address = receipt.contractAddress
print("\n" + "="*60)
print("✅  HashMind DEPLOYED SUCCESSFULLY on HashKey Chain Mainnet")
print("="*60)
print(f"  Contract address : {contract_address}")
print(f"  Transaction hash : {tx_hash.hex()}")
print(f"  Block number     : {receipt.blockNumber}")
print(f"  Gas used         : {receipt.gasUsed}")
print(f"  Explorer         : {EXPLORER}/address/{contract_address}")
print("="*60 + "\n")

deployment_info = {
    "contract_address":  contract_address,
    "deployer_address":  account.address,
    "transaction_hash":  tx_hash.hex(),
    "block_number":      receipt.blockNumber,
    "chain_id":          CHAIN_ID,
    "network":           NETWORK_NAME,
    "explorer":          f"{EXPLORER}/address/{contract_address}",
    "abi":               abi,
}

with open("deployed.json", "w") as f:
    json.dump(deployment_info, f, indent=2)

print("Deployment info saved to contract/deployed.json")
print("Add to backend/.env:")
print(f"  CONTRACT_ADDRESS={contract_address}")
print(f"  HASHKEY_RPC={RPC_URL}")

# ── Contract Verification on HashKey Blockscout ───────────────────────────────
print("\nAttempting contract verification on HashKey Blockscout...")
COMPILER_VERSION = "v0.8.19+commit.7dd6d404"

try:
    v2_url  = f"{EXPLORER_API}/smart-contracts/{contract_address}/verification/via/flattened-code"
    payload = {
        "compiler_version":        COMPILER_VERSION,
        "license_type":            "mit",
        "source_code":             solidity_source,
        "contract_name":           "HashMind",
        "is_optimization_enabled": True,
        "optimization_runs":       200,
        "is_via_ir_enabled":       True,
        "evm_version":             "default",
    }
    resp = requests.post(v2_url, json=payload, timeout=30)
    if resp.status_code in (200, 201):
        print("✅ Verification submitted via Blockscout v2 API")
    else:
        raise Exception(f"HTTP {resp.status_code}: {resp.text[:200]}")
except Exception as e:
    print(f"⚠️  Auto-verification failed ({e})")
    print("   Manually verify at:")
    print(f"   {EXPLORER}/address/{contract_address}#code")

print(f"\nExplorer: {EXPLORER}/address/{contract_address}")
