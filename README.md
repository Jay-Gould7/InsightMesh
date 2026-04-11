# InsightMesh

> **Collect better feedback. Reward real insight.**

An AI-native, on-chain feedback bounty protocol built on Conflux Network. Creators stake USDT0 rewards, participants submit feedback completely gas-free, AI clusters insights and scores contributions, then the protocol auto-distributes rewards proportional to contribution quality.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Conflux](https://img.shields.io/badge/built%20on-Conflux-blue)](https://confluxnetwork.org)
[![Hackathon](https://img.shields.io/badge/Global%20Hackfest%202026-green)](https://github.com/conflux-fans/global-hackfest-2026)

## 🏆 Hackathon Information

- **Event**: Global Hackfest 2026
- **Focus Area**: Open Innovation — Build anything you want using Conflux features
- **Submission Date**: 2026-04-20 @ 11:59:59

## 👥 Team

| Name | Role | GitHub | Discord |
|------|------|--------|---------|
| Gould | Full-Stack Development | [@Jay-Gould7](https://github.com/Jay-Gould7) | gold_xxtxx |
| vivid | Operations & Community | [@wkarry450-max](https://github.com/wkarry450-max) | vividzfc |

## 🚀 Problem Statement

**What problem does your project solve?**

Web2 surveys collect answers but waste them — data sits in CSVs, contributors get nothing, and the most valuable insights are buried under noise. There is no incentive alignment between who asks the questions and who provides the answers.

- **Why this matters**: Organizations spend billions on feedback collection but only act on a fraction of insights
- **Who is affected**: Product teams, DAO contributors, community members who give feedback for free
- **Current gaps**: Existing on-chain governance tools (Snapshot, Tally) focus on voting, not open-ended feedback. They don't reward quality contributions, and gas costs create participation barriers
- **How blockchain helps**: Transparent reward distribution, verifiable contribution records, gas sponsorship removes friction

## 💡 Solution

**How does your project address the problem?**

InsightMesh solves this with a four-stage protocol:

1. **Create & Stake** — A bounty creator describes the feedback they need. AI generates a structured survey. The creator stakes USDT0 as the reward pool on eSpace.
2. **Gasless Submit** — Any user submits feedback on Core Space with zero gas fees, thanks to Conflux's native Sponsor mechanism. No tokens needed, no onboarding friction.
3. **AI Analyze** — When ready, the creator triggers AI clustering and contribution scoring. The AI groups responses by theme, identifies standout insights, and computes a fair reward allocation.
4. **Auto-Settle** — The creator approves the frozen score snapshot. The protocol automatically distributes USDT0 to each contributor's eSpace wallet, proportional to their contribution quality.

The creator has approve/reject power but **cannot modify scores** — ensuring AI objectivity while keeping the funder in control.

## Go-to-Market Plan

### Target Users

1. **Web3 project teams** — Need structured community feedback before shipping features. Currently use Discord polls or Google Forms with zero incentive alignment.
2. **DAO governance** — Use InsightMesh for proposal feedback collection and contributor rewards. Better signal than simple yes/no votes.
3. **Hackathon & event organizers** — Collect participant feedback and reward the most constructive contributors.

### Distribution Strategy

| Phase | Strategy | Timeline |
|-------|----------|----------|
| Phase 1 | Conflux ecosystem projects — partner with Conflux Foundation for initial adoption | Q2 2026 |
| Phase 2 | Cross-chain expansion — eSpace EVM compatibility enables easy porting to other EVM chains | Q3 2026 |
| Phase 3 | Enterprise SaaS layer — Web2 companies entering Web3 can use InsightMesh for product research | Q4 2026 |

### Growth Flywheel

- **Gasless UX** removes onboarding friction → viral adoption among non-crypto users
- **AI-generated surveys** lower creation barrier → more bounties created → more participants attracted
- **On-chain contribution scores** build composable reputation → portable identity across dApps
- **USDT0 rewards** provide real monetary incentive → quality submissions → better insights → more creators

### Key Metrics

- Number of active bounties per month
- Submission count and quality scores
- Creator retention rate (repeat bounty creation)
- Gas sponsorship utilization rate

## ⚡ Conflux Integration

**How does your project leverage Conflux features?**

- [x] **Core Space** — BountyRegistry and SubmissionRegistry contracts handle bounty creation, feedback submission, and community support votes. All high-frequency user interactions happen here.
- [x] **eSpace** — RewardVault contract manages USDT0 reward pool deposits and automated distribution to contributors.
- [x] **Gas Sponsorship** — SubmissionRegistry uses `SponsorWhitelistControl` to cover all gas and storage collateral for participant submissions. Users pay exactly 0 CFX.
- [x] **Built-in Contracts** — `SponsorWhitelistControl` internal contract is used to set up gas and collateral sponsorship for the submission contract.
- [x] **Tree-Graph Consensus** — Handles burst feedback submissions at scale. Surveys can attract hundreds of concurrent responses without congestion.
- [ ] **Cross-Space Bridge** — Planned for automated Core→eSpace settlement (currently a stretch goal using relayer-based settlement).

### Partner Integrations

- [ ] **Privy** — Not used
- [ ] **Pyth Network** — Not used
- [ ] **LayerZero** — Not used
- [x] **Other** — Google Gemini AI for survey generation, clustering analysis, and contribution scoring

### Why Conflux?

| Conflux Feature | How InsightMesh Uses It |
|-----------------|------------------------|
| Tree-Graph consensus | Handles burst submissions at scale — surveys can attract hundreds of concurrent responses |
| Native Gas Sponsorship | Zero-cost participation — the single most important UX feature for non-crypto users |
| Dual-Space Architecture | Separates high-frequency UX (Core) from financial settlement (eSpace) |
| eSpace EVM compatibility | USDT0 reward pools use standard ERC-20 patterns, enabling future cross-chain expansion |

## ✨ Features

### Core Features

- **AI Survey Generation** — Describe what feedback you need, AI creates a structured multi-question survey
- **Dual-Wallet Hub** — Seamless Fluent (Core) + MetaMask (eSpace) wallet management
- **Gasless Feedback** — Participants submit responses with 0 gas via Core Space sponsorship
- **AI Clustering & Scoring** — Gemini AI groups responses by theme and scores each contribution
- **Automated USDT0 Settlement** — Protocol distributes rewards proportional to contribution scores

### Advanced Features

- **Creator Access Control** — Only the bounty creator can trigger analysis, freeze snapshots, and settle
- **Permission-Gated Views** — Creator sees full submission details; others see summary only
- **Community Support Voting** — Users can support submissions they agree with, adding consensus signal to AI scoring

### Future Features (Roadmap)

- **CrossSpaceCall Automation** — Replace relayer-based settlement with direct Core→eSpace cross-space calls
- **On-chain Reputation** — Accumulate contribution scores into a composable on-chain identity
- **Multi-token Reward Pools** — Support CFX, AxCNH, and other tokens beyond USDT0

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router), React 19
- **Styling**: Tailwind CSS v4
- **Web3 Integration**: `js-conflux-sdk` (Core Space), `viem` (eSpace)

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **Database**: Prisma ORM + SQLite
- **APIs**: REST (Next.js Route Handlers)

### Blockchain
- **Network**: Conflux Core Space + eSpace (Dual-Space)
- **Smart Contracts**: Solidity 0.8.24
- **Development**: Hardhat
- **Testing**: Hardhat + Mocha

### Infrastructure
- **AI**: Google Gemini API (structured JSON generation)
- **Wallets**: Fluent Wallet (Core), MetaMask (eSpace)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Frontend                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐              │
│  │  Create   │  │  Submit   │  │  Insights  │             │
│  │  Bounty   │  │  Feedback │  │  & Settle  │             │
│  └─────┬─────┘  └─────┬─────┘  └─────┬──────┘             │
│        │              │              │                     │
├────────┼──────────────┼──────────────┼─────────────────────┤
│        │     API Routes (Server)     │                     │
│        │              │              │                     │
│  ┌─────▼─────┐  ┌─────▼─────┐  ┌────▼─────┐              │
│  │  Prisma   │  │  Gemini   │  │  Chain    │              │
│  │  SQLite   │  │  AI API   │  │  Clients  │              │
│  └───────────┘  └───────────┘  └────┬──────┘              │
└─────────────────────────────────────┼──────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────┐
              │                       │                   │
    ┌─────────▼──────────┐  ┌────────▼─────────┐
    │   Core Space        │  │   eSpace          │
    │                     │  │                   │
    │  BountyRegistry     │  │  RewardVault      │
    │  SubmissionRegistry │  │  (USDT0 deposit   │
    │  (gas-sponsored)    │  │   & distribute)   │
    └─────────────────────┘  └───────────────────┘
```

**Data Flow**: Creator publishes bounty → participants submit gasless feedback on Core → AI clusters and scores → creator freezes snapshot → protocol distributes USDT0 on eSpace.

## 📋 Prerequisites

- **Node.js** (v18.0.0 or higher)
- **npm**
- **Git**
- **Fluent Wallet** ([Download](https://fluentwallet.com/)) — for Core Space interactions
- **MetaMask** ([Download](https://metamask.io/)) — for eSpace interactions

## 🚀 Installation & Setup

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

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_NAME="InsightMesh"
NEXT_PUBLIC_DEMO_MODE="true"
GEMINI_API_KEY="your_gemini_api_key"
GEMINI_MODEL="gemini-3-flash-preview"
CONFLUX_CORE_RPC_URL="https://test.confluxrpc.com"
CONFLUX_CORE_NETWORK_ID="1"
ESPACE_RPC_URL="https://evmtestnet.confluxrpc.com"
ESPACE_CHAIN_ID="71"
```

### 4. Set Up Database

```bash
npm run db:generate
npm run db:push
```

### 5. Start Development Server

```bash
npm run dev
```

Your application should now be running at `http://localhost:3000`

### Smart Contract Deployment (optional)

```bash
npm run contracts:compile
node scripts/deploy-espace.mjs      # Deploy RewardVault to eSpace
node scripts/deploy-core.mjs        # Deploy BountyRegistry + SubmissionRegistry to Core
node scripts/setup-sponsor.mjs      # Set up gas sponsorship for SubmissionRegistry
```

## 🧪 Testing

```bash
# Type checking
npm run typecheck

# Smart contract tests
npm run contracts:test
```

## 📱 Usage

### As a Bounty Creator

1. **Connect Wallets** — Open the app, connect Fluent (Core) + MetaMask (eSpace)
2. **Create Bounty** — Click "Launch a bounty", describe the feedback you need
3. **AI Survey** — AI generates structured questions, customize as needed
4. **Set Rewards** — Choose USDT0 reward amount and deadline
5. **Publish** — Deposits USDT0 to vault + creates bounty on-chain
6. **Analyze** — Trigger AI analysis from the Insights page when ready
7. **Freeze** — Review clustered insights, freeze the score snapshot
8. **Settle** — Confirm settlement, USDT0 auto-distributes to contributors

### As a Participant

1. **Connect Wallet** — Connect Fluent wallet (Core Space)
2. **Browse** — Find active bounties on the dashboard
3. **Submit** — Fill out the feedback survey and submit (**zero gas fee**)
4. **Support** — Optionally support other submissions you agree with
5. **Earn** — Receive USDT0 rewards proportional to your contribution score

## 🎬 Demo

### Demo Video
- **YouTube**: [Link] <!-- TODO: Add demo video link -->
- **Duration**: 3-5 minutes

### Participant Intro Video
- **YouTube**: [Link] <!-- TODO: Add intro video link -->
- **Duration**: 30-60 seconds

## 📄 Smart Contracts

All contracts are written in Solidity 0.8.24 and deployed on Conflux Testnet.

### Deployed Contracts

#### Testnet

| Contract | Network | Address | Explorer |
|----------|---------|---------|----------|
| BountyRegistry | Core Testnet | `cfxtest:acayncftt1mtpnwhkm80v3sw5snbwkty8y2vm31evk` | [View on ConfluxScan](https://testnet.confluxscan.net/address/cfxtest:acayncftt1mtpnwhkm80v3sw5snbwkty8y2vm31evk) |
| SubmissionRegistry | Core Testnet | `cfxtest:acbn0bar1rbh0ntu5yumrn3d6ug96z61vufd4d7rvf` | [View on ConfluxScan](https://testnet.confluxscan.net/address/cfxtest:acbn0bar1rbh0ntu5yumrn3d6ug96z61vufd4d7rvf) |
| RewardVault | eSpace Testnet | `0xd544C0680baeDd71890fFd7BaAe7930D2425C657` | [View on ConfluxScan](https://evmtestnet.confluxscan.net/address/0xd544C0680baeDd71890fFd7BaAe7930D2425C657) |

### Contract Interfaces

#### BountyRegistry

```solidity
interface IBountyRegistry {
    function createBounty(string title, string metadataHash, uint256 rewardAmount, uint256 deadline) external;
    function updateBountyStatus(uint256 bountyId, BountyStatus status) external;
    function setSubmissionRegistry(address submissionRegistryAddress) external;

    event BountyCreated(uint256 indexed bountyId, address indexed creator, uint256 rewardAmount, uint256 deadline);
    event BountyStatusChanged(uint256 indexed bountyId, BountyStatus status);
}
```

#### SubmissionRegistry

```solidity
interface ISubmissionRegistry {
    function submit(uint256 bountyId, bytes32 contentHash, address payoutAddress) external;
    function support(uint256 bountyId, uint256 submissionId) external;

    event SubmissionRecorded(uint256 indexed bountyId, uint256 indexed submissionId, address indexed submitter, address payoutAddress, bytes32 contentHash);
    event SubmissionSupported(uint256 indexed bountyId, uint256 indexed submissionId, address indexed supporter);
}
```

#### RewardVault

```solidity
interface IRewardVault {
    function deposit(uint256 bountyId, uint256 amount) external;
    function distribute(uint256 bountyId, address[] recipients, uint256[] amounts) external;

    event RewardDeposited(uint256 indexed bountyId, address indexed funder, uint256 amount);
    event RewardDistributed(uint256 indexed bountyId, address indexed recipient, uint256 amount);
}
```

## 🔒 Security

### Security Measures

- **Creator Access Control** — Only the bounty creator can trigger AI analysis, freeze score snapshots, and initiate settlement. Enforced both client-side (CreatorGate component) and server-side (API caller verification).
- **Input Validation** — All API endpoints validate inputs using Zod schemas before processing
- **Permission-Gated Views** — Non-creators cannot view raw submission data, only aggregate summaries
- **On-chain Verification** — Activate endpoint verifies deposit transaction hash, creator address, metadata hash, and reward amount against on-chain data before activating a bounty

### Known Security Considerations

- Relayer private key is stored server-side for settlement distribution — future improvement would use CrossSpaceCall
- AI scoring is deterministic given the same inputs but relies on Gemini API availability
- Demo mode bypasses on-chain verification for local testing

## 🚧 Known Issues & Limitations

### Current Limitations

- **No CrossSpaceCall** — Settlement uses a relayer rather than automated cross-space calls (stretch goal)
- **Single AI Provider** — Currently depends on Google Gemini; fallback to other providers is planned
- **SQLite** — Works for MVP/demo; production would need PostgreSQL or similar

### Known Issues

- Fluent wallet occasionally requires network switch prompt when toggling between Core and eSpace
- Gas sponsorship balance must be monitored; depleted collateral falls back to user-paid gas

## 🗺️ Roadmap

### Phase 1 (Hackathon) ✅

- [x] Core smart contracts (BountyRegistry, SubmissionRegistry, RewardVault)
- [x] AI-powered survey generation
- [x] Gasless submission via Core Space sponsorship
- [x] AI clustering and contribution scoring
- [x] Automated USDT0 reward distribution
- [x] Creator access control and permission gating
- [x] Demo on Conflux Testnet

### Phase 2 (Post-Hackathon)

- [ ] CrossSpaceCall automation for settlement
- [ ] On-chain contribution reputation system
- [ ] Multi-token reward pools (CFX, AxCNH)
- [ ] Security audit
- [ ] Mainnet deployment

### Phase 3 (Future)

- [ ] Mobile-optimized responsive UI
- [ ] Recursive bounties (follow-up rounds)
- [ ] Enterprise SaaS dashboard
- [ ] Cross-chain expansion to other EVM networks
- [ ] Third-party analytics integrations

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

### Conflux Hackathon

- **[Conflux Network](https://confluxnetwork.org/)** — Dual-space architecture, gas sponsorship, and developer support
- **Conflux Team** — Technical guidance and infrastructure
- **Global Hackfest 2026 Community** — Feedback and encouragement

### Third-Party Libraries

- **[Next.js](https://nextjs.org/)** — React framework for the frontend application
- **[Prisma](https://www.prisma.io/)** — TypeScript ORM for database access
- **[viem](https://viem.sh/)** — TypeScript interface for eSpace interactions
- **[js-conflux-sdk](https://github.com/Conflux-Chain/js-conflux-sdk)** — JavaScript SDK for Core Space
- **[Google Gemini](https://ai.google.dev/)** — AI-powered survey generation, clustering, and scoring

## 📞 Contact & Support

### Team Contact

- **Discord**: gold_xxtxx, vividzfc
- **GitHub**: [@Jay-Gould7](https://github.com/Jay-Gould7)

### Project Links

- **GitHub**: [https://github.com/Jay-Gould7/InsightMesh](https://github.com/Jay-Gould7/InsightMesh)
- **Demo Video**: [YouTube Link] <!-- TODO: Add link -->

### Support

- **Issues**: [GitHub Issues](https://github.com/Jay-Gould7/InsightMesh/issues)

---

**Built with ❤️ for Global Hackfest 2026**

*Thank you for checking out InsightMesh! We hope it contributes to the growth and innovation of the Conflux ecosystem.*
