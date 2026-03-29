// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IBountyRegistry {
    enum BountyStatus {
        PENDING_FUNDING,
        ACTIVE,
        ANALYZING,
        READY_TO_SETTLE,
        SETTLED,
        CANCELLED
    }

    function getSubmissionRules(uint256 bountyId) external view returns (uint256 deadline, BountyStatus status);
    function incrementSubmissionCount(uint256 bountyId) external;
}
