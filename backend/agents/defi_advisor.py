"""
DeFi Advisor Agent
Uses Groq AI to provide personalized DeFi recommendations grounded in live
Mantle protocol data. Also implements agent_decide() for autonomous on-chain action.
"""

import json
import os
import re
from groq import Groq
from dotenv import load_dotenv
from typing import Dict, List, Optional, Tuple

from agents.defi_data import fetch_protocol_data, format_for_prompt

load_dotenv()

# Agent auto-executes recommendations above this confidence threshold
AGENT_CONFIDENCE_THRESHOLD = 75


class DeFiAdvisor:
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = "llama-3.3-70b-versatile"

    async def advise(self, wallet_data: Dict, user_question: Optional[str] = None) -> List[Dict]:
        """Generate AI DeFi recommendations grounded in live Mantle protocol data."""

        protocol_data = await fetch_protocol_data()
        protocol_context = format_for_prompt(protocol_data)

        system_prompt = f"""You are MantleMind, an autonomous AI DeFi advisor deployed on the Mantle Network. You analyze on-chain wallet data and generate specific, actionable DeFi recommendations grounded in real protocol data.

{protocol_context}

Key Mantle protocols you must reference by name:
- MNT Staking (native staking): Stake MNT to secure the network, earn 3-5% APY + veMNT governance boosts
- Merchant Moe (DEX): Best liquidity, active LP strategies
- Agni Finance (lending/borrowing, Aave V3 fork): Stable supply yields
- Fluxion (derivatives): Advanced structured products
- mETH (liquid staking): Earn ETH staking rewards while staying liquid

Format your response as a JSON array with exactly 3 recommendations. Each must have:
- action: string ≤50 chars — specific, imperative action ("Stake 50% ETH as mETH", not "consider staking")
- reasoning: string ≤200 chars — data-driven why, reference the actual APY or rate
- confidence: integer 0–100
- risk_level: "low", "medium", or "high"
- specific_protocol: exact protocol name
- estimated_apy: string like "3.8%" or "5–8%" or "" if N/A

Calibrate confidence honestly. Risk profile must match protocol type. Prioritize highest-confidence low-risk action first."""

        user_prompt = f"""Wallet analysis for {wallet_data.get('wallet_address', 'Unknown')}:

MNT Balance: {wallet_data.get('balance_mnt', 0):.4f} MNT
Transaction Count: {wallet_data.get('total_tx_count', 0)}
Risk Profile: {wallet_data.get('risk_profile', 'unknown')}
Activity Level: {wallet_data.get('activity_level', 'unknown')}
Token Balances: {json.dumps(wallet_data.get('tokens', {}), indent=2)}

{f"User question: {user_question}" if user_question else ""}

Generate 3 personalized, data-grounded DeFi recommendations. Return only the JSON array."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.6,
                max_tokens=1000,
            )

            content = response.choices[0].message.content.strip()

            # Robust JSON extraction: regex first, then strip fences
            json_match = re.search(r'\[[\s\S]*\]', content)
            if json_match:
                content = json_match.group(0)
            elif content.startswith("```json"):
                content = content[7:].rsplit("```", 1)[0].strip()
            elif content.startswith("```"):
                content = content[3:].rsplit("```", 1)[0].strip()

            recommendations = json.loads(content)
            return self._format(recommendations[:3])

        except Exception as e:
            print(f"Groq error: {e}")
            return self._fallback(protocol_data)

    async def agent_decide(
        self, wallet_data: Dict, recommendations: List[Dict]
    ) -> Tuple[Optional[Dict], str]:
        """
        Autonomous agent decision: pick the best recommendation to execute on-chain.
        Returns (chosen_recommendation, reasoning) or (None, reason_for_no_action).

        The agent applies the confidence threshold + risk suitability to decide
        whether to take autonomous action — no human approval needed.
        """
        if not recommendations:
            return None, "No recommendations available."

        eligible = [
            r for r in recommendations
            if r["confidence"] >= AGENT_CONFIDENCE_THRESHOLD
            and r["risk_level"] in ("low", "medium")
        ]

        if not eligible:
            top = max(recommendations, key=lambda r: r["confidence"])
            return None, (
                f"Highest confidence recommendation is {top['confidence']}% "
                f"(threshold: {AGENT_CONFIDENCE_THRESHOLD}%) or risk level is high. "
                f"Agent deferred to human review."
            )

        best = max(eligible, key=lambda r: r["confidence"])

        reasoning = (
            f"Agent selected '{best['action']}' via {best['specific_protocol']} "
            f"(confidence {best['confidence']}%, {best['risk_level']} risk"
            f"{', est. ' + best['estimated_apy'] + ' APY' if best['estimated_apy'] else ''}). "
            f"Wallet profile: {wallet_data.get('risk_profile', 'unknown')} risk, "
            f"{wallet_data.get('activity_level', 'unknown')} activity."
        )

        return best, reasoning

    async def ask(self, question: str, wallet_data: Optional[Dict] = None) -> str:
        """
        Conversational Q&A — answers a natural language question about Mantle DeFi.
        Covers real user pain points: IL, liquidation risk, yield comparison,
        veMNT, rebalancing, gas, bridging, new user onboarding, and more.
        Returns a plain-text conversational answer (not JSON).
        """
        protocol_data = await fetch_protocol_data()
        protocol_context = format_for_prompt(protocol_data)

        wallet_context = ""
        if wallet_data:
            wallet_context = f"""
