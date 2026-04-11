import { z } from 'zod';

import { GSTReturnType, JournalSourceType, LedgerType } from '@repo/types';

import { financialYearSchema, paiseSchema } from './compliance';

export const createJournalEntrySchema = z.object({
  date: z.coerce.date(),
  description: z.string().min(1).max(500),
  debitLedger: z.string().min(1),
  creditLedger: z.string().min(1),
  amount: paiseSchema,
  sourceType: z.nativeEnum(JournalSourceType).default(JournalSourceType.MANUAL),
  sourceId: z.string().uuid().optional().nullable(),
  financialYear: financialYearSchema,
});

export const createLedgerSchema = z.object({
  name: z.string().min(1).max(120),
  type: z.nativeEnum(LedgerType),
  parentId: z.string().uuid().optional().nullable(),
  code: z.string().min(1).max(20),
});

export const generateGstReturnSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be YYYY-MM'),
  type: z.nativeEnum(GSTReturnType),
});

export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;
export type CreateLedgerInput = z.infer<typeof createLedgerSchema>;
export type GenerateGstReturnInput = z.infer<typeof generateGstReturnSchema>;
