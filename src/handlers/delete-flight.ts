import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { flightRepository } from '../repositories/flight.repository';
import logger from '../utils/logger';
import { successResponse, errorResponse } from '../utils/response';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const flightId = event.pathParameters?.id;

    if (!flightId) {
      return errorResponse('Flight ID is required', 400);
    }

    logger.info('Delete flight request received', { flightId });

    // Check if flight exists
    const flight = await flightRepository.getById(flightId);
    if (!flight) {
      return errorResponse('Flight not found', 404);
    }

    await flightRepository.delete(flightId);

    logger.info('Flight deleted successfully', { flightId });
    return successResponse({ message: 'Flight deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting flight', { error: error.message });
    return errorResponse('Internal server error', 500);
  }
};
