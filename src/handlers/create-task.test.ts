import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from './create-task';
import { taskRepository } from '../repositories/task.repository';

jest.mock('../repositories/task.repository');

describe('create-task handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a task successfully', async () => {
    const mockTask = {
      id: '123',
      title: 'Test Task',
      description: 'Test description',
      status: 'TODO' as const,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    };

    (taskRepository.create as jest.Mock).mockResolvedValue(mockTask);

    const event = {
      body: JSON.stringify({
        title: 'Test Task',
        description: 'Test description'
      })
    } as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(201);
    expect(JSON.parse(result.body)).toEqual({ data: mockTask });
  });

  it('should return 400 if body is missing', async () => {
    const event = {} as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe('Request body is required');
  });

  it('should return 400 if validation fails', async () => {
    const event = {
      body: JSON.stringify({
        title: '',
        description: 'Test description'
      })
    } as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toContain('Validation failed');
  });

  it('should return 500 on repository error', async () => {
    (taskRepository.create as jest.Mock).mockRejectedValue(new Error('Database error'));

    const event = {
      body: JSON.stringify({
        title: 'Test Task',
        description: 'Test description'
      })
    } as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).error).toBe('Internal server error');
  });
});
