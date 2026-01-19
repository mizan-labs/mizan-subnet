// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PolicyRegistry
 * @notice Manages integrity policies for the Mizan subnet
 * @dev Policies define the rules that proofs must adhere to
 */
contract PolicyRegistry {
    // ==========================================
    // Types
    // ==========================================

    struct Policy {
        bytes32 policyHash;
        uint256 version;
        uint256 minCollateralRatio;  // Scaled by 1e18 (1.5e18 = 150%)
        uint256 maxCollateralRatio;  // Scaled by 1e18
        uint256 minSupplyCoverage;   // Scaled by 1e18
        uint256 epochDeadlineSeconds;
        bool isActive;
        uint256 createdAt;
    }

    // ==========================================
    // State
    // ==========================================

    /// @notice All registered policies by hash
    mapping(bytes32 => Policy) public policies;

    /// @notice Policy versions in order
    bytes32[] public policyVersions;

    /// @notice Currently active policy hash
    bytes32 public activePolicy;

    /// @notice Governance address
    address public governance;

    /// @notice Minimum allowed collateral ratio (100%)
    uint256 public constant MIN_RATIO = 1e18;

    /// @notice Maximum allowed collateral ratio (1000%)
    uint256 public constant MAX_RATIO = 10e18;

    // ==========================================
    // Events
    // ==========================================

    event PolicyRegistered(
        bytes32 indexed policyHash,
        uint256 version,
        uint256 minCollateralRatio,
        uint256 timestamp
    );

    event PolicyActivated(bytes32 indexed policyHash, uint256 timestamp);

    event PolicyDeactivated(bytes32 indexed policyHash, uint256 timestamp);

    // ==========================================
    // Errors
    // ==========================================

    error Unauthorized();
    error InvalidPolicy();
    error PolicyExists();
    error PolicyNotFound();
    error InvalidRatio();

    // ==========================================
    // Modifiers
    // ==========================================

    modifier onlyGovernance() {
        if (msg.sender != governance) revert Unauthorized();
        _;
    }

    // ==========================================
    // Constructor
    // ==========================================

    constructor(address _governance) {
        governance = _governance;
    }

    // ==========================================
    // External Functions
    // ==========================================

    /**
     * @notice Register a new policy
     * @param version Policy version number
     * @param minCollateralRatio Minimum collateral ratio (1e18 = 100%)
     * @param maxCollateralRatio Maximum collateral ratio
     * @param minSupplyCoverage Minimum supply coverage
     * @param epochDeadlineSeconds Epoch submission deadline
     */
    function registerPolicy(
        uint256 version,
        uint256 minCollateralRatio,
        uint256 maxCollateralRatio,
        uint256 minSupplyCoverage,
        uint256 epochDeadlineSeconds
    ) external onlyGovernance returns (bytes32 policyHash) {
        // Validate ratios
        if (minCollateralRatio < MIN_RATIO) revert InvalidRatio();
        if (maxCollateralRatio > MAX_RATIO) revert InvalidRatio();
        if (maxCollateralRatio < minCollateralRatio) revert InvalidRatio();
        if (minSupplyCoverage < MIN_RATIO) revert InvalidRatio();

        // Compute policy hash
        policyHash = keccak256(
            abi.encode(
                version,
                minCollateralRatio,
                maxCollateralRatio,
                minSupplyCoverage,
                epochDeadlineSeconds
            )
        );

        // Check not already registered
        if (policies[policyHash].createdAt != 0) revert PolicyExists();

        // Store policy
        policies[policyHash] = Policy({
            policyHash: policyHash,
            version: version,
            minCollateralRatio: minCollateralRatio,
            maxCollateralRatio: maxCollateralRatio,
            minSupplyCoverage: minSupplyCoverage,
            epochDeadlineSeconds: epochDeadlineSeconds,
            isActive: false,
            createdAt: block.timestamp
        });

        policyVersions.push(policyHash);

        emit PolicyRegistered(
            policyHash,
            version,
            minCollateralRatio,
            block.timestamp
        );

        return policyHash;
    }

    /**
     * @notice Activate a policy
     * @param policyHash Hash of policy to activate
     */
    function activatePolicy(bytes32 policyHash) external onlyGovernance {
        if (policies[policyHash].createdAt == 0) revert PolicyNotFound();

        // Deactivate current policy
        if (activePolicy != bytes32(0)) {
            policies[activePolicy].isActive = false;
            emit PolicyDeactivated(activePolicy, block.timestamp);
        }

        // Activate new policy
        policies[policyHash].isActive = true;
        activePolicy = policyHash;

        emit PolicyActivated(policyHash, block.timestamp);
    }

    /**
     * @notice Check if a policy hash is valid for proof submission
     * @param policyHash Policy hash from proof
     * @return True if policy is valid (active or recent)
     */
    function isValidPolicy(bytes32 policyHash) external view returns (bool) {
        Policy memory policy = policies[policyHash];
        if (policy.createdAt == 0) return false;

        // Active policy is always valid
        if (policyHash == activePolicy) return true;

        // Allow one version back for transition periods
        Policy memory active = policies[activePolicy];
        return policy.version >= active.version - 1;
    }

    /**
     * @notice Get active policy details
     */
    function getActivePolicy() external view returns (Policy memory) {
        return policies[activePolicy];
    }

    /**
     * @notice Get policy by hash
     */
    function getPolicy(bytes32 policyHash) external view returns (Policy memory) {
        return policies[policyHash];
    }

    /**
     * @notice Get total number of registered policies
     */
    function getPolicyCount() external view returns (uint256) {
        return policyVersions.length;
    }

    /**
     * @notice Update governance address
     */
    function setGovernance(address newGovernance) external onlyGovernance {
        require(newGovernance != address(0), "Invalid address");
        governance = newGovernance;
    }
}
