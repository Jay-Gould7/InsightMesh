"use client";

import type { BountyStatus } from "@prisma/client";

import { useFluentWallet } from "@/components/providers/fluent-provider";
import { SubmissionDetail } from "@/components/submission-detail";
import { normalizeCoreAddress } from "@/lib/conflux/address";
import type { CoreSpaceConfig, SurveyQuestion } from "@/lib/types";

type SubmissionListProps = {
  bounty: {
    id: number;
    chainBountyId: number | null;
    creatorCoreAddress: string;
    status: BountyStatus;
    questions: SurveyQuestion[];
    submissions: Array<{
      id: number;
      summary: string;
      answers: Record<string, unknown>;
      submitterCoreAddress: string;
      payoutAddress: string;
      createdAt: string;
    }>;
  };
  coreConfig: CoreSpaceConfig;
};

export function SubmissionList({ bounty }: SubmissionListProps) {
  const { address } = useFluentWallet();
  const normalizedAddress = normalizeCoreAddress(address);
  const normalizedCreatorAddress = normalizeCoreAddress(bounty.creatorCoreAddress);
  const isCreator =
    Boolean(normalizedAddress) && normalizedAddress === normalizedCreatorAddress;
  const isSettled = bounty.status === "SETTLED";
  const visibleSubmissions =
    isCreator || isSettled
      ? bounty.submissions
      : normalizedAddress
        ? bounty.submissions.filter(
            (submission) =>
              normalizeCoreAddress(submission.submitterCoreAddress) === normalizedAddress,
          )
        : [];

  const totalCount = bounty.submissions.length;
  const visibleCount = visibleSubmissions.length;

  if (totalCount === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 px-6 py-12 text-center text-stone-400">
        No community responses yet. Submit the first one above.
      </div>
    );
  }

  if (!isCreator && !isSettled && !normalizedAddress) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Responses</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              Connect to view your submission
            </h2>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-stone-300">
            Private before settlement
          </span>
        </div>

        <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-12 text-center text-stone-400 backdrop-blur-xl">
          Connect your Core wallet to view your own response. Once the bounty is settled, every
          submission becomes visible to everyone.
        </div>
      </section>
    );
  }

  if (!isCreator && !isSettled && visibleCount === 0) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Responses</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              Your submission is not available
            </h2>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-stone-300">
            Private before settlement
          </span>
        </div>

        <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-12 text-center text-stone-400 backdrop-blur-xl">
          Before settlement, only the bounty creator can view all submissions. Other participants
          can only view their own submitted response.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Responses</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">
            {isCreator || isSettled
              ? `${totalCount} submissions`
              : `${visibleCount} visible submission${visibleCount === 1 ? "" : "s"}`}
          </h2>
        </div>
        {isSettled ? (
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-emerald-200">
            Settled view / public details
          </span>
        ) : isCreator ? (
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-emerald-200">
            Creator view / full details
          </span>
        ) : (
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-stone-300">
            Your response only
          </span>
        )}
      </div>

      <div className="grid gap-5">
        {visibleSubmissions.map((submission) => (
          <SubmissionDetail
            key={submission.id}
            submission={submission}
            questions={bounty.questions}
          />
        ))}
      </div>
    </section>
  );
}
