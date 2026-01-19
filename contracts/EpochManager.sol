// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EpochManager
 * @notice Manages epoch timing, deadlines, and slashing for the Mizan subnet
 */
contract EpochManager {
    // ==========================================
    // Types
    // ==========================================

    struct EpochState {
        uint256 startTime;
        uint256 endTime;
        bool finalized;
        uint256 totalSubmissions;
        uint256 totalSlashed;
    }

    // ==========================================
    // State
    // ==========================================

    /// @notice Current epoch number
    uint256 public currentEpoch;

    /// @notice Epoch duration in seconds
    uint256 public epochDuration;

    /// @notice Grace period after deadline
    uint256 public gracePeriod;

    /// @notice Epoch state mapping
    mapping(uint256 => EpochState) public epochs;

    /// @notice Missed epochs per issuer
    mapping(address => uint256) public missedEpochs;

    /// @notice Slashing score per issuer (0-100)
    mapping(address => uint256) public slashingScore;

    /// @notice IntegrityRegistry reference
    address public integrityRegistry;

    /// @notice Governance address
    address public governance;

    // ==========================================
    // Events
    // ==========================================

    event EpochStarted(uint256 indexed epoch, uint256 startTime, uint256 endTime);
    event EpochFinalized(uint256 indexed epoch, uint256 totalSubmissions);
    event MissedEpoch(address indexed issuer, uint256 indexed epoch);
    event SlashingApplied(address indexed issuer, uint256 score, string reason);

    // ==========================================
    // Errors
    // ==========================================

    error Unauthorized();
    error EpochNotActive();
    error EpochNotFinalized();
    error InvalidDuration();

    // ==========================================
    // Modifiers
    // ==========================================

    modifier onlyGovernance() {
        if (msg.sender != governance) revert Unauthorized();
        _;
    }

    modifier onlyRegistry() {
        if (msg.sender != integrityRegistry) revert Unauthorized();
        _;
    }

    // ==========================================
    // Constructor
    // ==========================================

    constructor(
        address _governance,
        uint256 _epochDuration,
        uint256 _gracePeriod
    ) {
        require(_epochDuration >= 1 hours, "Duration too short");
        require(_gracePeriod >= 5 minutes, "Grace too short");
        
        governance = _governance;
        epochDuration = _epochDuration;
        gracePeriod = _gracePeriod;
        
        // Start first epoch
        _startEpoch();
    }

    // ==========================================
    // External Functions
    // ==========================================

    /**
     * @notice Set IntegrityRegistry address
     */
    function setIntegrityRegistry(address _registry) external onlyGovernance {
        require(_registry != address(0), "Invalid address");
        integrityRegistry = _registry;
    }

    /**
     * @notice Check if current epoch is active
     */
    function isEpochActive() external view returns (bool) {
        EpochState memory state = epochs[currentEpoch];
        return block.timestamp >= state.startTime && 
               block.timestamp <= state.endTime + gracePeriod;
    }

    /**
     * @notice Get time remaining in current epoch (including grace)
     */
    function timeRemaining() external view returns (uint256) {
        EpochState memory state = epochs[currentEpoch];
        uint256 deadline = state.endTime + gracePeriod;
        
        if (block.timestamp >= deadline) return 0;
        return deadline - block.timestamp;
    }

    /**
     * @notice Advance to next epoch (anyone can call if time is up)
     */
    function advanceEpoch() external {
        EpochState storage state = epochs[currentEpoch];
        
        require(
            block.timestamp > state.endTime + gracePeriod,
            "Current epoch still active"
        );
        require(!state.finalized, "Already finalized");
        
        // Finalize current epoch
        state.finalized = true;
        emit EpochFinalized(currentEpoch, state.totalSubmissions);
        
        // Start new epoch
        _startEpoch();
    }

    /**
     * @notice Record a submission for current epoch
     * @dev Called by IntegrityRegistry when proof is submitted
     */
    function recordSubmission(address issuer) external onlyRegistry {
        epochs[currentEpoch].totalSubmissions++;
        
        // Reset missed streak on successful submission
        if (missedEpochs[issuer] > 0) {
            missedEpochs[issuer] = 0;
        }
    }

    /**
     * @notice Record missed epoch for an issuer
     * @dev Called during epoch finalization
     */
    function recordMissedEpoch(address issuer) external onlyRegistry {
        missedEpochs[issuer]++;
        epochs[currentEpoch].totalSlashed++;
        
        emit MissedEpoch(issuer, currentEpoch);
        
        // Apply progressive slashing
        _applySlashing(issuer);
    }

    /**
     * @notice Get issuer's slashing score
     */
    function getSlashingScore(address issuer) external view returns (uint256) {
        return slashingScore[issuer];
    }

    /**
     * @notice Update epoch duration (governance only)
     */
    function setEpochDuration(uint256 newDuration) external onlyGovernance {
        if (newDuration < 1 hours) revert InvalidDuration();
        epochDuration = newDuration;
    }

    // ==========================================
    // Internal Functions
    // ==========================================

    function _startEpoch() internal {
        currentEpoch++;
        
        epochs[currentEpoch] = EpochState({
            startTime: block.timestamp,
            endTime: block.timestamp + epochDuration,
            finalized: false,
            totalSubmissions: 0,
            totalSlashed: 0
        });
        
        emit EpochStarted(
            currentEpoch,
            block.timestamp,
            block.timestamp + epochDuration
        );
    }

    function _applySlashing(address issuer) internal {
        uint256 missed = missedEpochs[issuer];
        uint256 score = slashingScore[issuer];
        
        // Progressive slashing:
        // 1 miss = +5 score
        // 2-3 misses = +10 score each
        // 4+ misses = +20 score each
        uint256 penalty;
        if (missed == 1) {
            penalty = 5;
        } else if (missed <= 3) {
            penalty = 10;
        } else {
            penalty = 20;
        }
        
        score = score + penalty;
        if (score > 100) score = 100;
        
        slashingScore[issuer] = score;
        
        emit SlashingApplied(
            issuer,
            score,
            string(abi.encodePacked("Missed ", missed, " epochs"))
        );
    }
}