The user's wallet context:
- Address: {wallet_data.get('wallet_address', 'unknown')}
- MNT Balance: {wallet_data.get('balance_mnt', 0):.4f} MNT
- Risk Profile: {wallet_data.get('risk_profile', 'unknown')}
- Activity Level: {wallet_data.get('activity_level', 'unknown')}
- Tx Count: {wallet_data.get('total_tx_count', 0)}
- Token Balances: {json.dumps(wallet_data.get('tokens', {}), indent=2)}
"""

        system_prompt = f"""You are MantleMind, an expert AI advisor for the Mantle Network DeFi ecosystem. You answer user questions conversationally, clearly, and concisely.

{protocol_context}

You are an expert on these real user pain points on Mantle:
1. Impermanent Loss (IL) — how it works in Merchant Moe LPs, when it hurts vs. helps
2. Liquidation Risk — Agni Finance health factor, safe collateral ratios, how to avoid liquidation
3. Yield Comparison — how to fairly compare mETH APY vs MNT staking vs Agni supply APY after risk
4. veMNT Governance — lock duration, boost multipliers, governance voting power, whether it's worth it
5. Portfolio Rebalancing — when to take profits, how to rebalance MNT/ETH/stablecoins
6. Gas Optimization — when gas is cheapest on Mantle, how to batch transactions
7. Bridging — cheapest routes to move assets to Mantle, official bridge vs aggregators
8. New User Onboarding — best first steps with 100 MNT, how to start earning safely
9. mETH vs Native Staking — tradeoffs, liquidity, slashing risk, compounding differences
10. DeFi Tax Tracking — which transactions are taxable events, tools for tracking

{wallet_context}

Answer the user's question in 2-4 sentences. Be specific, cite actual APYs or rates when relevant. Do not give generic advice — always anchor to Mantle protocols. If you don't know something specific, say so honestly."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": question},
                ],
                temperature=0.5,
                max_tokens=400,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Groq ask error: {e}")
            return "I'm having trouble connecting right now. Please try again in a moment."

    def _format(self, recs: List[Dict]) -> List[Dict]:
        return [
            {
                "action": rec.get("action", "Review your portfolio")[:50],
                "reasoning": rec.get("reasoning", "Based on wallet activity")[:200],
                "confidence": min(100, max(0, int(rec.get("confidence", 70)))),
                "risk_level": rec.get("risk_level", "medium"),
                "specific_protocol": rec.get("specific_protocol", "Mantle Ecosystem"),
                "estimated_apy": rec.get("estimated_apy", ""),
            }
            for rec in recs
        ]

    def _fallback(self, protocol_data: Dict) -> List[Dict]:
        meth_apy = protocol_data.get("meth", {}).get("staking_apy", "3.8%")
        agni_apy = protocol_data.get("agni_finance", {}).get("usdt_supply_apy", "3–8%")
        mnt_apy = protocol_data.get("mnt_staking", {}).get("staking_apy", "3–5%")
        return [
            {
                "action": "Stake MNT natively on Mantle",
                "reasoning": f"MNT native staking offers {mnt_apy} APY plus veMNT governance boosts. Native protocol yield that secures the network.",
                "confidence": 82,
                "risk_level": "low",
                "specific_protocol": "MNT Staking",
                "estimated_apy": mnt_apy,
            },
            {
                "action": "Stake ETH as mETH on Mantle",
                "reasoning": f"mETH liquid staking offers ~{meth_apy} APY with no lockup. Your ETH keeps working while you stay liquid on Mantle.",
                "confidence": 78,
                "risk_level": "low",
                "specific_protocol": "mETH",
                "estimated_apy": meth_apy,
            },
            {
                "action": "Supply USDT to Agni Finance",
                "reasoning": f"Agni Finance (Aave V3) offers {agni_apy} on USDT supply. Lowest-risk yield for stablecoin holders on Mantle.",
                "confidence": 75,
                "risk_level": "low",
                "specific_protocol": "Agni Finance",
                "estimated_apy": agni_apy,
            },
        ]
