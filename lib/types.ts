export type SurveyQuestionType = "rating" | "single_select" | "multi_select" | "text";

export type SurveyQuestion = {
  id: string;
  type: SurveyQuestionType;
  label: string;
  helperText?: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  allowOther?: boolean;
};

export type AnalysisCluster = {
  id: string;
  theme: string;
  count: number;
  summary: string;
  signal: string[];
  submissionIds: number[];
};

export type InsightHighlight = {
  submissionId: number;
  title: string;
  reason: string;
  bonusType: "discovery" | "quality" | "consensus";
  bonusPoints: number;
};

export type ScoreBreakdownEntry = {
  submissionId: number;
  submitterCoreAddress: string;
  payoutAddress: string;
  participationPts: number;
  qualityPts: number;
  discoveryBonus: number;
  consensusBonus: number;
  totalPoints: number;
  rewardAmount: string;
  summary: string;
};

export type AnalysisPayload = {
  clusters: AnalysisCluster[];
  duplicates: number[][];
  highlights: InsightHighlight[];
  scoreBreakdown: ScoreBreakdownEntry[];
  qualityRatings: Record<number, number>;
};

export type CreateBountyInput = {
  title: string;
  description: string;
  prompt: string;
  rewardAmount: string;
  deadline: string;
  creatorCoreAddress: string;
  creatorEspaceAddress: string;
  questions: SurveyQuestion[];
};

export type FundingMode = "demo" | "wallet";

export type BountyFundingConfig = {
  mode: FundingMode;
  chainId: number;
  rpcUrl: string;
  rewardVaultAddress: string;
  usdt0Address: string;
  decimals: number;
};

export type CoreSpaceConfig = {
  mode: FundingMode;
  networkId: number;
  rpcUrl: string;
  bountyRegistryAddress: string;
  submissionRegistryAddress: string;
  rewardDecimals: number;
};
