# InsightMesh MVP Implementation Plan

## Summary

InsightMesh is an AI-native feedback bounty protocol on Conflux. This MVP ships a full demo loop:

1. A creator locks a `USDT0` reward pool.
   The app saves a draft bounty first so the wallet deposit can reference a stable `bountyId`.
   The creator then signs the Core `createBounty` transaction from the Fluent wallet.
2. AI generates a short feedback survey.
3. Users submit one gas-sponsored response per bounty on Core Space.
4. AI clusters and scores the responses.
5. The creator confirms the frozen payout snapshot.
6. A relayer distributes rewards on eSpace.

The first version optimizes for hackathon clarity and demo reliability, not full trustlessness.

## Locked Rules

- `Bounty` lifecycle: `PENDING_FUNDING -> ACTIVE -> ANALYZING -> READY_TO_SETTLE -> SETTLED | CANCELLED`
- A bounty becomes active only after funding is recorded.
- The creator is the final confirmer for settlement.
- Each Core address can submit once per bounty.
- Each submission binds one eSpace payout address.
- Each address can support a submission once.
- Self-support is forbidden.
- Submissions and supports after the deadline are rejected.

## Architecture

### App layer

- `app/`
  - Next.js 15 App Router pages and route handlers.
- `components/`
  - Wallet providers, bounty UI, survey form, insight actions, score table, settlement panel.
- `lib/`
  - AI generation, analysis, scoring, chain wrappers, Prisma queries, settlement signature verification.
- `prisma/schema.prisma`
  - SQLite schema for bounties, submissions, supports, analyses, and score snapshots.

### Contracts

- `contracts/core/BountyRegistry.sol`
  - Records active bounty metadata.
- `contracts/core/SubmissionRegistry.sol`
  - Enforces one submission per address, unique support, no self-support, and deadline checks.
- `contracts/espace/RewardVault.sol`
  - Accepts creator-funded `USDT0` deposits and performs one-time admin distributions.
- `contracts/mocks/MockERC20.sol`
  - Local testing token.

### Scripts

- `scripts/deploy-espace.mjs`
- `scripts/deploy-core.mjs`
- `scripts/setup-sponsor.mjs`
- `scripts/seed-demo.mjs`

## Interfaces

### Core contracts

- `createBounty(string title, string metadataHash, uint256 rewardAmount, uint256 deadline)`
- `submit(uint256 bountyId, bytes32 contentHash, address payoutAddress)`
- `support(uint256 bountyId, uint256 submissionId)`

### eSpace contract

- `deposit(uint256 bountyId, uint256 amount)`
- `distribute(uint256 bountyId, address[] recipients, uint256[] amounts)`

### API routes

- `POST /api/ai/generate-survey`
- `POST /api/ai/analyze`
- `POST /api/ai/score`
- `GET|POST /api/bounty`
- `GET /api/bounty/:id`
- `POST /api/bounty/:id/activate`
- `POST /api/submission`
- `POST /api/submission/support`
- `POST /api/settle`

## Data model highlights

- Full answers stay in SQLite.
- Chain writes store only hashes and minimal reward metadata.
- Scores are integer-based.
- Reward allocation uses deterministic floor division plus remainder distribution.
- Demo mode stays available when chain env vars are missing.

## Verification targets

- Reward vault cannot distribute more than funded.
- Draft bounty activation requires a successful creator deposit transaction and a successful Core `createBounty` transaction.
- Duplicate submit, duplicate support, self-support, and late actions revert.
- Survey payloads are renderable in the client.
- Analysis produces clusters, highlights, and a frozen snapshot.
- Settlement requires creator intent before relayer payout.
