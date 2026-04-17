# InsightMesh

AI-native on-chain feedback bounties on Conflux.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Conflux](https://img.shields.io/badge/built%20on-Conflux-blue)](https://confluxnetwork.org)
[![Hackathon](https://img.shields.io/badge/Global%20Hackfest%202026-green)](https://github.com/conflux-fans/global-hackfest-2026)

## Overview

InsightMesh turns community feedback into a rewardable on-chain workflow.

Creators lock a USDT0 reward pool on Conflux eSpace, publish a bounty on Core Space, collect gas-sponsored survey responses, run AI analysis with anti-Sybil filtering, freeze a payout snapshot, and then settle rewards through an eSpace relayer after creator approval.

What makes it different:

- real funds are locked before the bounty becomes active
- participant submissions are written to Core Space with zero gas for the respondent
- AI is used for survey generation, clustering, highlights, and scoring
- anti-Sybil filtering is built into the payout pipeline
- final reward distribution is transparent and executed on-chain

## Hackathon Information

- **Event**: Global Hackfest 2026
- **Focus Area**: Open Innovation - Build anything you want using Conflux features
- **Team**: InsightMesh
- **Submission Date**: 2026-04-20 @ 11:59:59

## Team

| Name | Role | GitHub | Discord |
|------|------|--------|---------|
| Gould | Full-stack Development | [@Jay-Gould7](https://github.com/Jay-Gould7) | gold_xxtxx |
| vivid | Operations and Community | [@wkarry450-max](https://github.com/wkarry450-max) | vividzfc |

## Problem Statement

**What problem does your project solve?**

Open-ended feedback is valuable, but current tools do a poor job of rewarding contributors and surfacing the best ideas.

- **Why this problem matters**: teams spend time collecting feedback, but the highest-signal insights are buried in long response lists or static CSV exports
- **Who is affected**: product teams, protocol teams, DAO operators, hackathon organizers, and community contributors who provide useful feedback without compensation
- **Current limitations**: most survey tools are off-chain, noisy, and incentive-free; most on-chain governance tools focus on binary voting rather than rich qualitative insight
- **How blockchain helps**: blockchain makes reward locking, contribution records, and settlement auditable, while Conflux Gas Sponsorship removes participation friction

## Solution

**How does your project address the problem?**

InsightMesh combines dual-space Conflux architecture with AI analysis:

1. **Create and fund**: the creator defines a prompt, generates or edits a survey, and deposits USDT0 into an eSpace reward vault
2. **Publish and collect**: the bounty is published on Core Space and participants submit feedback through gas-sponsored transactions
3. **Analyze and review**: the creator locks submissions, runs AI analysis, reviews clusters, highlights, disqualified entries, and high-risk entries
4. **Freeze and settle**: the creator freezes a payout snapshot, signs approval, and the backend relayer distributes rewards on eSpace

How it improves on existing solutions:

- contributors can be rewarded directly instead of contributing for free
- creators get clustered insights instead of raw answer dumps
- submission and settlement states are verifiable on-chain
- anti-Sybil filtering reduces abuse in paid feedback campaigns

Benefits:

- better signal extraction for creators
- better incentives for respondents
- a compelling end-to-end use case for Conflux Core Space + eSpace

## Go-to-Market Plan (required)

### Target Users

- **Web3 product teams**: collect structured feedback before launching features or wallets
- **DAO and protocol operators**: reward the most valuable governance and product feedback
- **Hackathon and event organizers**: collect post-event insights and reward the best contributors

### Why they would use it

- it is easier than building an internal review and payout workflow
- gas-sponsored submit lowers friction for participants
- reward pools create stronger contributor incentives
- AI reduces manual triage work for organizers and product teams

### Distribution Plan

- launch first inside the Conflux ecosystem as a native showcase of Gas Sponsorship and dual-space architecture
- target wallet teams, dApp teams, and ecosystem campaigns that already need structured feedback loops
- use demo bounties and hackathon/event feedback campaigns as initial growth channels

### Milestones and Metrics

- number of active bounties
- number of funded reward pools
- number of sponsored submissions
- average submissions per bounty
- creator retention and repeat bounty creation
- total USDT0 settled through the app

### Ecosystem Fit

InsightMesh is a natural fit for Conflux because it makes Core Space and eSpace work together in one user-facing product:

- Core Space handles the interaction-heavy side
- eSpace handles ERC-20 settlement
- Gas Sponsorship creates a smoother participation funnel

## Conflux Integration

**How does your project leverage Conflux features?**

- [x] **Core Space** - `BountyRegistry` and `SubmissionRegistry` manage bounty state and sponsored submissions
- [x] **eSpace** - `RewardVault` holds USDT0 deposits and distributes final rewards
- [ ] **Cross-Space Bridge** - not part of the current MVP; relayer-based settlement is used instead
- [x] **Gas Sponsorship** - participant submit transactions are sponsored through Conflux sponsor configuration
- [x] **Built-in Contracts** - `SponsorWhitelistControl` is used in the sponsor setup script
- [x] **Tree-Graph Consensus** - the product benefits from low-friction, high-throughput submission handling for bursty survey participation

### Partner Integrations

- [ ] **Privy** - not used
- [ ] **Pyth Network** - not used
- [ ] **LayerZero** - not used
- [x] **Other** - Google Gemini API for survey generation and analysis

## Features

### Core Features

- **AI Survey Generation** - creators can generate a structured questionnaire from a natural-language prompt
- **Gas-Sponsored Feedback Submission** - participants submit on Core Space without needing CFX for gas
- **Dual-Space Reward Flow** - funds are deposited on eSpace while interaction flow stays on Core Space

### Advanced Features

- **Manual Survey Editing** - creators can add, edit, and delete questions and options before launch
- **Anti-Sybil Scoring Pipeline** - duplicate payout addresses, zero-nonce payout wallets, and bot-farm style responses are filtered or penalized
- **Snapshot-Based Settlement** - creators can preview, review, freeze, and then approve final distribution

### Future Features (Roadmap)

- **CrossSpaceCall Automation** - replace relayer-based settlement with tighter cross-space execution
- **Support Action UI** - expose on-chain `support()` in the current product interface
- **Reputation and Multi-Token Rewards** - extend beyond single-bounty scoring and single-token pools

## Technology Stack

### Frontend

- **Framework**: Next.js 15 App Router, React 19
- **Styling**: Tailwind CSS v4
- **State Management**: React state and context providers
- **Web3 Integration**: `js-conflux-sdk`, `viem`, `ethers`

### Backend

- **Runtime**: Node.js
- **Framework**: Next.js Route Handlers
- **Database**: Prisma ORM + SQLite
- **APIs**: REST-style app route handlers

### Blockchain

- **Network**: Conflux Core Space + eSpace
- **Smart Contracts**: Solidity 0.8.24
- **Development**: Hardhat
- **Testing**: Hardhat + Mocha

### Infrastructure

- **Hosting**: standard Next.js deployment target; local development is fully supported
- **Storage**: SQLite for MVP-scale persistence
- **Monitoring**: no dedicated monitoring stack in the current MVP

## Architecture

```text
Creator Wallets
  |- eSpace wallet -> approve + deposit USDT0
  |- Fluent wallet -> create bounty on Core
  v
Next.js Frontend
  |- create bounty
  |- submit survey
  |- insights review
  |- settlement approval
  v
Next.js Route Handlers
  |- Prisma + SQLite
  |- Gemini integration
  |- Core status relayer
  |- eSpace settlement relayer
  v
Conflux Core Space
  |- BountyRegistry
  |- SubmissionRegistry
  |- sponsored submit transactions
  v
Conflux eSpace
  |- RewardVault
  |- USDT0 deposit and distribution
```
![alt text](demo.png)

**High-level architecture description:**

The frontend orchestrates a dual-wallet flow. Draft bounty data and raw survey content are stored in SQLite through Prisma. Core Space stores bounty lifecycle and submission proofs. eSpace stores the actual reward pool and executes the final settlement. AI analysis happens off-chain, but its results are turned into a frozen score snapshot before distribution.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm**
- **Git**
- **Conflux Wallet**: Fluent Wallet for Core Space
- **Injected EVM Wallet**: MetaMask or another injected EVM wallet for eSpace

### Development Tools (Optional)

- **Hardhat** - smart contract compile and test

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Jay-Gould7/InsightMesh.git
cd InsightMesh
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create the environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration.

Required app variables:

```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_NAME="InsightMesh"
NEXT_PUBLIC_DEMO_MODE="true"
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-3-flash-preview"
CONFLUX_CORE_RPC_URL="https://test.confluxrpc.com"
CONFLUX_CORE_NETWORK_ID="1"
CONFLUX_CORE_REGISTRY_ADDRESS=""
CONFLUX_CORE_SUBMISSION_ADDRESS=""
CONFLUX_CORE_RELAYER_PRIVATE_KEY=""
ESPACE_RPC_URL="https://evmtestnet.confluxrpc.com"
ESPACE_CHAIN_ID="71"
ESPACE_REWARD_VAULT_ADDRESS=""
ESPACE_USDT0_ADDRESS=""
ESPACE_RELAYER_PRIVATE_KEY=""
```

What the two private keys are used for:

- `CONFLUX_CORE_RELAYER_PRIVATE_KEY`
  - deploy Core contracts
  - configure sponsor funding for `SubmissionRegistry`
  - update Core bounty status during lock, unlock, and freeze
- `ESPACE_RELAYER_PRIVATE_KEY`
  - deploy or administer `RewardVault`
  - execute the final USDT0 settlement transaction on eSpace
  - this is the vault admin / relayer key in the current MVP

Important settlement note:

- the bounty creator does not directly broadcast `RewardVault.distribute(...)` in the current MVP
- the creator signs approval for the frozen snapshot from the frontend
- the backend relayer then sends the final eSpace settlement transaction
- this is an intentional hackathon MVP tradeoff for operational simplicity, not a fully trustless settlement design

### 4. Smart Contract Deployment

```bash
npm run contracts:compile
node scripts/deploy-espace.mjs
node scripts/deploy-core.mjs
```

### 5. Configure Gas Sponsorship

After Core deployment, fund the sponsor configuration for `SubmissionRegistry`:

```bash
node scripts/setup-sponsor.mjs
```

Important notes:

- the Core relayer wallet must hold Core Testnet CFX
- this script configures whitelist, gas sponsorship, and storage collateral sponsorship
- if sponsor funds run low, run the script again to top them up

Optional sponsor env values:

```env
SPONSOR_GAS_UPPER_BOUND="1000000000000000"
SPONSOR_GAS_VALUE="1000000000000000000"
SPONSOR_COLLATERAL_VALUE="1000000000000000000"
```

### 6. Set Up Database

```bash
npm run db:generate
npm run db:push
```

Optional seed data:

```bash
npm run db:seed
```

### 7. Start Development Servers

```bash
npm run dev
```

Your application should now be running at `http://localhost:3000`

For production-mode preview:

```bash
npm run build
npm run start
```

## Testing

### Run Tests

```bash
npm run typecheck
npm run contracts:test
npm run build
```

### Test Coverage

The current MVP validates:

- smart contract behavior through Hardhat tests
- application type safety through TypeScript
- production build integrity through `next build`

Dedicated coverage reporting is not yet configured.

## Usage

### Getting Started

1. **Connect Wallets**
   - connect Fluent for Core Space actions
   - connect an eSpace wallet for funding or payout address autofill

2. **Launch a Bounty**
   - generate or edit survey questions
   - set reward amount and deadline
   - approve and deposit USDT0 on eSpace
   - confirm Core bounty creation in Fluent

3. **Run Analysis and Settle**
   - lock submissions
   - run AI analysis
   - review clusters, highlights, high-risk entries, and preview payout
   - freeze snapshot
   - sign approval and settle

### Example Workflows

#### Workflow 1: Creator Launch and Settlement

```text
1. Connect Fluent and an eSpace wallet
2. Create the survey
3. Deposit USDT0 into RewardVault
4. Publish the bounty on Core Space
5. Wait for participant submissions
6. Lock submissions
7. Run AI analysis preview
8. Optionally exclude high-risk entries
9. Freeze snapshot
10. Sign and settle rewards
```

#### Workflow 2: Participant Submission

```text
1. Connect Fluent
2. Open an active bounty
3. Fill in the survey
4. Enter an eSpace payout address
5. Submit through the sponsored Core transaction
6. Check results after settlement
```

## Demo

### Demo Video

- **YouTube**: [InsightMesh | Global Hackfest 2026 Submission](https://youtu.be/oSJx-vxCimE?si=da_0N-vuDqgart5J)
- **Duration**: 4:45

### Screenshots

- Main Interface: <img width="2500" height="1413" alt="image" src="https://github.com/user-attachments/assets/aed0e112-c77d-45a6-8592-e0429df7b6cc" />

 - Create Bounty Page: <img width="2495" height="1408" alt="image" src="https://github.com/user-attachments/assets/fdaf5718-905d-40e5-8456-e6c01d216b5f" />

- Insights Page: <img width="2496" height="1414" alt="image" src="https://github.com/user-attachments/assets/85103ec8-e776-49cd-9606-9fe0279eabf5" />


## Smart Contracts

### Deployed Contracts

#### Testnet

| Contract | Address | Explorer |
|----------|---------|----------|
| BountyRegistry | `cfxtest:acayncftt1mtpnwhkm80v3sw5snbwkty8y2vm31evk` | [View on ConfluxScan](https://testnet.confluxscan.net/address/cfxtest:acayncftt1mtpnwhkm80v3sw5snbwkty8y2vm31evk) |
| SubmissionRegistry | `cfxtest:acbn0bar1rbh0ntu5yumrn3d6ug96z61vufd4d7rvf` | [View on ConfluxScan](https://testnet.confluxscan.net/address/cfxtest:acbn0bar1rbh0ntu5yumrn3d6ug96z61vufd4d7rvf) |
| RewardVault | `0xd544C0680baeDd71890fFd7BaAe7930D2425C657` | [View on ConfluxScan](https://evmtestnet.confluxscan.net/address/0xd544C0680baeDd71890fFd7BaAe7930D2425C657) |
| USDT0 | `0x4d1beB67e8f0102d5c983c26FDf0b7C6FFF37a0c` | [View on ConfluxScan](https://evmtestnet.confluxscan.net/address/0x4d1beB67e8f0102d5c983c26FDf0b7C6FFF37a0c) |

These addresses are the official hackathon demo deployment.

- they are provided so judges and reviewers can inspect the live contracts and testnet activity
- they are not intended to be reused as a drop-in production or self-hosted deployment
- if you point your local app at the shared demo `RewardVault`, you may still fund deposits from your own wallet, but final `distribute(...)` execution remains restricted to the vault admin configured at deployment time
- to run your own full instance, redeploy the contracts with your own Core owner / sponsor wallet and your own eSpace vault admin / relayer wallet

### Contract Interfaces

#### BountyRegistry

```solidity
interface BountyRegistry {
    function createBounty(string title, string metadataHash, uint256 rewardAmount, uint256 deadline) external returns (uint256);
    function setSubmissionRegistry(address submissionRegistryAddress) external;
    function updateStatus(uint256 bountyId, uint8 status) external;
    function getSubmissionRules(uint256 bountyId) external view returns (uint256, uint8);
}
```

#### SubmissionRegistry

```solidity
interface SubmissionRegistry {
    function submit(uint256 bountyId, bytes32 contentHash, address payoutAddress) external;
    function support(uint256 bountyId, uint256 submissionId) external;
}
```

#### RewardVault

```solidity
interface RewardVault {
    function deposit(uint256 bountyId, uint256 amount) external;
    function distribute(uint256 bountyId, address[] calldata recipients, uint256[] calldata amounts) external;
}
```

## API Documentation

### REST Endpoints

#### Core Product Endpoints

```text
GET    /api/health
GET    /api/bounty
POST   /api/bounty
GET    /api/bounty/[id]
POST   /api/bounty/[id]
POST   /api/bounty/[id]/activate
POST   /api/submission
POST   /api/ai/generate-survey
POST   /api/ai/analyze
POST   /api/ai/score
POST   /api/settle
```

#### Endpoint Roles

- `/api/bounty` - create draft bounties and list visible bounties
- `/api/bounty/[id]/activate` - verify deposit and Core creation before activation
- `/api/bounty/[id]` - lock or unlock review state
- `/api/submission` - verify and store a sponsored Core submission
- `/api/ai/generate-survey` - create survey questions from prompt input
- `/api/ai/analyze` - generate AI preview analysis while locked
- `/api/ai/score` - freeze the final snapshot and save payout entries
- `/api/settle` - verify creator approval signature and trigger reward distribution

## Security

### Security Measures

- **On-chain Reward Locking**: a bounty only becomes active after reward deposit and Core publish are both verified
- **Creator Access Control**: only the creator can access the insights page, run analysis, freeze a snapshot, and settle
- **Input Validation**: route handlers validate request payloads before execution
- **Signature-Gated Settlement**: final settlement requires creator approval before relayer distribution
- **Anti-Sybil Filtering**: duplicate payout addresses, zero-nonce payout wallets, bot-farm style responses, and manual exclusion review are part of the payout pipeline

### Known Security Considerations

- settlement is still relayer-based, so the MVP is not fully trustless
- anti-Sybil is heuristic, not identity-grade
- sponsor balance must be monitored so user gas does not unexpectedly fall back
- demo mode bypasses live chain verification and should not be treated as production behavior

## Known Issues & Limitations

### Current Limitations

- **No CrossSpaceCall Settlement**: the MVP uses relayer-based settlement rather than direct cross-space automation
- **Support UI Not Exposed**: the contract primitive exists, but the current frontend does not expose it
- **Single Public AI Path**: README and demo flow assume Gemini as the supported provider

### Known Issues

- **Wallet Network Switching**: Fluent and injected EVM wallets can require manual network switching during some flows
- **Sponsor Balance Maintenance**: sponsored submit depends on operator-funded gas and collateral balances

### Future Improvements

- stronger payout-address level Sybil defenses
- richer snapshot history and audit tooling
- broader token support and more autonomous settlement flow

## Roadmap

### Phase 1 (Hackathon) [done]

- [x] Core contracts for bounty state, submissions, and settlement vault
- [x] AI-powered survey generation
- [x] Gas-sponsored participant submission
- [x] AI analysis, high-risk review, and snapshot freeze flow
- [x] eSpace USDT0 settlement with creator approval

### Phase 2 (Post-Hackathon)

- [ ] expose support actions in the UI
- [ ] improve anti-Sybil controls further
- [ ] add richer analytics and review history
- [ ] improve operator tooling for sponsor and settlement management

### Phase 3 (Future)

- [ ] CrossSpaceCall-based settlement
- [ ] on-chain reputation and score anchoring
- [ ] multi-token reward pools
- [ ] mainnet deployment

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

### Conflux Hackathon

- **Conflux Network** - for dual-space architecture, Gas Sponsorship primitives, and ecosystem support
- **Conflux Team** - for documentation and developer tooling
- **Global Hackfest 2026 Community** - for feedback and momentum

### Third-Party Libraries

- **[Next.js](https://nextjs.org/)** - app framework
- **[Prisma](https://www.prisma.io/)** - database access layer
- **[Hardhat](https://hardhat.org/)** - smart contract development and testing
- **[Google Gemini](https://ai.google.dev/)** - survey generation and analysis

## Contact & Support

### Team Contact

- **Discord**: `gold_xxtxx`, `vividzfc`
- **GitHub**: [@Jay-Gould7](https://github.com/Jay-Gould7)

### Project Links

- **GitHub**: [https://github.com/Jay-Gould7/InsightMesh](https://github.com/Jay-Gould7/InsightMesh)
- **Demo Video**: [InsightMesh | Global Hackfest 2026 Submission](https://youtu.be/oSJx-vxCimE?si=da_0N-vuDqgart5J)

### Support

- **Issues**: [GitHub Issues](https://github.com/Jay-Gould7/InsightMesh/issues)

---

**Built for Global Hackfest 2026**
