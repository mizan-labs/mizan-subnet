// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IntegrityRegistry
 * @notice Stores epoch records and integrity proofs for stablecoin issuers
 * @dev This is the core on-chain state for the Mizan subnet
 */
contract IntegrityRegistry {
    // ==========================================
    // Types
    // ==========================================

    struct EpochRecord {
        uint256 epoch;
        bytes32 merkleRoot;
        bytes32 proofHash;
        address issuer;
        uint256 timestamp;
        bool verified;
    }

    // ==========================================
    // State
    // ==========================================

    /// @notice Mapping from issuer => epoch => record
    mapping(address => mapping(uint256 => EpochRecord)) public epochRecords;

    /// @notice Latest epoch for each issuer
    mapping(address => uint256) public latestEpoch;

    /// @notice Groth16 verifier contract
    address public immutable verifier;

    /// @notice Policy registry contract
    address public immutable policyRegistry;

    /// @notice Registered issuers
    mapping(address => bool) public isRegisteredIssuer;

    // ==========================================
    // Events
    // ==========================================

    /// @notice Emitted when a new integrity proof is submitted
    event IntegrityProven(
        address indexed issuer,
        uint256 indexed epoch,
        bytes32 merkleRoot,
        bytes32 proofHash,
        uint256 timestamp
    );

    /// @notice Emitted when an issuer registers
    event IssuerRegistered(address indexed issuer, uint256 timestamp);

    /// @notice Emitted when proof verification fails
    event ProofRejected(
        address indexed issuer,
        uint256 indexed epoch,
        string reason
    );

    // ==========================================
    // Errors
    // ==========================================

    error NotRegisteredIssuer();
    error InvalidEpoch();
    error ProofVerificationFailed();
    error EpochAlreadySubmitted();
    error InvalidVerifier();

    // ==========================================
    // Constructor
    // ==========================================

    constructor(address _verifier, address _policyRegistry) {
        require(_verifier != address(0), "Invalid verifier");
        require(_policyRegistry != address(0), "Invalid policy registry");
        verifier = _verifier;
        policyRegistry = _policyRegistry;
    }

    // ==========================================
    // External Functions
    // ==========================================

    /**
     * @notice Register as an issuer
     */
    function registerIssuer() external {
        isRegisteredIssuer[msg.sender] = true;
        emit IssuerRegistered(msg.sender, block.timestamp);
    }

    /**
     * @notice Submit an integrity proof for an epoch
     * @param epoch Epoch number (must be latest + 1)
     * @param merkleRoot Merkle root of commitments
     * @param proof Groth16 proof bytes
     * @param publicInputs Public inputs for proof verification
     */
    function submitProof(
        uint256 epoch,
        bytes32 merkleRoot,
        bytes calldata proof,
        uint256[] calldata publicInputs
    ) external {
        // Verify issuer is registered
        if (!isRegisteredIssuer[msg.sender]) {
            revert NotRegisteredIssuer();
        }

        // Verify epoch is sequential
        uint256 currentLatest = latestEpoch[msg.sender];
        if (epoch != currentLatest + 1) {
            revert InvalidEpoch();
        }

        // Check epoch not already submitted
        if (epochRecords[msg.sender][epoch].timestamp != 0) {
            revert EpochAlreadySubmitted();
        }

        // Verify the ZK proof
        bool isValid = _verifyProof(proof, publicInputs);
        if (!isValid) {
            emit ProofRejected(msg.sender, epoch, "Verification failed");
            revert ProofVerificationFailed();
        }

        // Compute proof hash
        bytes32 proofHash = keccak256(proof);

        // Store epoch record
        epochRecords[msg.sender][epoch] = EpochRecord({
            epoch: epoch,
            merkleRoot: merkleRoot,
            proofHash: proofHash,
            issuer: msg.sender,
            timestamp: block.timestamp,
            verified: true
        });

        // Update latest epoch
        latestEpoch[msg.sender] = epoch;

        // Emit event for subnet indexing
        emit IntegrityProven(
            msg.sender,
            epoch,
            merkleRoot,
            proofHash,
            block.timestamp
        );
    }

    /**
     * @notice Get epoch record for an issuer
     * @param issuer Issuer address
     * @param epoch Epoch number
     */
    function getEpochRecord(
        address issuer,
        uint256 epoch
    ) external view returns (EpochRecord memory) {
        return epochRecords[issuer][epoch];
    }

    /**
     * @notice Get integrity history for an issuer
     * @param issuer Issuer address
     * @param startEpoch Start epoch (inclusive)
     * @param endEpoch End epoch (inclusive)
     */
    function getIntegrityHistory(
        address issuer,
        uint256 startEpoch,
        uint256 endEpoch
    ) external view returns (EpochRecord[] memory) {
        require(endEpoch >= startEpoch, "Invalid range");
        
        uint256 count = endEpoch - startEpoch + 1;
        EpochRecord[] memory records = new EpochRecord[](count);
        
        for (uint256 i = 0; i < count; i++) {
            records[i] = epochRecords[issuer][startEpoch + i];
        }
        
        return records;
    }

    // ==========================================
    // Internal Functions
    // ==========================================

    /**
     * @notice Verify a Groth16 proof
     * @dev Calls the verifier contract
     */
    function _verifyProof(
        bytes calldata proof,
        uint256[] calldata publicInputs
    ) internal view returns (bool) {
        // Call verifier contract
        // The actual interface depends on the generated verifier
        (bool success, bytes memory result) = verifier.staticcall(
            abi.encodeWithSignature(
                "verifyProof(bytes,uint256[])",
                proof,
                publicInputs
            )
        );
        
        if (!success) {
            return false;
        }
        
        return abi.decode(result, (bool));
    }
}
