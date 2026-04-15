import { z } from 'zod';

import { OrderStatus } from '@repo/types';

import { paiseSchema } from './compliance';

export const createOrderSchema = z.object({
  customerId: z.string().uuid(),
  orderNumber: z.string().min(1).max(50),
  productName: z.string().min(1).max(200),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(20),
  deliveryDate: z.coerce.date(),
  totalValue: paiseSchema,
  advancePaid: paiseSchema.default(0),
  notes: z.string().max(2000).optional().nullable(),
  workflowTemplateId: z.string().uuid().optional(),
});

export const updateOrderSchema = createOrderSchema.partial();

export const changeOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: z.string().max(500).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type ChangeOrderStatusInput = z.infer<typeof changeOrderStatusSchema>;
