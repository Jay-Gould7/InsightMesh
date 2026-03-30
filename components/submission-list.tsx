"use client";

import { useFluentWallet } from "@/components/providers/fluent-provider";
import { SubmissionDetail } from "@/components/submission-detail";
import { SupportButton } from "@/components/support-button";
import type { CoreSpaceConfig, SurveyQuestion } from "@/lib/types";

type SubmissionListProps = {
  bounty: {
    id: number;
    chainBountyId: number | null;
    creatorCoreAddress: string;
    questions: SurveyQuestion[];
    submissions: any[];
  };
  coreConfig: CoreSpaceConfig;
};

export function SubmissionList({ bounty, coreConfig }: SubmissionListProps) {
  const { address } = useFluentWallet();
  const isCreator = address && address.toLowerCase() === bounty.creatorCoreAddress.toLowerCase();

  if (bounty.submissions.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 px-6 py-12 text-center text-stone-400">
        No community responses yet. Submit the first one above.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-lime-300/70">Responses</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">{bounty.submissions.length} submissions</h2>
        </div>
        {isCreator ? (
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-emerald-200">
            Creator view — full details
          </span>
        ) : null}
      </div>

      {isCreator ? (
        <div className="grid gap-3">
          {bounty.submissions.map((submission: any) => (
            <div key={submission.id} className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <SubmissionDetail
                submission={submission}
                questions={bounty.questions}
              />
              <SupportButton
                bountyId={bounty.id}
                chainBountyId={bounty.chainBountyId}
                submissionId={submission.id}
                chainSubmissionId={submission.coreSubmissionId}
                coreConfig={coreConfig}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {bounty.submissions.map((submission: any) => (
            <article key={submission.id} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Submission #{submission.id}</p>
                  <p className="mt-2 text-lg font-medium text-white">{submission.summary}</p>
                </div>
                <div className="rounded-full bg-white/5 px-3 py-1 text-sm text-stone-300">{submission.supportCount} supports</div>
              </div>
              <div className="mt-5">
                <SupportButton
                  bountyId={bounty.id}
                  chainBountyId={bounty.chainBountyId}
                  submissionId={submission.id}
                  chainSubmissionId={submission.coreSubmissionId}
                  coreConfig={coreConfig}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
