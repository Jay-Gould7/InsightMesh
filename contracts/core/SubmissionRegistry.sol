// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IBountyRegistry.sol";

contract SubmissionRegistry {
    struct Submission {
        address submitter;
        address payoutAddress;
        bytes32 contentHash;
        uint256 timestamp;
        uint256 supportCount;
    }

    IBountyRegistry public immutable bountyRegistry;

    mapping(uint256 => mapping(uint256 => Submission)) public submissions;
    mapping(uint256 => uint256) public submissionCounts;
    mapping(uint256 => mapping(address => bool)) public hasSubmitted;
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public hasSupported;

    event SubmissionRecorded(
        uint256 indexed bountyId,
        uint256 indexed submissionId,
        address indexed submitter,
        address payoutAddress,
        bytes32 contentHash
    );
    event SubmissionSupported(uint256 indexed bountyId, uint256 indexed submissionId, address indexed supporter);

    constructor(address bountyRegistryAddress) {
        require(bountyRegistryAddress != address(0), "invalid registry");
        bountyRegistry = IBountyRegistry(bountyRegistryAddress);
    }

    function submit(uint256 bountyId, bytes32 contentHash, address payoutAddress) external {
        (uint256 deadline, IBountyRegistry.BountyStatus status) = bountyRegistry.getSubmissionRules(bountyId);
        require(block.timestamp <= deadline, "deadline passed");
        require(status == IBountyRegistry.BountyStatus.ACTIVE, "bounty inactive");
        require(!hasSubmitted[bountyId][msg.sender], "already submitted");
        require(payoutAddress != address(0), "invalid payout");

        uint256 submissionId = submissionCounts[bountyId];
        submissions[bountyId][submissionId] = Submission({
            submitter: msg.sender,
            payoutAddress: payoutAddress,
            contentHash: contentHash,
            timestamp: block.timestamp,
            supportCount: 0
        });
        hasSubmitted[bountyId][msg.sender] = true;
        submissionCounts[bountyId] = submissionId + 1;
        bountyRegistry.incrementSubmissionCount(bountyId);

        emit SubmissionRecorded(bountyId, submissionId, msg.sender, payoutAddress, contentHash);
    }

    function support(uint256 bountyId, uint256 submissionId) external {
        (uint256 deadline, IBountyRegistry.BountyStatus status) = bountyRegistry.getSubmissionRules(bountyId);
        require(block.timestamp <= deadline, "deadline passed");
        require(
            status == IBountyRegistry.BountyStatus.ACTIVE || status == IBountyRegistry.BountyStatus.ANALYZING,
            "support closed"
        );
        require(submissionId < submissionCounts[bountyId], "unknown submission");
        require(!hasSupported[bountyId][submissionId][msg.sender], "already supported");

        Submission storage target = submissions[bountyId][submissionId];
        require(target.submitter != address(0), "unknown submission");
        require(target.submitter != msg.sender, "self support");

        hasSupported[bountyId][submissionId][msg.sender] = true;
        unchecked {
            target.supportCount += 1;
        }

        emit SubmissionSupported(bountyId, submissionId, msg.sender);
    }
}
