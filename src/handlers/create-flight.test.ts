import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from './create-flight';
import { flightRepository } from '../repositories/flight.repository';

jest.mock('../repositories/flight.repository');

describe('Create Flight Handler', () => {
  const mockCreate = flightRepository.create as jest.MockedFunction<typeof flightRepository.create>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a flight successfully', async () => {
    const mockFlight = {
      flightId: '123e4567-e89b-12d3-a456-426614174000',
      flightNumber: 'AA100',
      airlineCode: 'AA',
      origin: 'LAX',
      destination: 'JFK',
      departureDate: '2026-03-15',
      departureTime: '08:00',
      arrivalDate: '2026-03-15',
      arrivalTime: '16:30',
      duration: 330,
      aircraft: 'Boeing 737-800',
      capacity: { economy: 120, business: 20, first: 10 },
      availableSeats: { economy: 120, business: 20, first: 10 },
      pricing: { economy: 299.99, business: 899.99, first: 1499.99 },
      status: 'SCHEDULED' as const,
      createdAt: '2026-02-01T00:00:00.000Z',
      updatedAt: '2026-02-01T00:00:00.000Z'
    };

    mockCreate.mockResolvedValue(mockFlight);

    const event = {
      body: JSON.stringify({
        flightNumber: 'AA100',
        airlineCode: 'AA',
        origin: 'LAX',
        destination: 'JFK',
        departureDate: '2026-03-15',
        departureTime: '08:00',
        arrivalDate: '2026-03-15',
        arrivalTime: '16:30',
        duration: 330,
        aircraft: 'Boeing 737-800',
        capacity: { economy: 120, business: 20, first: 10 },
        pricing: { economy: 299.99, business: 899.99, first: 1499.99 }
      })
    } as APIGatewayProxyEvent;

    const response = await handler(event);

    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body)).toEqual({
      data: mockFlight
    });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        flightNumber: 'AA100',
        airlineCode: 'AA',
        origin: 'LAX',
        destination: 'JFK'
      })
    );
  });

  it('should return 400 if body is missing', async () => {
    const event = {} as APIGatewayProxyEvent;

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Request body is required'
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('should return 400 if validation fails', async () => {
    const event = {
      body: JSON.stringify({
        flightNumber: '',
        airlineCode: 'AA',
        origin: 'LAX'
      })
    } as APIGatewayProxyEvent;

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe('Invalid request body');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('should return 500 if repository throws error', async () => {
    mockCreate.mockRejectedValue(new Error('Database error'));

    const event = {
      body: JSON.stringify({
        flightNumber: 'AA100',
        airlineCode: 'AA',
        origin: 'LAX',
        destination: 'JFK',
        departureDate: '2026-03-15',
        departureTime: '08:00',
        arrivalDate: '2026-03-15',
        arrivalTime: '16:30',
        duration: 330,
        aircraft: 'Boeing 737-800',
        capacity: { economy: 120, business: 20, first: 10 },
        pricing: { economy: 299.99, business: 899.99, first: 1499.99 }
      })
    } as APIGatewayProxyEvent;

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Internal server error'
    });
  });
});
