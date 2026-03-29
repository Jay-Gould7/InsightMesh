# InsightMesh

AI-native feedback bounties built for Conflux.

## What this MVP does

- Locks a `USDT0` reward pool before a bounty becomes active.
  The creator wallet approves and deposits the reward pool directly on eSpace.
- Uses the creator's Fluent wallet to publish the bounty on Core Space.
- Lets AI generate a short feedback survey.
- Records one gas-sponsored response per Core address.
- Clusters and scores submissions offchain.
- Freezes a creator-approved snapshot before eSpace reward distribution.

## Stack

- Next.js 15 App Router
- Tailwind CSS v4
- Prisma + SQLite
- Solidity 0.8.24 + Hardhat
- `js-conflux-sdk` for Core Space scripts
- `viem` for eSpace writes

## Quick start

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

## Useful commands

```bash
npm run typecheck
npm run contracts:compile
npm run contracts:test
node scripts/deploy-espace.mjs
node scripts/deploy-core.mjs
node scripts/setup-sponsor.mjs
```

## Environment

Copy `.env.example` to `.env` and fill in chain addresses when you want to move beyond demo mode.
The default SQLite URL stays as `file:./dev.db`; app runtime code normalizes it to the `prisma/dev.db` file so it works on Windows paths with spaces too.
In live mode, the creator wallet handles `approve + deposit`; the eSpace relayer key is only needed for final reward distribution.
Core `createBounty`, `submit`, and `support` are wallet-signed on Core Space; sponsor funding can still cover participant gas for submissions and supports.

## Current MVP assumptions

- Settlement uses `AI recommendation + creator confirmation + relayer payout`.
- Core sponsorship is configured after deployment, not from constructors.
- `CrossSpaceCall` automation is intentionally left as a stretch goal.
