import { z } from 'zod';

import { gstinSchema, indianPhoneSchema, paiseSchema } from './compliance';

export const createCustomerSchema = z.object({
  name: z.string().min(2).max(200),
  phone: indianPhoneSchema,
  email: z.string().email().optional().nullable(),
  gstin: gstinSchema.optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  creditLimit: paiseSchema.default(0),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
