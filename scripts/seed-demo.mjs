import path from "node:path";
import { PrismaClient, BountyStatus, AnalysisStatus } from "@prisma/client";

function normalizeDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl?.startsWith("file:./")) {
    return;
  }

  const relativePath = databaseUrl.slice("file:".length);
  const absolutePath = path.resolve(process.cwd(), "prisma", relativePath).replace(/\\/g, "/");
  process.env.DATABASE_URL = `file:${absolutePath}`;
}

normalizeDatabaseUrl();

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.bounty.count();
  if (existing > 0) {
    console.log("Seed skipped: bounties already exist.");
    return;
  }

  const questions = [
    { id: "satisfaction", type: "rating", label: "How satisfied are you with the current wallet experience?", required: true },
    { id: "pain-point", type: "text", label: "What is the biggest pain point today?", required: true },
    { id: "focus-area", type: "multi_select", label: "Which areas need the most attention?", options: ["Onboarding", "Performance", "Mobile UX", "Rewards"], required: true },
    { id: "proposal", type: "text", label: "What specific change would have the highest impact?", required: true },
  ];

  const bounty = await prisma.bounty.create({
    data: {
      title: "Wallet Growth Sprint Feedback",
      description: "A live demo bounty collecting roadmap suggestions for the next Conflux wallet sprint.",
      prompt: "What should the wallet team prioritize next?",
      rewardAmount: "100.00",
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      creatorCoreAddress: "cfxtest:aam3u4p4s5m4uwp4r0demo000000000000000000",
      creatorEspaceAddress: "0x1111111111111111111111111111111111111111",
      questions: JSON.stringify(questions),
      metadataHash: "0xmeta-demo",
      vaultDepositTx: "0xvault-demo",
      coreCreateTx: "0xcore-demo",
      chainBountyId: 1,
      status: BountyStatus.READY_TO_SETTLE,
      analysisStatus: AnalysisStatus.COMPLETED,
    },
  });

  const submissionInputs = [
    { submitterCoreAddress: "cfxtest:alice-demo", payoutAddress: "0x2222222222222222222222222222222222222222", contentHash: "0xhash-a", answers: { satisfaction: 3, "pain-point": "Importing wallets is confusing.", proposal: "Turn import into a guided checklist." }, summary: "Guided import checklist for first-time users.", supportCount: 2, coreSubmissionId: 1, coreTxHash: "0xsub-a" },
    { submitterCoreAddress: "cfxtest:bob-demo", payoutAddress: "0x3333333333333333333333333333333333333333", contentHash: "0xhash-b", answers: { satisfaction: 2, "pain-point": "Mobile performance drops during network switching.", proposal: "Optimize mobile switching and confirmation speed." }, summary: "Improve mobile switching and confirmation performance.", supportCount: 1, coreSubmissionId: 2, coreTxHash: "0xsub-b" },
    { submitterCoreAddress: "cfxtest:carol-demo", payoutAddress: "0x4444444444444444444444444444444444444444", contentHash: "0xhash-c", answers: { satisfaction: 4, "pain-point": "Rewards are hard to understand.", proposal: "Add a reward explainer and campaign tracker." }, summary: "Make rewards transparent with a campaign tracker.", supportCount: 3, coreSubmissionId: 3, coreTxHash: "0xsub-c" },
  ];

  const submissions = [];
  for (const input of submissionInputs) {
    const submission = await prisma.submission.create({ data: { ...input, bountyId: bounty.id, answers: JSON.stringify(input.answers) } });
    submissions.push(submission);
  }

  await prisma.analysis.create({
    data: {
      bountyId: bounty.id,
      aiModel: "gemini-2.5-flash",
      snapshotKey: "snapshot_demo_seed",
      clusters: JSON.stringify([
        { id: "onboarding", theme: "Onboarding Flow", count: 1, summary: "Guided wallet import and setup.", signal: ["guided import checklist"], submissionIds: [submissions[0].id] },
        { id: "performance", theme: "Performance", count: 1, summary: "Mobile network switching feels slow.", signal: ["optimize mobile switching"], submissionIds: [submissions[1].id] },
        { id: "rewards", theme: "Incentives", count: 1, summary: "Reward communication is unclear.", signal: ["reward explainer"], submissionIds: [submissions[2].id] },
      ]),
      duplicates: JSON.stringify([]),
      highlights: JSON.stringify([{ submissionId: submissions[0].id, title: "Onboarding Flow", reason: "Earliest high-signal onboarding idea.", bonusType: "discovery", bonusPoints: 12 }]),
      scoreBreakdown: JSON.stringify([]),
    },
  });

  const snapshot = await prisma.scoreSnapshot.create({
    data: {
      bountyId: bounty.id,
      snapshotKey: "snapshot_demo_seed",
      rewardPool: "100.00",
      totalPoints: 136,
      createdBy: bounty.creatorEspaceAddress,
    },
  });

  await prisma.scoreEntry.createMany({
    data: [
      { snapshotId: snapshot.id, submissionId: submissions[0].id, participationPts: 10, qualityPts: 22, discoveryBonus: 12, consensusBonus: 9, totalPoints: 53, rewardAmount: "38.97", rank: 1 },
      { snapshotId: snapshot.id, submissionId: submissions[2].id, participationPts: 10, qualityPts: 24, discoveryBonus: 0, consensusBonus: 13, totalPoints: 47, rewardAmount: "34.56", rank: 2 },
      { snapshotId: snapshot.id, submissionId: submissions[1].id, participationPts: 10, qualityPts: 18, discoveryBonus: 0, consensusBonus: 8, totalPoints: 36, rewardAmount: "26.47", rank: 3 },
    ],
  });

  console.log(`Seeded demo bounty ${bounty.id}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
