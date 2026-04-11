import { z } from 'zod';

import { PurchaseOrderStatus } from '@repo/types';

import { gstinSchema, indianPhoneSchema, paiseSchema } from './compliance';

export const purchaseOrderItemSchema = z.object({
  description: z.string().min(1).max(300),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(20),
  unitPrice: paiseSchema,
  gstRate: z.number().min(0).max(28),
});

export const createPurchaseOrderSchema = z.object({
  vendorId: z.string().uuid(),
  poNumber: z.string().min(1).max(50),
  items: z.array(purchaseOrderItemSchema).min(1, 'At least one item required'),
  expectedDate: z.coerce.date().optional().nullable(),
});

export const updatePurchaseOrderStatusSchema = z.object({
  status: z.nativeEnum(PurchaseOrderStatus),
});

export const createVendorSchema = z.object({
  name: z.string().min(2).max(200),
  phone: indianPhoneSchema,
  gstin: gstinSchema.optional().nullable(),
  address: z.string().max(500).optional().nullable(),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderStatusInput = z.infer<typeof updatePurchaseOrderStatusSchema>;
export type CreateVendorInput = z.infer<typeof createVendorSchema>;
