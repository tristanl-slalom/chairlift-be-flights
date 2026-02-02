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

    logger.info('Get flight request received', { flightId });

    const flight = await flightRepository.getById(flightId);

    if (!flight) {
      return errorResponse('Flight not found', 404);
    }

    logger.info('Flight retrieved successfully', { flightId });
    return successResponse(flight);
  } catch (error: any) {
    logger.error('Error getting flight', { error: error.message });
    return errorResponse('Internal server error', 500);
  }
};
