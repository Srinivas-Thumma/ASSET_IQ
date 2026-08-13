import { z } from 'zod';

export const createPersonnelSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  email: z.string().email('Valid work email is required').trim().toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  departmentId: z.string().optional().nullable().or(z.literal('')),
  jobTitle: z.string().min(1, 'Job title is required').trim(),
  role: z.enum(['employee', 'asset_manager'], {
    errorMap: () => ({ message: 'Role must be either employee or asset_manager' })
  }),
  routingDomains: z.array(z.string()).optional().default([])
});

export const updatePersonnelSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim().optional(),
  lastName: z.string().min(1, 'Last name is required').trim().optional(),
  departmentId: z.string().optional().nullable().or(z.literal('')),
  jobTitle: z.string().min(1, 'Job title is required').trim().optional(),
  status: z.enum(['active', 'inactive', 'offboarded']).optional(),
  routingDomains: z.array(z.string()).optional()
});

export default {
  createPersonnelSchema,
  updatePersonnelSchema
};
