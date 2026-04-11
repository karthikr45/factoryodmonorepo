import { z } from 'zod';

import { JobCardStatus } from '@repo/types';

export const createJobCardsSchema = z.object({
  orderId: z.string().uuid(),
  // If omitted, we auto-generate one job card per active department.
  departmentIds: z.array(z.string().uuid()).optional(),
});

export const updateJobCardStatusSchema = z.object({
  status: z.nativeEnum(JobCardStatus),
  notes: z.string().max(2000).optional(),
});

export const assignJobCardSchema = z.object({
  assignedTo: z.string().uuid(),
});

export const createDepartmentSchema = z.object({
  name: z.string().min(1).max(80),
  sequence: z.number().int().min(0).max(100),
  managerId: z.string().uuid().optional().nullable(),
});

export type CreateJobCardsInput = z.infer<typeof createJobCardsSchema>;
export type UpdateJobCardStatusInput = z.infer<typeof updateJobCardStatusSchema>;
export type AssignJobCardInput = z.infer<typeof assignJobCardSchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
