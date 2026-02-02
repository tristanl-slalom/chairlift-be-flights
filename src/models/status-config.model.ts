import { z } from 'zod';

export const CreateStatusConfigSchema = z.object({
  statusKey: z.string().min(1).max(50).regex(/^[A-Z_]+$/, 'Status key must be uppercase letters and underscores only'),
  displayName: z.string().min(1).max(100),
  displayOrder: z.number().int().min(0),
  color: z.string().min(1).max(50),
  icon: z.string().min(1).max(10),
  isDefault: z.boolean().optional().default(false)
});

export const UpdateStatusConfigSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  displayOrder: z.number().int().min(0).optional(),
  color: z.string().min(1).max(50).optional(),
  icon: z.string().min(1).max(10).optional(),
  isDefault: z.boolean().optional()
});

export const ReorderStatusesSchema = z.object({
  statuses: z.array(z.object({
    statusKey: z.string(),
    displayOrder: z.number().int().min(0)
  }))
});

export type CreateStatusConfigInput = z.infer<typeof CreateStatusConfigSchema>;
export type UpdateStatusConfigInput = z.infer<typeof UpdateStatusConfigSchema>;
export type ReorderStatusesInput = z.infer<typeof ReorderStatusesSchema>;

export interface StatusConfig {
  statusKey: string;
  displayName: string;
  displayOrder: number;
  color: string;
  icon: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DynamoDBStatusConfig {
  PK: string;
  SK: string;
  statusKey: string;
  displayName: string;
  displayOrder: number;
  color: string;
  icon: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
