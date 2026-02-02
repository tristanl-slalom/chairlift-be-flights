import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { taskRepository } from '../repositories/task.repository';
import { successResponse, errorResponse } from '../utils/response';
import logger from '../utils/logger';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const status = event.queryStringParameters?.status;

    // Status validation now happens at repository level (dynamic from config)
    const tasks = await taskRepository.list(status);
    return successResponse(tasks);
  } catch (error) {
    logger.error('Error in list-tasks handler', { error });
    return errorResponse('Internal server error', 500);
  }
};
