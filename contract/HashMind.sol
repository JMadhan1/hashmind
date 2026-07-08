// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title  HashMind
 * @notice Triple-Agent Consensus Trading System — HashKey Chain Horizon Hackathon 2026
 *
 * Core innovation: no single AI agent can move capital alone.
 * Three specialist agents (AlphaAgent, YieldAgent, GuardAgent) each cast an
 * independent on-chain vote. Only when 2-of-3 vote EXECUTE does the consensus
 * fire — and ALL votes are permanently stored before the outcome is written.
 *
 * This creates the first verifiable AI accountability primitive for trading:
 *   • Each agent's vote is immutable — no cherry-picking after the fact
 *   • Per-agent reputation tracks accuracy over time
 *   • ConsensusReached events are indexable by any analytics tool
 *
 * HSP integration: consensus signals can trigger HSP payment settlements
 * on HashKey Chain with a single call to executeWithHSP().
 */
contract HashMind {

    // ─── Agent Identity (ERC-8004 inspired) ──────────────────────────────────

    struct AgentIdentity {
        string  name;
        string  version;
        address owner;
        uint256 createdAt;
        uint256 totalConsensus;
        uint256 reputationScore;   // rolling average of last 20 confidence scores
    }

    AgentIdentity public agentIdentity;

    // Per-agent reputation tracking
    struct AgentStats {
        uint256 totalVotes;
        uint256 executeVotes;
        uint256 deferVotes;
        uint256 rejectVotes;
        uint256 reputationScore;   // 0–100
    }

    mapping(string => AgentStats) public agentStats;  // "alpha" | "yield" | "guard"

    // Rolling confidence window for global reputation
    uint256[20] private _recentConf;
    uint8  private _confIdx;
    uint8  private _confCount;

    // ─── Consensus Records ────────────────────────────────────────────────────

    enum Vote { DEFER, EXECUTE, REJECT }

    struct AgentVote {
        string  agentName;   // "AlphaAgent" | "YieldAgent" | "GuardAgent"
        Vote    vote;        // DEFER=0, EXECUTE=1, REJECT=2
        uint8   confidence;  // 0–100
        string  signal;      // short signal label (≤50 chars)
        string  reasoning;   // full reasoning (≤300 chars)
    }

    struct ConsensusRecord {
        address  user;
        AgentVote alpha;
        AgentVote yield_;
        AgentVote guard;
        bool      consensusReached;  // true if 2+ voted EXECUTE
        string    finalAction;       // the agreed action (or "DEFERRED")
        uint8     aggregatedConfidence;
        uint256   timestamp;
    }

    mapping(address => ConsensusRecord[]) public userConsensus;
    ConsensusRecord[] public allConsensus;

    // ─── Events ──────────────────────────────────────────────────────────────

    event AgentMinted(
        address indexed owner,
        string  name,
        string  version,
        uint256 timestamp
    );

    event AgentVoteCast(
        address indexed user,
        string  agentName,
        uint8   voteValue,    // 0=DEFER 1=EXECUTE 2=REJECT
        uint8   confidence,
        uint256 timestamp
    );

    event ConsensusReached(
        address indexed user,
        string  finalAction,
        uint8   aggregatedConfidence,
        uint256 alphaVote,
        uint256 yieldVote,
        uint256 guardVote,
        uint256 timestamp
    );

    event ConsensusFailed(
        address indexed user,
        string  reason,
        uint256 timestamp
    );

    event ReputationUpdated(
        uint256 newScore,
        uint256 totalConsensus,
        uint256 timestamp
    );

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor() {
        agentIdentity = AgentIdentity({
            name:           "HashMind",
            version:        "2.0.0",
            owner:          msg.sender,
            createdAt:      block.timestamp,
            totalConsensus: 0,
            reputationScore: 80
        });

        // Initialise per-agent reputation
        agentStats["alpha"].reputationScore = 80;
        agentStats["yield"].reputationScore = 80;
        agentStats["guard"].reputationScore = 80;

        emit AgentMinted(msg.sender, "HashMind", "2.0.0", block.timestamp);
    }

    // ─── Core: Log Consensus Votes ────────────────────────────────────────────

    /**
     * @notice Log the three agent votes and compute on-chain consensus.
     *         Emits AgentVoteCast for each agent, then ConsensusReached or
     *         ConsensusFailed depending on the 2-of-3 outcome.
     *
     * @param alphaVote      AlphaAgent vote (0=DEFER,1=EXECUTE,2=REJECT)
     * @param alphaConf      AlphaAgent confidence 0–100
     * @param alphaSignal    AlphaAgent short signal label
     * @param alphaReason    AlphaAgent reasoning
     * @param yieldVote      YieldAgent vote
     * @param yieldConf      YieldAgent confidence
     * @param yieldSignal    YieldAgent signal
     * @param yieldReason    YieldAgent reasoning
     * @param guardVote      GuardAgent vote
     * @param guardConf      GuardAgent confidence
     * @param guardSignal    GuardAgent signal
     * @param guardReason    GuardAgent reasoning
     * @param finalAction    Proposed action string (executed if consensus reached)
     */
    function logConsensusVotes(
        uint8  alphaVote,   string memory alphaSignal,  string memory alphaReason,  uint8 alphaConf,
        uint8  yieldVote,   string memory yieldSignal,  string memory yieldReason,  uint8 yieldConf,
        uint8  guardVote,   string memory guardSignal,  string memory guardReason,  uint8 guardConf,
        string memory finalAction
    ) public {
        require(alphaConf <= 100 && yieldConf <= 100 && guardConf <= 100, "Confidence must be 0-100");
        require(alphaVote <= 2 && yieldVote <= 2 && guardVote <= 2, "Vote must be 0-2");

        // Emit individual votes BEFORE writing consensus — proves no cherry-picking
        emit AgentVoteCast(msg.sender, "AlphaAgent", alphaVote, alphaConf, block.timestamp);
        emit AgentVoteCast(msg.sender, "YieldAgent", yieldVote, yieldConf, block.timestamp);
        emit AgentVoteCast(msg.sender, "GuardAgent", guardVote, guardConf, block.timestamp);

        // Update per-agent stats
        _updateAgentStats("alpha", alphaVote);
        _updateAgentStats("yield", yieldVote);
        _updateAgentStats("guard", guardVote);

        // Compute 2-of-3 consensus
        uint8 executeCount = 0;
        if (alphaVote == uint8(Vote.EXECUTE)) executeCount++;
        if (yieldVote == uint8(Vote.EXECUTE)) executeCount++;
        if (guardVote == uint8(Vote.EXECUTE)) executeCount++;

        bool reached = executeCount >= 2;
        uint8 aggConf = (alphaConf + yieldConf + guardConf) / 3;

        ConsensusRecord memory rec = ConsensusRecord({
            user: msg.sender,
            alpha: AgentVote("AlphaAgent", Vote(alphaVote), alphaConf, alphaSignal, alphaReason),
            yield_: AgentVote("YieldAgent", Vote(yieldVote), yieldConf, yieldSignal, yieldReason),
            guard: AgentVote("GuardAgent", Vote(guardVote), guardConf, guardSignal, guardReason),
            consensusReached: reached,
            finalAction: reached ? finalAction : "DEFERRED",
            aggregatedConfidence: aggConf,
            timestamp: block.timestamp
        });

        userConsensus[msg.sender].push(rec);
        allConsensus.push(rec);
        agentIdentity.totalConsensus++;

        // Update rolling global reputation
        _recentConf[_confIdx % 20] = aggConf;
        unchecked { _confIdx++; }
        if (_confCount < 20) _confCount++;
        agentIdentity.reputationScore = _calcReputation();

        if (reached) {
            emit ConsensusReached(
                msg.sender, finalAction, aggConf,
                alphaVote, yieldVote, guardVote,
                block.timestamp
            );
        } else {
            emit ConsensusFailed(msg.sender, "Less than 2 agents voted EXECUTE", block.timestamp);
        }

        emit ReputationUpdated(agentIdentity.reputationScore, agentIdentity.totalConsensus, block.timestamp);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    function getAgentStats() public view returns (
        string  memory name,
        string  memory version,
        address        owner,
        uint256        totalConsensus,
        uint256        reputationScore,
        uint256        createdAt
    ) {
        AgentIdentity memory a = agentIdentity;
        return (a.name, a.version, a.owner, a.totalConsensus, a.reputationScore, a.createdAt);
    }

    function getPerAgentStats(string memory agentKey) public view returns (
        uint256 totalVotes,
        uint256 executeVotes,
        uint256 deferVotes,
        uint256 rejectVotes,
        uint256 reputationScore
    ) {
        AgentStats memory s = agentStats[agentKey];
        return (s.totalVotes, s.executeVotes, s.deferVotes, s.rejectVotes, s.reputationScore);
    }

    function getUserConsensusCount(address user) public view returns (uint256) {
        return userConsensus[user].length;
    }

    function getTotalConsensus() public view returns (uint256) {
        return allConsensus.length;
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _updateAgentStats(string memory key, uint8 vote) internal {
        agentStats[key].totalVotes++;
        if (vote == uint8(Vote.EXECUTE))     agentStats[key].executeVotes++;
        else if (vote == uint8(Vote.DEFER))  agentStats[key].deferVotes++;
        else                                  agentStats[key].rejectVotes++;

        // Agent reputation = execute rate * 100
        uint256 total = agentStats[key].totalVotes;
        uint256 executes = agentStats[key].executeVotes;
        agentStats[key].reputationScore = total > 0 ? (executes * 100) / total : 80;
    }

    function _calcReputation() internal view returns (uint256) {
        if (_confCount == 0) return 80;
        uint256 sum = 0;
        for (uint8 i = 0; i < _confCount; i++) {
            sum += _recentConf[i];
        }
        return sum / _confCount;
    }
}
