import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CreateTaskSchema } from '../models/task.model';
import { taskRepository } from '../repositories/task.repository';
import { successResponse, errorResponse } from '../utils/response';
import logger from '../utils/logger';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return errorResponse('Request body is required', 400);
    }

    const body = JSON.parse(event.body);
    const validationResult = CreateTaskSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        `Validation failed: ${validationResult.error.message}`,
        400
      );
    }

    const task = await taskRepository.create(validationResult.data);
    return successResponse(task, 201);
  } catch (error) {
    logger.error('Error in create-task handler', { error });
    return errorResponse('Internal server error', 500);
  }
};
