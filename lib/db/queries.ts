import { AnalysisStatus, BountyStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { AnalysisCluster, InsightHighlight, ScoreBreakdownEntry, SurveyQuestion } from "@/lib/types";

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function hydrateBounty(bounty: any): any {
  if (!bounty) return bounty;

  return {
    ...bounty,
    questions: typeof bounty.questions === "string" ? parseJson<SurveyQuestion[]>(bounty.questions, []) : bounty.questions,
    submissions: Array.isArray(bounty.submissions)
      ? bounty.submissions.map((submission: any) => ({
          ...submission,
          answers: typeof submission.answers === "string" ? parseJson<Record<string, unknown>>(submission.answers, {}) : submission.answers,
        }))
      : bounty.submissions,
    analysis: bounty.analysis
      ? {
          ...bounty.analysis,
          clusters: typeof bounty.analysis.clusters === "string" ? parseJson<AnalysisCluster[]>(bounty.analysis.clusters, []) : bounty.analysis.clusters,
          duplicates: typeof bounty.analysis.duplicates === "string" ? parseJson<number[][]>(bounty.analysis.duplicates, []) : bounty.analysis.duplicates,
          highlights: typeof bounty.analysis.highlights === "string" ? parseJson<InsightHighlight[]>(bounty.analysis.highlights, []) : bounty.analysis.highlights,
          scoreBreakdown: typeof bounty.analysis.scoreBreakdown === "string" ? parseJson<ScoreBreakdownEntry[]>(bounty.analysis.scoreBreakdown, []) : bounty.analysis.scoreBreakdown,
        }
      : bounty.analysis,
    scoreSnapshot: bounty.scoreSnapshot
      ? {
          ...bounty.scoreSnapshot,
          entries: Array.isArray(bounty.scoreSnapshot.entries)
            ? bounty.scoreSnapshot.entries.map((entry: any) => ({
                ...entry,
                submission: entry.submission
                  ? {
                      ...entry.submission,
                      answers:
                        typeof entry.submission.answers === "string"
                          ? parseJson<Record<string, unknown>>(entry.submission.answers, {})
                          : entry.submission.answers,
                    }
                  : entry.submission,
              }))
            : bounty.scoreSnapshot.entries,
        }
      : bounty.scoreSnapshot,
  };
}

export async function listVisibleBounties(options?: { search?: string; status?: BountyStatus; page?: number; pageSize?: number }) {
  const { search, status, page = 1, pageSize = 10 } = options ?? {};
  const skip = (page - 1) * pageSize;

  const where: any = {
    status: status
      ? { equals: status }
      : {
          in: [BountyStatus.ACTIVE, BountyStatus.ANALYZING, BountyStatus.READY_TO_SETTLE, BountyStatus.SETTLED],
        },
  };

  if (search) {
    where.OR = [{ title: { contains: search } }, { description: { contains: search } }];
  }

  const [bounties, totalCount, statusCounts] = await Promise.all([
    prisma.bounty.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        analysis: true,
        scoreSnapshot: {
          include: {
            entries: {
              include: { submission: true },
              orderBy: [{ totalPoints: "desc" }, { submissionId: "asc" }],
            },
          },
        },
        submissions: {
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.bounty.count({ where }),
    prisma.bounty.groupBy({
      by: ["status"],
      where: {
        status: {
          in: [BountyStatus.ACTIVE, BountyStatus.ANALYZING, BountyStatus.READY_TO_SETTLE, BountyStatus.SETTLED],
        },
      },
      _count: true,
    }),
  ]);

  const counts: Record<string, number> = {
    ACTIVE: 0,
    ANALYZING: 0,
    READY_TO_SETTLE: 0,
    SETTLED: 0,
    TOTAL_SUBMISSIONS: 0,
  };

  statusCounts.forEach((sc) => {
    counts[sc.status] = sc._count;
  });

  // Get global submission count (approximate or precise)
  const totalSubmissions = await prisma.submission.count({
    where: {
      bounty: {
        status: {
          in: [BountyStatus.ACTIVE, BountyStatus.ANALYZING, BountyStatus.READY_TO_SETTLE, BountyStatus.SETTLED],
        },
      },
    },
  });

  return {
    bounties: bounties.map((bounty) => hydrateBounty(bounty)),
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    stats: {
      ACTIVE: (counts.ACTIVE || 0) as number,
      ANALYZING: (counts.ANALYZING || 0) as number,
      READY_TO_SETTLE: (counts.READY_TO_SETTLE || 0) as number,
      SETTLED: (counts.SETTLED || 0) as number,
      submissions: totalSubmissions,
    },
  };
}

export async function getBountyDetail(id: number) {
  const bounty = await prisma.bounty.findUnique({
    where: { id },
    include: {
      analysis: true,
      submissions: {
        include: {
          scoreEntry: true,
          receivedSupports: true,
        },
        orderBy: { createdAt: "asc" },
      },
      scoreSnapshot: {
        include: {
          entries: {
            include: { submission: true },
            orderBy: [{ totalPoints: "desc" }, { submissionId: "asc" }],
          },
        },
      },
    },
  });

  return bounty ? hydrateBounty(bounty) : null;
}

export async function createDraftBounty(input: {
  title: string;
  description: string;
  prompt: string;
  rewardAmount: string;
  deadline: string;
  creatorCoreAddress: string;
  creatorEspaceAddress: string;
  questions: SurveyQuestion[];
}) {
  return prisma.bounty.create({
    data: {
      title: input.title,
      description: input.description,
      prompt: input.prompt,
      rewardAmount: input.rewardAmount,
      deadline: new Date(input.deadline),
      creatorCoreAddress: input.creatorCoreAddress,
      creatorEspaceAddress: input.creatorEspaceAddress,
      questions: JSON.stringify(input.questions),
      status: BountyStatus.PENDING_FUNDING,
      analysisStatus: AnalysisStatus.IDLE,
    },
  });
}

export async function recordVaultDeposit(id: number, vaultDepositTx: string) {
  return prisma.bounty.update({
    where: { id },
    data: { vaultDepositTx },
  });
}

export async function activateBounty(id: number, payload: { metadataHash: string; chainBountyId: number; vaultDepositTx?: string; coreCreateTx: string }) {
  return prisma.bounty.update({
    where: { id },
    data: {
      metadataHash: payload.metadataHash,
      chainBountyId: payload.chainBountyId,
      vaultDepositTx: payload.vaultDepositTx,
      coreCreateTx: payload.coreCreateTx,
      status: BountyStatus.ACTIVE,
    },
  });
}

export async function markAnalyzing(id: number) {
  return prisma.bounty.update({
    where: { id },
    data: { status: BountyStatus.ANALYZING, analysisStatus: AnalysisStatus.PENDING },
  });
}

export async function saveAnalysis(
  bountyId: number,
  payload: { clusters: AnalysisCluster[]; duplicates: number[][]; highlights: InsightHighlight[]; scoreBreakdown: ScoreBreakdownEntry[]; snapshotKey?: string },
) {
  await prisma.analysis.upsert({
    where: { bountyId },
    create: {
      bountyId,
      clusters: JSON.stringify(payload.clusters),
      duplicates: JSON.stringify(payload.duplicates),
      highlights: JSON.stringify(payload.highlights),
      scoreBreakdown: JSON.stringify(payload.scoreBreakdown),
      aiModel: "gemini-2.5-flash",
      snapshotKey: payload.snapshotKey,
    },
    update: {
      clusters: JSON.stringify(payload.clusters),
      duplicates: JSON.stringify(payload.duplicates),
      highlights: JSON.stringify(payload.highlights),
      scoreBreakdown: JSON.stringify(payload.scoreBreakdown),
      aiModel: "gemini-2.5-flash",
      snapshotKey: payload.snapshotKey,
    },
  });

  await prisma.bounty.update({
    where: { id: bountyId },
    data: { analysisStatus: AnalysisStatus.COMPLETED, status: BountyStatus.READY_TO_SETTLE },
  });
}

export async function createSubmission(input: {
  bountyId: number;
  submitterCoreAddress: string;
  payoutAddress: string;
  contentHash: string;
  answers: Record<string, unknown>;
  summary: string;
  coreSubmissionId: number;
  coreTxHash: string;
}) {
  return prisma.submission.create({
    data: {
      bountyId: input.bountyId,
      submitterCoreAddress: input.submitterCoreAddress,
      payoutAddress: input.payoutAddress,
      contentHash: input.contentHash,
      answers: JSON.stringify(input.answers),
      summary: input.summary,
      coreSubmissionId: input.coreSubmissionId,
      coreTxHash: input.coreTxHash,
    },
  });
}

export async function createSupport(input: { bountyId: number; submissionId: number; supporterCoreAddress: string }) {
  return prisma.$transaction(async (tx) => {
    const support = await tx.support.create({
      data: {
        bountyId: input.bountyId,
        submissionId: input.submissionId,
        supporterCoreAddress: input.supporterCoreAddress,
      },
    });

    await tx.submission.update({ where: { id: input.submissionId }, data: { supportCount: { increment: 1 } } });
    return support;
  });
}

export async function saveScoreSnapshot(input: { bountyId: number; snapshotKey: string; rewardPool: string; totalPoints: number; createdBy: string; entries: ScoreBreakdownEntry[] }) {
  await prisma.scoreEntry.deleteMany({ where: { snapshot: { bountyId: input.bountyId } } });

  await prisma.scoreSnapshot.upsert({
    where: { bountyId: input.bountyId },
    create: {
      bountyId: input.bountyId,
      snapshotKey: input.snapshotKey,
      rewardPool: input.rewardPool,
      totalPoints: input.totalPoints,
      createdBy: input.createdBy,
      entries: {
        create: input.entries.map((entry, index) => ({
          submissionId: entry.submissionId,
          participationPts: entry.participationPts,
          qualityPts: entry.qualityPts,
          discoveryBonus: entry.discoveryBonus,
          consensusBonus: entry.consensusBonus,
          totalPoints: entry.totalPoints,
          rewardAmount: entry.rewardAmount,
          rank: index + 1,
        })),
      },
    },
    update: {
      snapshotKey: input.snapshotKey,
      rewardPool: input.rewardPool,
      totalPoints: input.totalPoints,
      createdBy: input.createdBy,
      entries: {
        create: input.entries.map((entry, index) => ({
          submissionId: entry.submissionId,
          participationPts: entry.participationPts,
          qualityPts: entry.qualityPts,
          discoveryBonus: entry.discoveryBonus,
          consensusBonus: entry.consensusBonus,
          totalPoints: entry.totalPoints,
          rewardAmount: entry.rewardAmount,
          rank: index + 1,
        })),
      },
    },
  });
}

export async function attachCreatorSignature(bountyId: number, creatorSignature: string) {
  return prisma.scoreSnapshot.update({ where: { bountyId }, data: { creatorSignature } });
}

export async function markSettled(bountyId: number, settlementTx: string) {
  const now = new Date();
  await prisma.scoreEntry.updateMany({ where: { snapshot: { bountyId } }, data: { settled: true } });
  return prisma.bounty.update({ where: { id: bountyId }, data: { status: BountyStatus.SETTLED, settlementTx, settledAt: now } });
}
