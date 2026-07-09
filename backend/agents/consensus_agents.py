"""
HashMind Triple-Agent Consensus System
Three specialist AI agents independently analyse the market and cast votes.
Consensus (2-of-3 EXECUTE) is required before any signal fires.

Agents:
  AlphaAgent  — Technical/market signal from live HashKey Chain on-chain data
  YieldAgent  — Protocol yield optimisation (stHSK, veHSK, WoofSwap)
  GuardAgent  — Risk assessment, portfolio sizing, position safety

Each agent returns:
  {
    "agent":      str,          # agent display name
    "vote":       "EXECUTE" | "DEFER" | "REJECT",
    "confidence": int (0-100),
    "signal":     str (≤50 chars),  # short label for on-chain storage
    "reasoning":  str (≤300 chars), # full reasoning
    "details":    str,              # longer markdown for UI
  }
"""

import os
import re
import json
import httpx
from groq import Groq
from dotenv import load_dotenv
from typing import Dict, List, Optional, Tuple

from agents.hsk_data import (
    fetch_protocol_data,
    format_for_prompt,
    get_market_signal_context,
    get_yield_context,
)

load_dotenv()

CONFIDENCE_THRESHOLD = 70   # minimum confidence for EXECUTE vote to be counted


class ConsensusAgents:
    def __init__(self):
        self.groq_client   = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.groq_model    = "llama-3.3-70b-versatile"
        venice_key = os.getenv("VENICE_API_KEY", "")
        self.venice_api_key = venice_key
        self.venice_base    = "https://api.venice.ai/api/v1"
        self.venice_model   = "llama-3.3-70b"
        self.client = self.groq_client   # default for shared helpers
        self.model  = self.groq_model

    # ── Public API ─────────────────────────────────────────────────────────────

    async def run_consensus(
        self,
        wallet_data: Dict,
        user_question: Optional[str] = None,
    ) -> Dict:
        """
        Run all 3 agents in sequence, compute consensus, return full result.
        Returns:
          {
            "alpha":   agent_vote_dict,
            "yield":   agent_vote_dict,
            "guard":   agent_vote_dict,
            "consensus_reached": bool,
            "final_action": str,
            "aggregated_confidence": int,
            "execute_count": int,
            "reasoning_summary": str,
          }
        """
        protocol_data = await fetch_protocol_data()

        alpha = await self._run_alpha_agent(wallet_data, protocol_data, user_question)
        yield_ = await self._run_yield_agent(wallet_data, protocol_data, user_question)
        guard = await self._run_guard_agent(wallet_data, protocol_data, alpha, yield_)

        execute_count = sum(
            1 for v in [alpha, yield_, guard] if v["vote"] == "EXECUTE"
        )
        consensus_reached = execute_count >= 2
        agg_conf = (alpha["confidence"] + yield_["confidence"] + guard["confidence"]) // 3

        # Determine final action from the highest-confidence EXECUTE vote
        final_action = "DEFERRED — Agents could not reach consensus"
        if consensus_reached:
            execute_votes = [v for v in [alpha, yield_, guard] if v["vote"] == "EXECUTE"]
            best = max(execute_votes, key=lambda v: v["confidence"])
            final_action = best["signal"]

        reasoning_summary = self._build_summary(alpha, yield_, guard, consensus_reached, agg_conf)

        return {
            "alpha":                alpha,
            "yield":                yield_,
            "guard":                guard,
            "consensus_reached":    consensus_reached,
            "final_action":         final_action,
            "aggregated_confidence": agg_conf,
            "execute_count":        execute_count,
            "reasoning_summary":    reasoning_summary,
        }

    async def ask(self, question: str, wallet_data: Optional[Dict] = None) -> Tuple[str, str]:
        """Conversational Q&A about HashKey Chain DeFi — powered by Venice AI.
        Returns (answer, provider) tuple."""
        protocol_data = await fetch_protocol_data()
        context = format_for_prompt(protocol_data)
        wallet_ctx = self._wallet_context(wallet_data)

        system = f"""You are HashMind, an expert AI advisor for the HashKey Chain DeFi ecosystem.
You specialise in HSK staking, stHSK liquid staking, veHSK governance, WoofSwap liquidity, and HashKey Chain DeFi.

{context}

{wallet_ctx}

Answer in 2-4 sentences. Be specific. Reference actual APYs and protocols. If unsure, say so."""

        # Try Venice AI first (uncensored, no filter on financial advice)
        if self.venice_api_key:
            try:
                content = await self._call_venice(system, question, max_tokens=400, temperature=0.5)
                if content:
                    return content, "venice-uncensored"
            except Exception as e:
                print(f"Venice ask error (falling back to Groq): {e}")

        # Fallback: Groq
        try:
            r = self.groq_client.chat.completions.create(
                model=self.groq_model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user",   "content": question},
                ],
                temperature=0.5,
                max_tokens=400,
                timeout=25,
            )
            return r.choices[0].message.content.strip(), "groq-llama3"
        except Exception as e:
            print(f"Ask error: {e}")
            return "I'm having trouble connecting right now. Please try again.", "none"

    # ── Agent Runners ──────────────────────────────────────────────────────────

    async def _run_alpha_agent(
        self,
        wallet_data: Dict,
        protocol_data: Dict,
        user_question: Optional[str],
    ) -> Dict:
        """
        AlphaAgent: Technical + market signal
        Reads live HashKey Chain metrics (tx volume, gas, address growth)
        and generates a EXECUTE/DEFER/REJECT signal for the overall market condition.
        """
        market_ctx = get_market_signal_context(protocol_data)
        wallet_ctx = self._wallet_context(wallet_data)

        system = f"""You are AlphaAgent — a technical market analyst specialised in HashKey Chain.
You analyse on-chain network health and market momentum to decide if NOW is a good time to execute a DeFi strategy.

{market_ctx}

Evaluate:
1. Network activity (tx volume today vs baseline of 46,000/day)
2. Gas costs (baseline 0.01 gwei — exceptionally cheap)
3. Address growth momentum
4. Whether market conditions favour entry or waiting

Return ONLY a JSON object with these exact fields:
{{
  "vote": "EXECUTE" or "DEFER" or "REJECT",
  "confidence": integer 0-100,
  "signal": string ≤50 chars (e.g. "BULLISH — Network activity +23% today"),
  "reasoning": string ≤300 chars,
  "details": string (2-3 sentences for the UI)
}}

Be honest. DEFER if data is inconclusive. REJECT if conditions are clearly bad."""

        user = f"""Wallet: {wallet_data.get('wallet_address','unknown')}
HSK Balance: {wallet_data.get('balance_hsk', 0):.4f} HSK
Risk Profile: {wallet_data.get('risk_profile','unknown')}
{f"User question context: {user_question}" if user_question else ""}

Cast your AlphaAgent vote now."""

        return await self._call_agent("AlphaAgent", system, user, fallback_vote="DEFER", use_venice=True)

    async def _run_yield_agent(
        self,
        wallet_data: Dict,
        protocol_data: Dict,
        user_question: Optional[str],
    ) -> Dict:
        """
        YieldAgent: Protocol yield optimisation
        Analyses stHSK APY, veHSK boost, WoofSwap pools, and recommends the
        best yield action for the wallet's profile.
        """
        yield_ctx = get_yield_context(protocol_data)
        wallet_ctx = self._wallet_context(wallet_data)

        system = f"""You are YieldAgent — a yield optimisation specialist for HashKey Chain DeFi.
You analyse staking and liquidity opportunities and decide the single best yield action for a wallet.

{yield_ctx}

Protocols you can recommend:
- stHSK: Liquid staking of HSK, 6-10% APY, no lockup
- veHSK: Lock HSK for up to 4× boost on stHSK yields + governance
- WoofSwap: Provide HSK/USDT or HSK/WETH liquidity, 5-30% fee APY (IL risk)
- HSK Native Staking: 5-8% APY, direct protocol staking

Return ONLY a JSON object:
{{
  "vote": "EXECUTE" or "DEFER" or "REJECT",
  "confidence": integer 0-100,
  "signal": string ≤50 chars (e.g. "STAKE HSK as stHSK — 8% APY"),
  "reasoning": string ≤300 chars,
  "details": string (2-3 sentences for the UI)
}}

EXECUTE if there's a clear superior yield action. DEFER if portfolio is already optimally positioned. REJECT if risk/reward is unfavourable."""

        user = f"""Wallet: {wallet_data.get('wallet_address','unknown')}
HSK Balance: {wallet_data.get('balance_hsk', 0):.4f} HSK
stHSK Balance: {wallet_data.get('tokens', {}).get('stHSK', 0):.4f}
veHSK Balance: {wallet_data.get('tokens', {}).get('veHSK', 0):.4f}
Risk Profile: {wallet_data.get('risk_profile','unknown')}
Activity Level: {wallet_data.get('activity_level','unknown')}
{f"User question context: {user_question}" if user_question else ""}

Cast your YieldAgent vote now."""

        return await self._call_agent("YieldAgent", system, user, fallback_vote="DEFER", use_venice=True)

    async def _run_guard_agent(
        self,
        wallet_data: Dict,
        protocol_data: Dict,
        alpha_result: Dict,
        yield_result: Dict,
    ) -> Dict:
        """
        GuardAgent: Risk assessment and position safety
        Reviews Alpha + Yield votes and independently assesses whether it is
        safe to proceed. Acts as the final safeguard.
        """
        system = """You are GuardAgent — the risk management specialist for HashKey Chain DeFi.
You review the other two agents' votes and independently assess execution safety.

Your job: protect the wallet from bad outcomes. You are the last line of defence.

Evaluate:
1. Wallet balance vs proposed action size (never recommend more than 50% of balance)
2. Risk profile match (conservative = low risk only, aggressive = can take medium risk)
3. Whether AlphaAgent + YieldAgent signals are internally consistent
4. Potential downsides (IL risk, lock-up periods, smart contract risk)

Return ONLY a JSON object:
{
  "vote": "EXECUTE" or "DEFER" or "REJECT",
  "confidence": integer 0-100,
  "signal": string ≤50 chars (e.g. "SAFE TO PROCEED — 30% position size"),
  "reasoning": string ≤300 chars,
  "details": string (2-3 sentences for the UI)
}

EXECUTE if the proposed action is safe and well-sized. DEFER for minor concerns. REJECT for serious risk."""

        alpha_summary = f"AlphaAgent: {alpha_result['vote']} ({alpha_result['confidence']}%) — {alpha_result['signal']}"
        yield_summary = f"YieldAgent: {yield_result['vote']} ({yield_result['confidence']}%) — {yield_result['signal']}"

        user = f"""Wallet: {wallet_data.get('wallet_address','unknown')}
HSK Balance: {wallet_data.get('balance_hsk', 0):.4f} HSK
Risk Profile: {wallet_data.get('risk_profile','unknown')}
Activity Level: {wallet_data.get('activity_level','unknown')}
Tx Count: {wallet_data.get('total_tx_count', 0)}

Peer Agent Votes:
  {alpha_summary}
  {yield_summary}

Cast your GuardAgent risk assessment vote now."""

        return await self._call_agent("GuardAgent", system, user, fallback_vote="DEFER", use_venice=True)

    # ── Internal helpers ───────────────────────────────────────────────────────

    async def _call_agent(
        self,
        agent_name: str,
        system: str,
        user: str,
        fallback_vote: str = "DEFER",
        use_venice: bool = False,
    ) -> Dict:
        try:
            content = None
            # Use Venice AI when available
            if use_venice and self.venice_api_key:
                try:
                    content = await self._call_venice(system, user, max_tokens=500, temperature=0.4)
                except Exception as ve:
                    print(f"{agent_name} Venice error (falling back to Groq): {ve}")
                    content = None
            if not content:
                r = self.groq_client.chat.completions.create(
                    model=self.groq_model,
                    messages=[
                        {"role": "system", "content": system},
                        {"role": "user",   "content": user},
                    ],
                    temperature=0.4,
                    max_tokens=500,
                    timeout=25,
                )
                content = r.choices[0].message.content.strip()

            # Robust JSON extraction
            match = re.search(r'\{[\s\S]*\}', content)
            if match:
                content = match.group(0)
            elif content.startswith("```json"):
                content = content[7:].rsplit("```", 1)[0].strip()
            elif content.startswith("```"):
                content = content[3:].rsplit("```", 1)[0].strip()

            parsed = json.loads(content)
            vote = str(parsed.get("vote", fallback_vote)).upper()
            if vote not in ("EXECUTE", "DEFER", "REJECT"):
                vote = fallback_vote

            conf = min(100, max(0, int(parsed.get("confidence", 65))))
            provider = "venice-uncensored" if (use_venice and self.venice_api_key and content) else "groq-llama3"

            return {
                "agent":      agent_name,
                "vote":       vote,
                "confidence": conf,
                "signal":     str(parsed.get("signal", "No signal"))[:50],
                "reasoning":  str(parsed.get("reasoning", ""))[:300],
                "details":    str(parsed.get("details", "")),
                "provider":   provider,
            }

        except Exception as e:
            print(f"{agent_name} error: {e}")
            return self._fallback_vote(agent_name, fallback_vote)

    async def _call_venice(self, system: str, user: str, max_tokens: int = 400, temperature: float = 0.5) -> Optional[str]:
        """Call Venice AI via httpx (avoids OpenAI pydantic parsing errors)."""
        if not self.venice_api_key:
            return None
        headers = {
            "Authorization": f"Bearer {self.venice_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.venice_model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user",   "content": user},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(
                f"{self.venice_base}/chat/completions",
                headers=headers,
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()

    def _fallback_vote(self, agent_name: str, vote: str) -> Dict:
        return {
            "agent":      agent_name,
            "vote":       vote,
            "confidence": 60,
            "signal":     f"{vote} — agent temporarily unavailable",
            "reasoning":  "AI provider unavailable. Defaulting to DEFER for safety.",
            "details":    "Agent is temporarily offline. Please retry.",
        }

    def _wallet_context(self, wallet_data: Optional[Dict]) -> str:
        if not wallet_data:
            return ""
        tokens = wallet_data.get("tokens", {})
        return (
            f"Wallet context:\n"
            f"  HSK: {wallet_data.get('balance_hsk', 0):.4f}\n"
            f"  stHSK: {tokens.get('stHSK', 0):.4f}\n"
            f"  veHSK: {tokens.get('veHSK', 0):.4f}\n"
            f"  USDT: {tokens.get('USDT', 0):.2f}\n"
            f"  Risk: {wallet_data.get('risk_profile','unknown')}\n"
            f"  Activity: {wallet_data.get('activity_level','unknown')}"
        )

    def _build_summary(
        self,
        alpha: Dict,
        yield_: Dict,
        guard: Dict,
        consensus_reached: bool,
        agg_conf: int,
    ) -> str:
        status = "✅ CONSENSUS REACHED" if consensus_reached else "⏸ DEFERRED — no consensus"
        votes_str = (
            f"AlphaAgent: {alpha['vote']} ({alpha['confidence']}%) | "
            f"YieldAgent: {yield_['vote']} ({yield_['confidence']}%) | "
            f"GuardAgent: {guard['vote']} ({guard['confidence']}%)"
        )
        return f"{status} | Confidence: {agg_conf}% | {votes_str}"
