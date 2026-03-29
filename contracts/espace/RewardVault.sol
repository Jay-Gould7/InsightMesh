// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IERC20.sol";

contract RewardVault {
    IERC20 public immutable usdt0;
    address public immutable admin;

    mapping(uint256 => uint256) public depositedAmount;
    mapping(uint256 => bool) public settled;

    event RewardDeposited(uint256 indexed bountyId, address indexed funder, uint256 amount);
    event RewardDistributed(uint256 indexed bountyId, address indexed recipient, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "admin only");
        _;
    }

    constructor(address tokenAddress, address adminAddress) {
        require(tokenAddress != address(0), "invalid token");
        require(adminAddress != address(0), "invalid admin");
        usdt0 = IERC20(tokenAddress);
        admin = adminAddress;
    }

    function deposit(uint256 bountyId, uint256 amount) external {
        require(!settled[bountyId], "already settled");
        require(amount > 0, "amount required");
        depositedAmount[bountyId] += amount;
        require(usdt0.transferFrom(msg.sender, address(this), amount), "transfer failed");
        emit RewardDeposited(bountyId, msg.sender, amount);
    }

    function distribute(uint256 bountyId, address[] calldata recipients, uint256[] calldata amounts) external onlyAdmin {
        require(!settled[bountyId], "already settled");
        require(recipients.length == amounts.length, "length mismatch");
        require(recipients.length > 0, "empty distribution");

        uint256 total;
        for (uint256 i = 0; i < amounts.length; i++) {
            total += amounts[i];
        }
        require(total <= depositedAmount[bountyId], "insufficient funding");

        settled[bountyId] = true;
        for (uint256 i = 0; i < recipients.length; i++) {
            require(usdt0.transfer(recipients[i], amounts[i]), "payout failed");
            emit RewardDistributed(bountyId, recipients[i], amounts[i]);
        }
    }
}
