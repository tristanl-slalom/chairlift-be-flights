import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { statusConfigRepository } from '../../repositories/status-config.repository';
import { successResponse, errorResponse } from '../../utils/response';
import logger from '../../utils/logger';

export const handler = async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const statuses = await statusConfigRepository.list();
    return successResponse(statuses);
  } catch (error) {
    logger.error('Error in list statuses handler', { error });
    return errorResponse('Internal server error');
  }
};
