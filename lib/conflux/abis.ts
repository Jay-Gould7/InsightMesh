export const bountyRegistryAbi = [
  {
    type: "function",
    name: "createBounty",
    stateMutability: "nonpayable",
    inputs: [
      { name: "title", type: "string" },
      { name: "metadataHash", type: "string" },
      { name: "rewardAmount", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [{ name: "bountyId", type: "uint256" }],
  },
  {
    type: "function",
    name: "updateStatus",
    stateMutability: "nonpayable",
    inputs: [
      { name: "bountyId", type: "uint256" },
      { name: "status", type: "uint8" },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "BountyCreated",
    anonymous: false,
    inputs: [
      { name: "bountyId", type: "uint256", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "rewardAmount", type: "uint256", indexed: false },
      { name: "deadline", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "BountyStatusChanged",
    anonymous: false,
    inputs: [
      { name: "bountyId", type: "uint256", indexed: true },
      { name: "status", type: "uint8", indexed: false },
    ],
  },
] as const;

export const submissionRegistryAbi = [
  {
    type: "function",
    name: "submit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "bountyId", type: "uint256" },
      { name: "contentHash", type: "bytes32" },
      { name: "payoutAddress", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "support",
    stateMutability: "nonpayable",
    inputs: [
      { name: "bountyId", type: "uint256" },
      { name: "submissionId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "SubmissionRecorded",
    anonymous: false,
    inputs: [
      { name: "bountyId", type: "uint256", indexed: true },
      { name: "submissionId", type: "uint256", indexed: true },
      { name: "submitter", type: "address", indexed: true },
      { name: "payoutAddress", type: "address", indexed: false },
      { name: "contentHash", type: "bytes32", indexed: false },
    ],
  },
  {
    type: "event",
    name: "SubmissionSupported",
    anonymous: false,
    inputs: [
      { name: "bountyId", type: "uint256", indexed: true },
      { name: "submissionId", type: "uint256", indexed: true },
      { name: "supporter", type: "address", indexed: true },
    ],
  },
] as const;

export const rewardVaultAbi = [
  {
    type: "function",
    name: "deposit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "bountyId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "distribute",
    stateMutability: "nonpayable",
    inputs: [
      { name: "bountyId", type: "uint256" },
      { name: "recipients", type: "address[]" },
      { name: "amounts", type: "uint256[]" },
    ],
    outputs: [],
  },
] as const;

export const erc20Abi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;
