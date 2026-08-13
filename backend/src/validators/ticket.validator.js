import { z } from 'zod';

export const createTicketSchema = z.object({
  type: z.enum(['repair', 'request', 'return', 'support', 'admin_support']),
  title: z.string().min(1, 'Title is required').trim(),
  description: z.string().min(1, 'Description is required'),
  assetId: z.string().nullable().optional(),
  issueType: z.enum([
    'hardware',
    'software',
    'network',
    'accessory',
    'billing',
    'plan_upgrade',
    'policy',
    'technical',
    'other'
  ]).optional(),
  priority: z.enum(['p1', 'p2', 'p3', 'p4']).optional()
});

export const claimTicketSchema = z.object({
  priority: z.enum(['p1', 'p2', 'p3', 'p4']).optional()
});

export const resolveTicketSchema = z.object({
  resolutionNotes: z.string().optional(),
  assetStateChange: z
    .union([
      z.object({
        to: z.enum(['stock', 'assigned', 'repair', 'retired'])
      }),
      z.enum(['stock', 'assigned', 'repair', 'retired'])
    ])
    .optional()
});

export const addMessageSchema = z.object({
  message: z.string().min(1, 'Message is required').trim(),
  isInternal: z.boolean().optional()
});

export const updateTicketStatusSchema = resolveTicketSchema;

export default {
  createTicketSchema,
  claimTicketSchema,
  resolveTicketSchema,
  addMessageSchema,
  updateTicketStatusSchema
};
