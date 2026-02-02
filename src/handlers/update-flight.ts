import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { UpdateFlightSchema } from '../models/flight.model';
import { flightRepository } from '../repositories/flight.repository';
import logger from '../utils/logger';
import { successResponse, errorResponse } from '../utils/response';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const flightId = event.pathParameters?.id;

    if (!flightId) {
      return errorResponse('Flight ID is required', 400);
    }

    if (!event.body) {
      return errorResponse('Request body is required', 400);
    }

    logger.info('Update flight request received', { flightId, body: event.body });

    const body = JSON.parse(event.body);
    const input = UpdateFlightSchema.parse(body);

    const flight = await flightRepository.update(flightId, input);

    if (!flight) {
      return errorResponse('Flight not found', 404);
    }

    logger.info('Flight updated successfully', { flightId });
    return successResponse(flight);
  } catch (error: any) {
    logger.error('Error updating flight', { error: error.message });

    if (error.name === 'ZodError') {
      return errorResponse('Invalid request body', 400, error.errors);
    }

    return errorResponse('Internal server error', 500);
  }
};
