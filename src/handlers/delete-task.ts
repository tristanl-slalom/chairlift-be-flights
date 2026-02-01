import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { taskRepository } from '../repositories/task.repository';
import { successResponse, errorResponse } from '../utils/response';
import logger from '../utils/logger';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const taskId = event.pathParameters?.id;

    if (!taskId) {
      return errorResponse('Task ID is required', 400);
    }

    const task = await taskRepository.getById(taskId);

    if (!task) {
      return errorResponse('Task not found', 404);
    }

    await taskRepository.delete(taskId);
    return successResponse({ message: 'Task deleted successfully' });
  } catch (error) {
    logger.error('Error in delete-task handler', { error });
    return errorResponse('Internal server error', 500);
  }
};
