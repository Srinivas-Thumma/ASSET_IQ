import { z } from 'zod';

export const createAssetSchema = z.object({
  name: z.string().min(1, 'Asset name is required').trim(),
  assetCode: z.string().min(1, 'Asset code is required').trim(),
  categoryId: z.string().nullable().optional(),
  status: z.enum(['stock', 'assigned', 'repair', 'retired']).optional().default('stock'),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().nonnegative().optional(),
  vendorId: z.string().nullable().optional(),
  locationId: z.string().nullable().optional(),
  qrCode: z.string().optional(),
  customValues: z.record(z.any()).optional()
});

export const updateStatusSchema = z.object({
  status: z.enum(['stock', 'assigned', 'repair', 'retired']),
  reason: z.string().optional()
});

export const updateAssetSchema = z.object({
  name: z.string().min(1).trim().optional(),
  categoryId: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().nonnegative().optional(),
  vendorId: z.string().nullable().optional(),
  locationId: z.string().nullable().optional(),
  qrCode: z.string().optional(),
  customValues: z.record(z.any()).optional()
});

export const updateAssetStatusSchema = updateStatusSchema;

export default {
  createAssetSchema,
  updateStatusSchema,
  updateAssetSchema,
  updateAssetStatusSchema
};
