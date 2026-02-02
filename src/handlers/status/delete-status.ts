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

    const result = await statusConfigRepository.delete(statusKey);

    if (!result) {
      return errorResponse('Status not found');
    }

    return successResponse(null, 204);
  } catch (error) {
    logger.error('Error in delete status handler', { error });
    return errorResponse('Internal server error');
  }
};
