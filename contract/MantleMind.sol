// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title  MantleMind
 * @notice Autonomous AI DeFi Advisor — Turing Test Hackathon 2026
 *
 * Three defining features implemented:
 *   1. On-chain AI benchmarking  — every recommendation is a permanent, auditable record
 *   2. ERC-8004 Agent Identity   — AgentMinted event on deploy; agent stats queryable on-chain
 *   3. Radical transparency      — ReputationUpdated event emitted on every decision
 *
 * Reputation model: agent reputation = rolling average confidence of last 20 recommendations.
 * As the agent logs more decisions, its on-chain track record grows — verifiable by anyone.
 */
contract MantleMind {

    // ─── ERC-8004 Inspired: Agent Identity ───────────────────────────────────

    struct AgentIdentity {
        string  name;
        string  version;
        address owner;
        uint256 createdAt;
        uint256 totalRecommendations;
        uint256 reputationScore;     // 0–100, rolling avg of last 20 confidence scores
    }

    AgentIdentity public agentIdentity;

    // Rolling window for reputation calculation (last 20 confidence values)
    uint256[20] private _recentConf;
    uint8  private _confIdx;   // next write slot (wraps at 20)
    uint8  private _confCount; // filled slots (caps at 20)

    // ─── Recommendations ─────────────────────────────────────────────────────

    struct Recommendation {
        address user;
        string  action;
        string  reasoning;
        uint256 confidence;
        uint256 timestamp;
    }

    mapping(address => Recommendation[]) public userRecommendations;
    Recommendation[]                     public allRecommendations;

    // ─── Events ──────────────────────────────────────────────────────────────

    /// @dev ERC-8004: emitted when the AI agent identity is registered on-chain
    event AgentMinted(
        address indexed owner,
        string  name,
        string  version,
        uint256 timestamp
    );

    /// @dev Emitted for every AI recommendation logged on Mantle
    event AIRecommendation(
        address indexed user,
        string  action,
        string  reasoning,
        uint256 confidence,
        uint256 timestamp
    );

    /// @dev High-level agent decision signal — useful for indexers and dashboards
    event AgentDecision(
        address indexed user,
        string  decisionType,
        uint256 timestamp
    );

    /// @dev Emitted whenever the agent's on-chain reputation score changes
    event ReputationUpdated(
        uint256 newScore,
        uint256 totalRecommendations,
        uint256 timestamp
    );

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor() {
        agentIdentity = AgentIdentity({
            name:                 "MantleMind",
            version:              "1.0.0",
            owner:                msg.sender,
            createdAt:            block.timestamp,
            totalRecommendations: 0,
            reputationScore:      80    // initial reputation
        });

        // ERC-8004: mint agent identity on deployment
        emit AgentMinted(msg.sender, "MantleMind", "1.0.0", block.timestamp);
    }

    // ─── Core: Log Recommendation ─────────────────────────────────────────────

    /**
     * @notice Log an AI recommendation on Mantle.
     *         Automatically updates the agent's on-chain reputation score.
     * @param action     Short description of the recommended DeFi action
     * @param reasoning  AI's reasoning (stored permanently on-chain)
     * @param confidence AI's confidence score (0–100)
     */
    function logRecommendation(
        string memory action,
        string memory reasoning,
        uint256       confidence
    ) public {
        require(confidence <= 100, "Confidence must be 0-100");

        Recommendation memory rec = Recommendation({
            user:       msg.sender,
            action:     action,
            reasoning:  reasoning,
            confidence: confidence,
            timestamp:  block.timestamp
        });

        userRecommendations[msg.sender].push(rec);
        allRecommendations.push(rec);

        // Update rolling confidence window
        _recentConf[_confIdx % 20] = confidence;
        unchecked { _confIdx++; }
        if (_confCount < 20) _confCount++;

        agentIdentity.totalRecommendations++;
        agentIdentity.reputationScore = _calcReputation();

        emit AIRecommendation(msg.sender, action, reasoning, confidence, block.timestamp);
        emit AgentDecision(msg.sender, "AI_ADVICE", block.timestamp);
        emit ReputationUpdated(
            agentIdentity.reputationScore,
            agentIdentity.totalRecommendations,
            block.timestamp
        );
    }

    // ─── View: Agent Stats (ERC-8004) ─────────────────────────────────────────

    /**
     * @notice Returns the agent's on-chain identity and performance stats.
     *         Implements ERC-8004 agent metadata pattern.
     */
    function getAgentStats() public view returns (
        string  memory name,
        string  memory version,
        address        owner,
        uint256        totalRecommendations,
        uint256        reputationScore,
        uint256        createdAt
    ) {
        AgentIdentity memory a = agentIdentity;
        return (a.name, a.version, a.owner, a.totalRecommendations, a.reputationScore, a.createdAt);
    }

    function getUserRecommendations(address user)
        public view returns (Recommendation[] memory)
    {
        return userRecommendations[user];
    }

    function getTotalRecommendations() public view returns (uint256) {
        return allRecommendations.length;
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _calcReputation() internal view returns (uint256) {
        if (_confCount == 0) return 80;
        uint256 sum = 0;
        for (uint8 i = 0; i < _confCount; i++) {
            sum += _recentConf[i];
        }
        return sum / _confCount;
    }
}
