import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { statusConfigRepository } from '../../repositories/status-config.repository';
import { successResponse, errorResponse } from '../../utils/response';
import logger from '../../utils/logger';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const statusKey = event.pathParameters?.statusKey;

    if (!statusKey) {
      return errorResponse('Status key is required');
    }

    const statusConfig = await statusConfigRepository.getByStatusKey(statusKey);

    if (!statusConfig) {
      return errorResponse('Status not found');
    }

    return successResponse(statusConfig);
  } catch (error) {
    logger.error('Error in get status handler', { error });
    return errorResponse('Internal server error');
  }
};
