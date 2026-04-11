import { z } from 'zod';

import { AttendanceStatus } from '@repo/types';

import { aadhaarLast4Schema, indianPhoneSchema, paiseSchema } from './compliance';

export const createWorkerSchema = z.object({
  name: z.string().min(2).max(120),
  phone: indianPhoneSchema,
  aadhaarLast4: aadhaarLast4Schema,
  skill: z.string().min(1).max(60),
  dailyRate: paiseSchema,
  epfNumber: z.string().max(40).optional().nullable(),
  esicNumber: z.string().max(40).optional().nullable(),
});

export const updateWorkerSchema = createWorkerSchema.partial();

export const deployWorkerSchema = z.object({
  workerId: z.string().uuid(),
  factoryOrgId: z.string().uuid(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
});

export const markAttendanceSchema = z.object({
  workerId: z.string().uuid(),
  date: z.coerce.date(),
  status: z.nativeEnum(AttendanceStatus),
  overtime: z.number().min(0).max(12).default(0),
});

export const approveAttendanceSchema = z.object({
  attendanceIds: z.array(z.string().uuid()).min(1),
});

export const disputeAttendanceSchema = z.object({
  attendanceId: z.string().uuid(),
  note: z.string().min(5).max(500),
});

export type CreateWorkerInput = z.infer<typeof createWorkerSchema>;
export type UpdateWorkerInput = z.infer<typeof updateWorkerSchema>;
export type DeployWorkerInput = z.infer<typeof deployWorkerSchema>;
export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
export type ApproveAttendanceInput = z.infer<typeof approveAttendanceSchema>;
export type DisputeAttendanceInput = z.infer<typeof disputeAttendanceSchema>;
