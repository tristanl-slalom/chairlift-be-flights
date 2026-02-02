import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { statusConfigRepository } from '../../repositories/status-config.repository';
import { UpdateStatusConfigSchema } from '../../models/status-config.model';
import { successResponse, errorResponse } from '../../utils/response';
import logger from '../../utils/logger';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const statusKey = event.pathParameters?.statusKey;

    if (!statusKey) {
      return errorResponse('Status key is required');
    }

    if (!event.body) {
      return errorResponse('Request body is required');
    }

    const body = JSON.parse(event.body);
    const validationResult = UpdateStatusConfigSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse('Invalid request body', 400);
    }

    const statusConfig = await statusConfigRepository.update(statusKey, validationResult.data);

    if (!statusConfig) {
      return errorResponse('Status not found');
    }

    return successResponse(statusConfig);
  } catch (error) {
    logger.error('Error in update status handler', { error });
    return errorResponse('Internal server error');
  }
};
