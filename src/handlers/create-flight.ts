import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CreateFlightSchema } from '../models/flight.model';
import { flightRepository } from '../repositories/flight.repository';
import logger from '../utils/logger';
import { successResponse, errorResponse } from '../utils/response';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Create flight request received', { body: event.body });

    if (!event.body) {
      return errorResponse('Request body is required', 400);
    }

    const body = JSON.parse(event.body);
    const input = CreateFlightSchema.parse(body);

    const flight = await flightRepository.create(input);

    logger.info('Flight created successfully', { flightId: flight.flightId });
    return successResponse(flight, 201);
  } catch (error: any) {
    logger.error('Error creating flight', { error: error.message });

    if (error.name === 'ZodError') {
      return errorResponse('Invalid request body', 400, error.errors);
    }

    return errorResponse('Internal server error', 500);
  }
};
