# InsightMesh

> Collect better feedback. Reward real insight.

InsightMesh is an AI-native feedback bounty app built on Conflux Network.
Creators lock a USDT0 reward pool on eSpace, publish the bounty on Core Space, collect gas-sponsored responses, run AI analysis with anti-Sybil filtering, freeze a payout snapshot, and then settle rewards through an eSpace relayer after creator approval.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Conflux](https://img.shields.io/badge/built%20on-Conflux-blue)](https://confluxnetwork.org)
[![Hackathon](https://img.shields.io/badge/Global%20Hackfest%202026-green)](https://github.com/conflux-fans/global-hackfest-2026)

## Hackathon Information

- Event: Global Hackfest 2026
- Track: Open Innovation
- Stack Focus: Conflux Core Space + eSpace + Gas Sponsorship + AI

## Team

| Name | Role | GitHub | Discord |
|------|------|--------|---------|
| Gould | Full-stack Development | [@Jay-Gould7](https://github.com/Jay-Gould7) | gold_xxtxx |
| vivid | Operations and Community | [@wkarry450-max](https://github.com/wkarry450-max) | vividzfc |

## Problem

Most feedback tools collect responses but do not reward the people who provide the best ideas.

- Web2 surveys usually end as CSV files with no incentive layer.
- Open-ended feedback is noisy, repetitive, and hard to summarize.
- On-chain governance tools are optimized for voting, not nuanced product or community insight.
- Gas costs and wallet friction reduce participation quality and quantity.

## What InsightMesh Does

InsightMesh turns feedback collection into a rewardable on-chain workflow:

1. A creator drafts a bounty and uses AI to generate a structured survey.
2. The creator deposits USDT0 into an eSpace reward vault from their own wallet.
3. The creator publishes the bounty on Core Space.
4. Participants submit feedback on Core Space with sponsored gas and bind an eSpace payout address.
5. The creator locks submissions, runs AI analysis, reviews risk flags, and freezes a payout snapshot.
6. The creator signs approval and the backend relayer distributes USDT0 on eSpace.

This MVP prioritizes a complete demo loop over full trustlessness:

- reward pool is really locked on-chain
- participant submission is really written on Core Space
- payout distribution is really executed on eSpace
- final settlement is relayer-driven after creator approval

## Why Conflux

InsightMesh is designed around Conflux's dual-space model:

- Core Space handles the high-frequency user actions: bounty creation status updates and gas-sponsored submissions.
- eSpace handles the money leg: USDT0 deposit and final ERC-20 distribution.
- Gas Sponsorship removes the need for participants to hold CFX just to submit feedback.
- Sponsor setup is done for `SubmissionRegistry` through Conflux's built-in sponsorship flow after deployment.

In short:

- Core Space = interaction layer
- eSpace = settlement layer

## Anti-Sybil Design

Yes, this belongs in the README. It is one of the most important parts of the current MVP.

InsightMesh does not claim perfect Sybil resistance yet, but the app already includes a meaningful anti-Sybil pipeline:

1. One submission per Core address per bounty is enforced on-chain.
2. Each submission permanently binds one eSpace payout address.
3. If multiple submissions point to the same payout address, only the earliest remains eligible for rewards.
4. The backend checks the eSpace nonce of each payout wallet. Wallets with zero transaction history are disqualified.
5. AI analysis flags likely coordinated bot-farm style responses as high risk.
6. High-risk responses are heavily penalized in scoring: quality reduced, discovery bonus disabled, consensus bonus disabled.
7. Before freezing the snapshot, the creator can manually exclude high-risk submissions from the final payout calculation.
8. Consensus bonus is non-linear and saturating, so repeated similar responses have diminishing marginal reward impact.

Important trust-model note:

- This is a heuristic anti-Sybil layer for an MVP, not a full identity or proof-of-personhood system.

## Current MVP Features

### Creator Flow

- AI-generated survey creation from a natural-language prompt
- Manual survey editing before launch
- Add, edit, and delete questions
- Add, edit, and delete options
- Choose text, single-select, multi-select, and rating questions
- Support `Other` options with free-text input
- Creator-funded `approve + deposit` flow on eSpace
- Creator-published bounty creation on Core Space
- Creator-only insights page
- Lock, unlock, re-analyze, and freeze before settlement
- Preview payout distribution before snapshot freeze
- Creator signature required before final settlement

### Participant Flow

- Gas-sponsored submission on Core Space
- No CFX required for sponsored submit transactions
- eSpace payout address can be entered manually
- Connected eSpace wallet can be used to auto-fill the payout address
- Before settlement, non-creators can only view their own submission details
- After settlement, all submission details become visible to everyone

### Insight and Settlement Flow

- AI cluster summaries
- AI-distilled highlights
- Score breakdown preview
- High-risk review panel
- Disqualified submission panel
- Frozen payout snapshot saved in the database
- eSpace relayer settlement after creator approval

## What Is Not Claimed Yet

To keep the README aligned with the actual codebase:

- The app does not currently expose the contract `support()` action in the UI.
- Settlement is not fully automated through `CrossSpaceCall` yet.
- The creator can influence the final payout set by manually excluding high-risk submissions before freezing.
- Anti-Sybil is strong enough for a hackathon MVP, but not a complete identity defense system.

## State Machine

The implemented bounty lifecycle is:

`PENDING_FUNDING -> ACTIVE -> ANALYZING -> READY_TO_SETTLE -> SETTLED`

Notes:

- `PENDING_FUNDING`: draft exists in the database, but reward pool is not yet verified on-chain
- `ACTIVE`: deposit and Core creation have both been verified
- `ANALYZING`: submissions are locked; creator can run AI analysis preview
- `READY_TO_SETTLE`: snapshot is frozen and settlement is enabled
- `SETTLED`: reward distribution completed

## Architecture

```text
Creator
  |- eSpace wallet: approve + deposit USDT0
  |- Fluent wallet: create bounty on Core
  v
Next.js App Router
  |- Route Handlers
  |- Prisma + SQLite
  |- AI provider client
  |- Relayer logic
  v
Core Space
  |- BountyRegistry
  |- SubmissionRegistry
  |- Gas sponsorship for submit
  v
eSpace
  |- RewardVault
  |- USDT0 settlement
```

## Conflux Integration

- Core Space contracts
  - `BountyRegistry`
  - `SubmissionRegistry`
- eSpace contract
  - `RewardVault`
- Built-in Conflux capability
  - Gas Sponsorship for participant submissions
- Token
  - USDT0 on eSpace testnet

## Deployed Contracts

Current testnet deployment used by this repo:

| Contract | Network | Address | Explorer |
|----------|---------|---------|----------|
| BountyRegistry | Core Testnet | `cfxtest:acayncftt1mtpnwhkm80v3sw5snbwkty8y2vm31evk` | [ConfluxScan](https://testnet.confluxscan.net/address/cfxtest:acayncftt1mtpnwhkm80v3sw5snbwkty8y2vm31evk) |
| SubmissionRegistry | Core Testnet | `cfxtest:acbn0bar1rbh0ntu5yumrn3d6ug96z61vufd4d7rvf` | [ConfluxScan](https://testnet.confluxscan.net/address/cfxtest:acbn0bar1rbh0ntu5yumrn3d6ug96z61vufd4d7rvf) |
| RewardVault | eSpace Testnet | `0xd544C0680baeDd71890fFd7BaAe7930D2425C657` | [ConfluxScan](https://evmtestnet.confluxscan.net/address/0xd544C0680baeDd71890fFd7BaAe7930D2425C657) |
| USDT0 | eSpace Testnet | `0x4d1beB67e8f0102d5c983c26FDf0b7C6FFF37a0c` | [ConfluxScan](https://evmtestnet.confluxscan.net/address/0x4d1beB67e8f0102d5c983c26FDf0b7C6FFF37a0c) |

### Contract Surface

#### Core: BountyRegistry

- `createBounty(string title, string metadataHash, uint256 rewardAmount, uint256 deadline) returns (uint256)`
- `setSubmissionRegistry(address submissionRegistryAddress)`
- `updateStatus(uint256 bountyId, uint8 status)`
- `getSubmissionRules(uint256 bountyId)`
- `incrementSubmissionCount(uint256 bountyId)`

#### Core: SubmissionRegistry

- `submit(uint256 bountyId, bytes32 contentHash, address payoutAddress)`
- `support(uint256 bountyId, uint256 submissionId)`

#### eSpace: RewardVault

- `deposit(uint256 bountyId, uint256 amount)`
- `distribute(uint256 bountyId, address[] recipients, uint256[] amounts)`

## Tech Stack

### Frontend

- Next.js 15 App Router
- React 19
- Tailwind CSS v4
- Framer Motion

### Backend

- Next.js Route Handlers
- Prisma
- SQLite
- Zod

### Chain Integration

- `js-conflux-sdk` for Core Space interactions
- `viem` and `ethers` for eSpace and contract tooling
- Hardhat for compile and test

### AI

- Google Gemini API

## Local Setup

### Prerequisites

- Node.js 18+
- npm
- Fluent Wallet for Core Space
- An injected EVM wallet for eSpace
  - MetaMask works
  - other injected wallets can also be selected in the wallet hub

### Install

```bash
git clone https://github.com/Jay-Gould7/InsightMesh.git
cd InsightMesh
npm install
```

### Environment

Create `.env` from `.env.example`, then fill the values you need.

Required groups:

- app
  - `DATABASE_URL`
  - `NEXT_PUBLIC_APP_NAME`
  - `NEXT_PUBLIC_DEMO_MODE`
- AI
  - `GEMINI_API_KEY`
  - `GEMINI_MODEL`
- Core Space
  - `CONFLUX_CORE_RPC_URL`
  - `CONFLUX_CORE_NETWORK_ID`
  - `CONFLUX_CORE_REGISTRY_ADDRESS`
  - `CONFLUX_CORE_SUBMISSION_ADDRESS`
  - `CONFLUX_CORE_RELAYER_PRIVATE_KEY`
- eSpace
  - `ESPACE_RPC_URL`
  - `ESPACE_CHAIN_ID`
  - `ESPACE_REWARD_VAULT_ADDRESS`
  - `ESPACE_USDT0_ADDRESS`
  - `ESPACE_RELAYER_PRIVATE_KEY`

Notes:

- `NEXT_PUBLIC_DEMO_MODE="true"` lets you run the UI without live chain verification.
- Production-like local testing should use `NEXT_PUBLIC_DEMO_MODE="false"` with real testnet config.
- The two relayer keys are used by the backend for:
  - Core bounty status updates during lock/unlock/freeze
  - eSpace reward distribution during final settlement

### Database

```bash
npm run db:generate
npm run db:push
```

Optional demo seed:

```bash
npm run db:seed
```

### Run in Development

```bash
npm run dev
```

### Run in Production Mode

```bash
npm run build
npm run start
```

## Smart Contract Deployment

Optional deployment flow:

```bash
npm run contracts:compile
node scripts/deploy-espace.mjs
node scripts/deploy-core.mjs
node scripts/setup-sponsor.mjs
```

## Usage

### As a Creator

1. Connect Fluent for Core Space and an eSpace wallet for funding.
2. Create or AI-generate the survey, then edit questions if needed.
3. Choose reward amount and deadline.
4. Approve USDT0 and deposit into `RewardVault` from eSpace.
5. Confirm Core bounty creation in Fluent.
6. Wait for backend verification to activate the bounty.
7. When enough responses arrive, lock submissions.
8. Run AI analysis preview on the Insights page.
9. Review highlights, clusters, disqualified items, and high-risk items.
10. Optionally exclude high-risk submissions.
11. Freeze the snapshot.
12. Sign settlement approval and let the relayer distribute rewards.

### As a Participant

1. Connect Fluent.
2. Browse active bounties.
3. Fill the survey.
4. Enter an eSpace payout address, or auto-fill it from a connected eSpace wallet.
5. Submit through the sponsored Core transaction flow.
6. Track outcome after the bounty is settled.

## Testing

```bash
npm run typecheck
npm run contracts:test
npm run build
```

## Known Limitations

- `CrossSpaceCall` automation is not implemented yet.
- Final settlement is relayer-based, not fully trustless.
- High-risk AI flags are heuristic and can require creator judgment.
- Anti-Sybil protection is practical for an MVP but not identity-grade.
- SQLite is used for demo scale; production should move to a stronger database.
- The `support()` contract primitive exists but is not yet wired into the current UI.

## Roadmap

### Near-Term

- Expose support actions in the UI
- Improve payout-address level anti-Sybil controls further
- Add richer analysis history and snapshot audit views
- Improve sponsor balance monitoring and operator tooling

### Stretch Goals

- CrossSpaceCall-based settlement automation
- On-chain score anchoring and reputation
- Multi-token reward pools
- Mainnet deployment

## Demo Assets

- Demo video: pending upload
- Participant intro video: pending upload

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).

## Acknowledgments

- Conflux Network for dual-space architecture and gas sponsorship primitives
- Global Hackfest 2026 organizers and community
- Gemini API tooling used during development

## Contact

- GitHub: [@Jay-Gould7](https://github.com/Jay-Gould7)
- Discord: `gold_xxtxx`, `vividzfc`
