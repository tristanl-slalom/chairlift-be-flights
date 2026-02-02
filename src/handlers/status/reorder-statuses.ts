import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { statusConfigRepository } from '../../repositories/status-config.repository';
import { ReorderStatusesSchema } from '../../models/status-config.model';
import { successResponse, errorResponse } from '../../utils/response';
import logger from '../../utils/logger';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return errorResponse('Request body is required');
    }

    const body = JSON.parse(event.body);
    const validationResult = ReorderStatusesSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse('Invalid request body', 400);
    }

    await statusConfigRepository.reorder(validationResult.data);
    return successResponse(null, 204);
  } catch (error) {
    logger.error('Error in reorder statuses handler', { error });
    return errorResponse('Internal server error');
  }
};
