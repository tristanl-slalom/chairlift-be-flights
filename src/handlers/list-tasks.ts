import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { TaskStatus } from '../models/task.model';
import { taskRepository } from '../repositories/task.repository';
import { successResponse, errorResponse } from '../utils/response';
import logger from '../utils/logger';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const status = event.queryStringParameters?.status as TaskStatus | undefined;

    if (status && !Object.values(TaskStatus).includes(status)) {
      return errorResponse('Invalid status value', 400);
    }

    const tasks = await taskRepository.list(status);
    return successResponse(tasks);
  } catch (error) {
    logger.error('Error in list-tasks handler', { error });
    return errorResponse('Internal server error', 500);
  }
};
