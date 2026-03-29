// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IBountyRegistry.sol";

contract BountyRegistry is IBountyRegistry {
    struct Bounty {
        address creator;
        string title;
        string metadataHash;
        uint256 rewardAmount;
        uint256 deadline;
        uint256 submissionCount;
        BountyStatus status;
    }

    mapping(uint256 => Bounty) public bounties;
    uint256 public nextBountyId;
    address public owner;
    address public submissionRegistry;

    event BountyCreated(uint256 indexed bountyId, address indexed creator, uint256 rewardAmount, uint256 deadline);
    event BountyStatusChanged(uint256 indexed bountyId, BountyStatus status);
    event SubmissionRegistryUpdated(address indexed submissionRegistryAddress);

    modifier onlyOwner() {
        require(msg.sender == owner, "owner only");
        _;
    }

    modifier onlyOwnerOrCreator(uint256 bountyId) {
        require(msg.sender == owner || msg.sender == bounties[bountyId].creator, "not authorized");
        _;
    }

    modifier onlySubmissionRegistry() {
        require(msg.sender == submissionRegistry, "submission registry only");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setSubmissionRegistry(address submissionRegistryAddress) external onlyOwner {
        require(submissionRegistryAddress != address(0), "invalid registry");
        submissionRegistry = submissionRegistryAddress;
        emit SubmissionRegistryUpdated(submissionRegistryAddress);
    }

    function createBounty(
        string calldata title,
        string calldata metadataHash,
        uint256 rewardAmount,
        uint256 deadline
    ) external returns (uint256 bountyId) {
        require(bytes(title).length > 0, "title required");
        require(bytes(metadataHash).length > 0, "metadata required");
        require(rewardAmount > 0, "reward required");
        require(deadline > block.timestamp, "deadline in past");

        bountyId = nextBountyId++;
        bounties[bountyId] = Bounty({
            creator: msg.sender,
            title: title,
            metadataHash: metadataHash,
            rewardAmount: rewardAmount,
            deadline: deadline,
            submissionCount: 0,
            status: BountyStatus.ACTIVE
        });

        emit BountyCreated(bountyId, msg.sender, rewardAmount, deadline);
    }

    function updateStatus(uint256 bountyId, BountyStatus status) external onlyOwnerOrCreator(bountyId) {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.creator != address(0), "unknown bounty");
        bounty.status = status;
        emit BountyStatusChanged(bountyId, status);
    }

    function getSubmissionRules(uint256 bountyId) external view returns (uint256 deadline, BountyStatus status) {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.creator != address(0), "unknown bounty");
        return (bounty.deadline, bounty.status);
    }

    function incrementSubmissionCount(uint256 bountyId) external onlySubmissionRegistry {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.creator != address(0), "unknown bounty");
        unchecked {
            bounty.submissionCount += 1;
        }
    }
}
