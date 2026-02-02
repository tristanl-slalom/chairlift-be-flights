import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { statusConfigRepository } from '../../repositories/status-config.repository';
import { CreateStatusConfigSchema } from '../../models/status-config.model';
import { successResponse, errorResponse } from '../../utils/response';
import logger from '../../utils/logger';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return errorResponse('Request body is required');
    }

    const body = JSON.parse(event.body);
    const validationResult = CreateStatusConfigSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse('Invalid request body', 400);
    }

    const statusConfig = await statusConfigRepository.create(validationResult.data);
    return successResponse(statusConfig, 201);
  } catch (error) {
    logger.error('Error in create status handler', { error });
    if (error instanceof Error && error.message.includes('already exists')) {
      return errorResponse(error.message, 409);
    }
    return errorResponse('Internal server error', 500);
  }
};
