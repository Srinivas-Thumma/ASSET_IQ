import { z } from 'zod';

export const createAssignmentSchema = z.object({
  assetId: z.string().min(1, 'Asset ID is required'),
  employeeId: z.string().min(1, 'Employee ID is required')
});

export const inspectSchema = z.object({
  inspectionResult: z.enum(['pass', 'fail_repair', 'fail_retire']),
  inspectionNotes: z.string().optional()
});

export const returnSchema = z.object({
  reason: z.string().optional(),
  returnReason: z.string().optional()
}).refine((data) => Boolean(data.reason || data.returnReason), {
  message: 'Return reason is required'
});

// Aliases for compatibility
export const completeInspectionSchema = inspectSchema;
export const initiateReturnSchema = returnSchema;

export default {
  createAssignmentSchema,
  inspectSchema,
  returnSchema,
  completeInspectionSchema,
  initiateReturnSchema
};
