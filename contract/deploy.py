#!/usr/bin/env python3
"""
Deploy script for MantleMind smart contract on Mantle Mainnet
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

print("Installing Solidity compiler v0.8.19...")
install_solc('0.8.19')

with open('MantleMind.sol', 'r') as f:
    solidity_source = f.read()

print("Compiling MantleMind.sol...")
compiled_sol = compile_standard(
    {
        "language": "Solidity",
        "sources": {"MantleMind.sol": {"content": solidity_source}},
        "settings": {
            "outputSelection": {
                "*": {
                    "*": ["abi", "metadata", "evm.bytecode", "evm.sourceMap"]
                }
            }
        },
    },
    solc_version="0.8.19",
)

bytecode = compiled_sol["contracts"]["MantleMind.sol"]["MantleMind"]["evm"]["bytecode"]["object"]
abi = compiled_sol["contracts"]["MantleMind.sol"]["MantleMind"]["abi"]
print("✅ Compilation successful")

print("Connecting to Mantle Mainnet...")
rpc_url = os.getenv("MANTLE_RPC", "https://rpc.mantle.xyz")
w3 = Web3(Web3.HTTPProvider(rpc_url))

# Auto-detect chain ID: mainnet=5000, testnet (Sepolia)=5003
CHAIN_ID = 5003 if "sepolia" in rpc_url.lower() else 5000
NETWORK_NAME = "Mantle Testnet" if CHAIN_ID == 5003 else "Mantle Mainnet"

if not w3.is_connected():
    print("❌ Failed to connect to Mantle Mainnet")
    sys.exit(1)

print(f"✅ Connected — Chain ID: {w3.eth.chain_id} (expected {CHAIN_ID}), Block: {w3.eth.block_number}")
print(f"   Network: {NETWORK_NAME}")
if w3.eth.chain_id != CHAIN_ID:
    print(f"⚠️  WARNING: RPC chain_id ({w3.eth.chain_id}) != expected ({CHAIN_ID}). Check your MANTLE_RPC.")

private_key = os.getenv("DEPLOYER_PRIVATE_KEY")
if not private_key:
    print("❌ DEPLOYER_PRIVATE_KEY not found in .env")
    sys.exit(1)

account = w3.eth.account.from_key(private_key)
print(f"Deploying from: {account.address}")

balance = w3.eth.get_balance(account.address)
print(f"Balance: {w3.from_wei(balance, 'ether')} MNT")

if balance < w3.to_wei(0.01, 'ether'):
    print("⚠️  WARNING: Low balance. Deployment may fail.")

MantleMindContract = w3.eth.contract(abi=abi, bytecode=bytecode)

print("Building deployment transaction...")
nonce = w3.eth.get_transaction_count(account.address)
gas_price = w3.eth.gas_price

transaction = MantleMindContract.constructor().build_transaction({
    'gas': 2000000,
    'gasPrice': gas_price,
    'nonce': nonce,
    'chainId': CHAIN_ID
})

print("Signing and sending transaction...")
signed_txn = w3.eth.account.sign_transaction(transaction, private_key)
tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
print(f"Transaction sent: {tx_hash.hex()}")

print("Waiting for confirmation...")
tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=300)

if tx_receipt['status'] != 1:
    print("❌ Deployment failed!")
    sys.exit(1)

contract_address = tx_receipt.contractAddress
print("\n" + "="*60)
print("✅  CONTRACT DEPLOYED SUCCESSFULLY")
print("="*60)
print(f"  Contract address : {contract_address}")
print(f"  Transaction hash : {tx_hash.hex()}")
print(f"  Block number     : {tx_receipt.blockNumber}")
print(f"  Gas used         : {tx_receipt.gasUsed}")
print(f"  Explorer         : https://explorer.mantle.xyz/address/{contract_address}")
print("="*60 + "\n")

deployment_info = {
    "contract_address": contract_address,
    "deployer_address": account.address,
    "transaction_hash": tx_hash.hex(),
    "block_number": tx_receipt.blockNumber,
    "chain_id": CHAIN_ID,
    "network": NETWORK_NAME,
    "abi": abi
}

with open('deployed.json', 'w') as f:
    json.dump(deployment_info, f, indent=2)

print("Deployment info saved to contract/deployed.json")
print("Add this to backend/.env:")
print(f"  CONTRACT_ADDRESS={contract_address}")

# ── Contract Verification on Mantle Explorer (Blockscout) ─────────────────────
print("\nAttempting contract verification on Mantle Explorer...")

COMPILER_VERSION = "v0.8.19+commit.7dd6d404"
EXPLORER_API = "https://explorer.mantle.xyz/api"

verified = False

# Try Blockscout v2 API first
try:
    v2_url = f"https://explorer.mantle.xyz/api/v2/smart-contracts/{contract_address}/verification/via/flattened-code"
    payload = {
        "compiler_version": COMPILER_VERSION,
        "license_type": "mit",
        "source_code": solidity_source,
        "contract_name": "MantleMind",
        "is_optimization_enabled": False,
        "optimization_runs": 200,
        "evm_version": "default"
    }
    resp = requests.post(v2_url, json=payload, timeout=30)
    if resp.status_code in (200, 201):
        verified = True
        print("✅ Verification submitted via Blockscout v2 API")
    else:
        raise Exception(f"HTTP {resp.status_code}: {resp.text[:200]}")
except Exception as e1:
    # Fallback to Blockscout legacy API
    try:
        params = {
            "module": "contract",
            "action": "verifysourcecode",
            "addressHash": contract_address,
            "name": "MantleMind",
            "compilerVersion": COMPILER_VERSION,
            "optimization": "0",
            "contractSourceCode": solidity_source,
        }
        resp = requests.post(EXPLORER_API, data=params, timeout=30)
        data = resp.json()
        if data.get("status") == "1":
            verified = True
            guid = data.get("result", "N/A")
            print(f"✅ Verification submitted via legacy API (GUID: {guid})")
        else:
            raise Exception(data.get("message", "Unknown error"))
    except Exception as e2:
        print(f"⚠️  Auto-verification failed ({e2})")
        print("   Manually verify at:")
        print(f"   https://explorer.mantle.xyz/address/{contract_address}#code")
        print(f"   Compiler: {COMPILER_VERSION} | Optimization: disabled | License: MIT")

if verified:
    # Give explorer a moment to index, then confirm
    print("   Waiting 15s for explorer to index...")
    time.sleep(15)
    check = requests.get(f"{EXPLORER_API}/v2/smart-contracts/{contract_address}", timeout=10)
    if check.status_code == 200 and check.json().get("is_verified"):
        print(f"✅ VERIFIED on Mantle Explorer")
    else:
        print(f"   Verification may still be processing — check:")
        print(f"   https://explorer.mantle.xyz/address/{contract_address}#code")

print("\n" + "="*60)
print(f"  Explorer: https://explorer.mantle.xyz/address/{contract_address}")
print("="*60)
