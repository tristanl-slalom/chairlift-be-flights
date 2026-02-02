import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { flightRepository } from '../repositories/flight.repository';
import logger from '../utils/logger';
import { successResponse, errorResponse } from '../utils/response';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const origin = event.queryStringParameters?.origin;
    const destination = event.queryStringParameters?.destination;
    const departureDate = event.queryStringParameters?.departureDate;

    logger.info('Search flights request received', { origin, destination, departureDate });

    // Validate search parameters
    if (!origin && !destination && !departureDate) {
      return errorResponse('At least one search parameter is required (origin, destination, or departureDate)', 400);
    }

    if ((origin && !destination) || (!origin && destination)) {
      return errorResponse('Both origin and destination are required when searching by route', 400);
    }

    const flights = await flightRepository.searchFlights({
      origin,
      destination,
      departureDate
    });

    logger.info('Flights search completed', { count: flights.length });
    return successResponse(flights);
  } catch (error: any) {
    logger.error('Error searching flights', { error: error.message });
    return errorResponse('Internal server error', 500);
  }
};
