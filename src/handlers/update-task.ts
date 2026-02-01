import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { UpdateTaskSchema } from '../models/task.model';
import { taskRepository } from '../repositories/task.repository';
import { successResponse, errorResponse } from '../utils/response';
import logger from '../utils/logger';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const taskId = event.pathParameters?.id;

    if (!taskId) {
      return errorResponse('Task ID is required', 400);
    }

    if (!event.body) {
      return errorResponse('Request body is required', 400);
    }

    const body = JSON.parse(event.body);
    const validationResult = UpdateTaskSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        `Validation failed: ${validationResult.error.message}`,
        400
      );
    }

    const task = await taskRepository.update(taskId, validationResult.data);

    if (!task) {
      return errorResponse('Task not found', 404);
    }

    return successResponse(task);
  } catch (error) {
    logger.error('Error in update-task handler', { error });
    return errorResponse('Internal server error', 500);
  }
};
