import { z } from "zod";

export const generateSurveySchema = z.object({
  prompt: z.string().min(8),
  title: z.string().min(3).optional(),
  description: z.string().min(3).optional(),
  questionCount: z.number().int().min(3).max(8).default(4),
});

export const createBountySchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  prompt: z.string().min(8),
  rewardAmount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  deadline: z.string().datetime(),
  creatorCoreAddress: z.string().min(8),
  creatorEspaceAddress: z.string().min(8),
  questions: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["rating", "single_select", "multi_select", "text"]),
      label: z.string(),
      helperText: z.string().optional(),
      required: z.boolean().optional(),
      options: z.array(z.string()).optional(),
      placeholder: z.string().optional(),
      allowOther: z.boolean().optional(),
    }),
  ).min(3),
});

export const bountyIdSchema = z.object({
  bountyId: z.number().int().positive(),
});

export const activateBountySchema = z.object({
  depositTxHash: z.string().min(8),
  coreCreateTxHash: z.string().min(8),
});

export const submissionSchema = z.object({
  bountyId: z.number().int().positive(),
  submitterCoreAddress: z.string().min(8),
  payoutAddress: z.string().min(8),
  answers: z.record(z.any()),
  coreTxHash: z.string().min(8),
});

export const supportSchema = z.object({
  bountyId: z.number().int().positive(),
  submissionId: z.number().int().positive(),
  supporterCoreAddress: z.string().min(8),
  coreTxHash: z.string().min(8),
});

export const settlementSchema = z.object({
  bountyId: z.number().int().positive(),
  snapshotKey: z.string().min(8),
  creatorSignature: z.string().min(8),
});
