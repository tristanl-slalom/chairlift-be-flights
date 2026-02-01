import { CreateTaskSchema, UpdateTaskSchema } from './task.model';

describe('Task Models', () => {
  describe('CreateTaskSchema', () => {
    it('should validate valid task creation input', () => {
      const input = {
        title: 'Test Task',
        description: 'Test description',
        status: 'TODO' as const
      };

      const result = CreateTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should default status to TODO', () => {
      const input = {
        title: 'Test Task',
        description: 'Test description'
      };

      const result = CreateTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('TODO');
      }
    });

    it('should reject empty title', () => {
      const input = {
        title: '',
        description: 'Test description'
      };

      const result = CreateTaskSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject title longer than 200 characters', () => {
      const input = {
        title: 'a'.repeat(201),
        description: 'Test description'
      };

      const result = CreateTaskSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject description longer than 2000 characters', () => {
      const input = {
        title: 'Test Task',
        description: 'a'.repeat(2001)
      };

      const result = CreateTaskSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid status', () => {
      const input = {
        title: 'Test Task',
        description: 'Test description',
        status: 'INVALID'
      };

      const result = CreateTaskSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateTaskSchema', () => {
    it('should validate valid task update input', () => {
      const input = {
        title: 'Updated Task',
        description: 'Updated description',
        status: 'IN_PROGRESS' as const
      };

      const result = UpdateTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should allow partial updates', () => {
      const input = {
        status: 'DONE' as const
      };

      const result = UpdateTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should allow empty object', () => {
      const input = {};

      const result = UpdateTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });
});
