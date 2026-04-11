import { z } from 'zod';

import { OrganisationPlan, OrganisationType } from '@repo/types';

import { gstinSchema } from './compliance';

export const createOrganisationSchema = z.object({
  name: z.string().min(2, 'Name too short').max(120),
  gstin: gstinSchema.optional().nullable(),
  type: z.nativeEnum(OrganisationType),
  plan: z.nativeEnum(OrganisationPlan).default(OrganisationPlan.FREE),
});

export const updateOrganisationSchema = createOrganisationSchema.partial();

export type CreateOrganisationInput = z.infer<typeof createOrganisationSchema>;
export type UpdateOrganisationInput = z.infer<typeof updateOrganisationSchema>;
