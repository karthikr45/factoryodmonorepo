import { z } from 'zod';

import { OrganisationPlan, OrganisationType, UserRole } from '@repo/types';

import { gstinSchema, indianPhoneSchema } from './compliance';

export const onboardOrganisationSchema = z.object({
  name: z.string().min(2, 'Name too short').max(120),
  gstin: gstinSchema.optional().nullable(),
  type: z.nativeEnum(OrganisationType),
  ownerName: z.string().min(2).max(120),
});

export const createOrganisationSchema = z.object({
  name: z.string().min(2, 'Name too short').max(120),
  gstin: gstinSchema.optional().nullable(),
  type: z.nativeEnum(OrganisationType),
  plan: z.nativeEnum(OrganisationPlan).default(OrganisationPlan.FREE),
});

export const updateOrganisationSchema = createOrganisationSchema.partial();

export const inviteMemberSchema = z.object({
  name: z.string().min(2).max(120),
  phone: indianPhoneSchema,
  role: z.nativeEnum(UserRole),
  email: z.string().email().optional().nullable(),
});

export type OnboardOrganisationInput = z.infer<typeof onboardOrganisationSchema>;
export type CreateOrganisationInput = z.infer<typeof createOrganisationSchema>;
export type UpdateOrganisationInput = z.infer<typeof updateOrganisationSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
