import { z } from 'zod';

export const markReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()).min(1),
});

export type MarkReadInput = z.infer<typeof markReadSchema>;
