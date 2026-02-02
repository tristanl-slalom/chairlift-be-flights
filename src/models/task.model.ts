import { z } from 'zod';

// Legacy status constants for backward compatibility
export const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE'
} as const;

export type TaskStatus = string; // Changed from enum to string for dynamic validation

// Schema with basic string validation
// Dynamic status validation happens in handlers/repositories
export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000),
  status: z.string().optional().default('TODO') // Default for backward compatibility
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.string().optional()
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DynamoDBTask {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}
