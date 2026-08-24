import { z } from 'zod';
import ApiError from '../utils/ApiError.js';

export const procurementPayloadSchema = z.object({
  itemCategory: z.string().min(1, 'Item category is required').trim(),
  itemCount: z.number().int().positive('Item count must be a positive number'),
  estimatedBudget: z.number().positive('Estimated budget must be a positive number'),
  justification: z.string().min(3, 'Justification must be at least 3 characters').trim()
});

export const planUpgradePayloadSchema = z.object({
  targetPlanId: z.string().min(1, 'Target plan ID is required').trim(),
  billingCycle: z.enum(['monthly', 'annual'], {
    errorMap: () => ({ message: "Billing cycle must be either 'monthly' or 'annual'" })
  })
});

export const quotaIncreasePayloadSchema = z
  .object({
    additionalEmployees: z.number().int().nonnegative().optional(),
    additionalAssets: z.number().int().nonnegative().optional()
  })
  .refine(
    (data) => (data.additionalEmployees && data.additionalEmployees > 0) || (data.additionalAssets && data.additionalAssets > 0),
    { message: 'Must request additional capacity for either employees or assets' }
  );

export const billingPayloadSchema = z.object({
  invoiceNumber: z.string().trim().optional(),
  issueDescription: z.string().min(3, 'Issue description must be at least 3 characters').trim()
});

export const platformSupportPayloadSchema = z.object({
  affectedModule: z.string().trim().optional(),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).optional()
});

export const createRequestSchema = z.object({
  category: z.enum([
    'procurement',
    'plan_upgrade',
    'quota_increase',
    'billing',
    'platform_support',
    'other'
  ]),
  title: z.string().min(1, 'Title is required').trim(),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['p1', 'p2', 'p3', 'p4']).optional(),
  payload: z.record(z.any()).optional()
});

export const updateRequestStatusSchema = z.object({
  status: z.enum(['submitted', 'under_review', 'approved', 'rejected', 'completed']),
  decisionNotes: z.string().optional()
});

/**
 * Validates request payload based on request category
 */
export const validateRequestPayload = (category, payload = {}) => {
  try {
    switch (category) {
      case 'procurement':
        return procurementPayloadSchema.parse(payload);
      case 'plan_upgrade':
        return planUpgradePayloadSchema.parse(payload);
      case 'quota_increase':
        return quotaIncreasePayloadSchema.parse(payload);
      case 'billing':
        return billingPayloadSchema.parse(payload);
      case 'platform_support':
        return platformSupportPayloadSchema.parse(payload);
      case 'other':
        return payload || {};
      default:
        throw new ApiError(400, `Unsupported request category: ${category}`);
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof z.ZodError) {
      const issueMsgs = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      throw new ApiError(400, `Invalid payload for category '${category}': ${issueMsgs}`);
    }
    throw new ApiError(400, `Payload validation failed for category '${category}'`);
  }
};

export default {
  createRequestSchema,
  updateRequestStatusSchema,
  procurementPayloadSchema,
  planUpgradePayloadSchema,
  quotaIncreasePayloadSchema,
  billingPayloadSchema,
  platformSupportPayloadSchema,
  validateRequestPayload
};
