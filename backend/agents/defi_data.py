"""
Live DeFi Protocol Data
Fetches real-time APY, TVL, and market data from Mantle ecosystem protocols.
Falls back gracefully to known baseline values so the AI always has context.
"""

import httpx
from typing import Dict

# Reliable baseline values derived from public docs / audit reports
_FALLBACK = {
    "merchant_moe": {
        "name": "Merchant Moe",
        "type": "DEX (Liquidity Book AMM)",
        "tvl_usd": "~$50M+",
        "fee_apy_range": "5–30%",
        "pairs": "MNT/USDT, MNT/WETH, USDT/USDC",
        "note": "Concentrated liquidity — higher APY with active management",
    },
    "agni_finance": {
        "name": "Agni Finance",
        "type": "Lending (Aave V3 fork)",
        "usdt_supply_apy": "3–8%",
        "usdc_supply_apy": "3–8%",
        "mnt_borrow_apy": "5–12%",
        "tvl_usd": "~$30M+",
        "note": "Stable supply is safest; borrow rates fluctuate with utilization",
    },
    "meth": {
        "name": "mETH Protocol",
        "type": "Liquid Staking",
        "staking_apy": "3.8%",
        "exchange_rate": "1 mETH ≈ 1.04 ETH",
        "tvl_usd": "~$1.5B",
        "note": "No lockup — stake ETH, receive mETH, use mETH in DeFi",
    },
    "fluxion": {
        "name": "Fluxion",
        "type": "Derivatives / Structured Products",
        "note": "Options and structured yield strategies on Mantle",
    },
    "mnt_staking": {
        "name": "MNT Staking",
        "type": "Native Staking",
        "staking_apy": "3-5%",
        "vemnt_rewards": "Up to 10% APY",
        "tvl_usd": "~$200M+",
        "note": "Stake MNT natively to secure the network and earn rewards. veMNT boosts governance power and yield.",
    },
}


async def fetch_protocol_data() -> Dict:
    """
    Attempt to fetch live protocol data from public APIs.
    Always returns a complete dict — never raises.
    """
    data = {k: dict(v) for k, v in _FALLBACK.items()}

    async with httpx.AsyncClient(timeout=4.0) as client:
        # ── mETH live APY ──────────────────────────────────────────────────────
        try:
            r = await client.get("https://meth.mantle.xyz/api/v1/stats")
            if r.status_code == 200:
                d = r.json()
                if "apy" in d:
                    data["meth"]["staking_apy"] = f"{float(d['apy']):.2f}%"
                if "exchangeRate" in d:
                    data["meth"]["exchange_rate"] = f"1 mETH ≈ {float(d['exchangeRate']):.4f} ETH"
        except Exception:
            pass

        # ── Merchant Moe via their public analytics endpoint ──────────────────
        try:
            r = await client.get(
                "https://api.merchantmoe.com/v1/overview",
                headers={"Accept": "application/json"},
            )
            if r.status_code == 200:
                d = r.json()
                if d.get("tvl"):
                    data["merchant_moe"]["tvl_usd"] = f"${d['tvl']:,.0f}"
                if d.get("volume24h"):
                    data["merchant_moe"]["volume_24h_usd"] = f"${d['volume24h']:,.0f}"
        except Exception:
            pass

        # ── Agni Finance supply rates via their public API ────────────────────
        try:
            r = await client.get("https://api.agni.finance/v1/rates")
            if r.status_code == 200:
                d = r.json()
                for asset in d.get("assets", []):
                    sym = asset.get("symbol", "").upper()
                    apy = asset.get("supplyAPY")
                    if sym == "USDT" and apy:
                        data["agni_finance"]["usdt_supply_apy"] = f"{float(apy):.2f}%"
                    elif sym == "USDC" and apy:
                        data["agni_finance"]["usdc_supply_apy"] = f"{float(apy):.2f}%"
        except Exception:
            pass

    return data


def format_for_prompt(protocol_data: Dict) -> str:
    """Format protocol data into a concise string for the AI system prompt."""
    lines = ["Current Mantle DeFi Protocol Data (live or latest known):"]
    for key, p in protocol_data.items():
        lines.append(f"\n{p['name']} ({p['type']}):")
        for k, v in p.items():
            if k not in ("name", "type"):
                lines.append(f"  • {k.replace('_', ' ').title()}: {v}")
    return "\n".join(lines)
