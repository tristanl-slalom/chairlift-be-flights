import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { Flight, DynamoDBFlight, CreateFlightInput, UpdateFlightInput, UpdateSeatsInput } from '../models/flight.model';
import logger from '../utils/logger';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'chairlift-flights';

export class FlightRepository {
  private tableName: string;

  constructor(tableName: string = TABLE_NAME) {
    this.tableName = tableName;
  }

  async create(input: CreateFlightInput): Promise<Flight> {
    const flightId = uuidv4();
    const now = new Date().toISOString();

    const flight: DynamoDBFlight = {
      PK: `FLIGHT#${flightId}`,
      SK: 'METADATA',
      // GSI1: Route search (origin-destination)
      GSI1PK: `ROUTE#${input.origin}#${input.destination}`,
      GSI1SK: `DATE#${input.departureDate}#TIME#${input.departureTime}`,
      // GSI2: Departure date search
      GSI2PK: `DATE#${input.departureDate}`,
      GSI2SK: `TIME#${input.departureTime}#FLIGHT#${flightId}`,
      // GSI3: Flight number search
      GSI3PK: `FLIGHT_NUMBER#${input.flightNumber}`,
      GSI3SK: `DATE#${input.departureDate}`,
      flightId,
      flightNumber: input.flightNumber,
      airlineCode: input.airlineCode,
      origin: input.origin,
      destination: input.destination,
      departureDate: input.departureDate,
      departureTime: input.departureTime,
      arrivalDate: input.arrivalDate,
      arrivalTime: input.arrivalTime,
      duration: input.duration,
      aircraft: input.aircraft,
      capacity: input.capacity,
      availableSeats: { ...input.capacity }, // Initialize with full capacity
      pricing: input.pricing,
      status: input.status || 'SCHEDULED',
      createdAt: now,
      updatedAt: now
    };

    try {
      await docClient.send(new PutCommand({
        TableName: this.tableName,
        Item: flight
      }));

      logger.info('Flight created', { flightId });
      return this.toFlight(flight);
    } catch (error) {
      logger.error('Error creating flight', { error });
      throw error;
    }
  }

  async getById(flightId: string): Promise<Flight | null> {
    try {
      const result = await docClient.send(new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `FLIGHT#${flightId}`,
          SK: 'METADATA'
        }
      }));

      if (!result.Item) {
        return null;
      }

      return this.toFlight(result.Item as DynamoDBFlight);
    } catch (error) {
      logger.error('Error getting flight', { flightId, error });
      throw error;
    }
  }

  async update(flightId: string, input: UpdateFlightInput): Promise<Flight | null> {
    const existing = await this.getById(flightId);
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
    const expressionAttributeNames: Record<string, string> = {
      '#updatedAt': 'updatedAt'
    };
    const expressionAttributeValues: Record<string, any> = {
      ':updatedAt': now
    };

    // Update simple string fields
    const simpleFields = ['flightNumber', 'airlineCode', 'origin', 'destination',
                          'departureDate', 'departureTime', 'arrivalDate', 'arrivalTime',
                          'aircraft', 'status'];

    for (const field of simpleFields) {
      if (input[field as keyof UpdateFlightInput] !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] = input[field as keyof UpdateFlightInput];
      }
    }

    // Update numeric fields
    if (input.duration !== undefined) {
      updateExpressions.push('#duration = :duration');
      expressionAttributeNames['#duration'] = 'duration';
      expressionAttributeValues[':duration'] = input.duration;
    }

    // Update complex fields
    if (input.capacity !== undefined) {
      updateExpressions.push('#capacity = :capacity');
      expressionAttributeNames['#capacity'] = 'capacity';
      expressionAttributeValues[':capacity'] = input.capacity;
    }

    if (input.pricing !== undefined) {
      updateExpressions.push('#pricing = :pricing');
      expressionAttributeNames['#pricing'] = 'pricing';
      expressionAttributeValues[':pricing'] = input.pricing;
    }

    // Update GSI keys if route or date changes
    if (input.origin !== undefined || input.destination !== undefined) {
      const newOrigin = input.origin || existing.origin;
      const newDestination = input.destination || existing.destination;
      updateExpressions.push('#GSI1PK = :GSI1PK');
      expressionAttributeNames['#GSI1PK'] = 'GSI1PK';
      expressionAttributeValues[':GSI1PK'] = `ROUTE#${newOrigin}#${newDestination}`;
    }

    if (input.departureDate !== undefined || input.departureTime !== undefined) {
      const newDate = input.departureDate || existing.departureDate;
      const newTime = input.departureTime || existing.departureTime;

      updateExpressions.push('#GSI1SK = :GSI1SK');
      expressionAttributeNames['#GSI1SK'] = 'GSI1SK';
      expressionAttributeValues[':GSI1SK'] = `DATE#${newDate}#TIME#${newTime}`;

      updateExpressions.push('#GSI2PK = :GSI2PK');
      expressionAttributeNames['#GSI2PK'] = 'GSI2PK';
      expressionAttributeValues[':GSI2PK'] = `DATE#${newDate}`;

      updateExpressions.push('#GSI2SK = :GSI2SK');
      expressionAttributeNames['#GSI2SK'] = 'GSI2SK';
      expressionAttributeValues[':GSI2SK'] = `TIME#${newTime}#FLIGHT#${flightId}`;
    }

    if (input.flightNumber !== undefined || input.departureDate !== undefined) {
      const newFlightNumber = input.flightNumber || existing.flightNumber;
      const newDate = input.departureDate || existing.departureDate;

      updateExpressions.push('#GSI3PK = :GSI3PK');
      expressionAttributeNames['#GSI3PK'] = 'GSI3PK';
      expressionAttributeValues[':GSI3PK'] = `FLIGHT_NUMBER#${newFlightNumber}`;

      updateExpressions.push('#GSI3SK = :GSI3SK');
      expressionAttributeNames['#GSI3SK'] = 'GSI3SK';
      expressionAttributeValues[':GSI3SK'] = `DATE#${newDate}`;
    }

    try {
      const result = await docClient.send(new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `FLIGHT#${flightId}`,
          SK: 'METADATA'
        },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      }));

      logger.info('Flight updated', { flightId });
      return this.toFlight(result.Attributes as DynamoDBFlight);
    } catch (error) {
      logger.error('Error updating flight', { flightId, error });
      throw error;
    }
  }

  async updateSeats(flightId: string, seatsUpdate: UpdateSeatsInput): Promise<Flight | null> {
    const existing = await this.getById(flightId);
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const newAvailableSeats = {
      economy: seatsUpdate.economy !== undefined ? seatsUpdate.economy : existing.availableSeats.economy,
      business: seatsUpdate.business !== undefined ? seatsUpdate.business : existing.availableSeats.business,
      first: seatsUpdate.first !== undefined ? seatsUpdate.first : existing.availableSeats.first
    };

    // Validate that available seats don't exceed capacity
    if (newAvailableSeats.economy > existing.capacity.economy ||
        newAvailableSeats.business > existing.capacity.business ||
        newAvailableSeats.first > existing.capacity.first) {
      throw new Error('Available seats cannot exceed capacity');
    }

    try {
      const result = await docClient.send(new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `FLIGHT#${flightId}`,
          SK: 'METADATA'
        },
        UpdateExpression: 'SET #availableSeats = :availableSeats, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#availableSeats': 'availableSeats',
          '#updatedAt': 'updatedAt'
        },
        ExpressionAttributeValues: {
          ':availableSeats': newAvailableSeats,
          ':updatedAt': now
        },
        ReturnValues: 'ALL_NEW'
      }));

      logger.info('Flight seats updated', { flightId, newAvailableSeats });
      return this.toFlight(result.Attributes as DynamoDBFlight);
    } catch (error) {
      logger.error('Error updating flight seats', { flightId, error });
      throw error;
    }
  }

  async delete(flightId: string): Promise<boolean> {
    try {
      await docClient.send(new DeleteCommand({
        TableName: this.tableName,
        Key: {
          PK: `FLIGHT#${flightId}`,
          SK: 'METADATA'
        }
      }));

      logger.info('Flight deleted', { flightId });
      return true;
    } catch (error) {
      logger.error('Error deleting flight', { flightId, error });
      throw error;
    }
  }

  async searchFlights(params: {
    origin?: string;
    destination?: string;
    departureDate?: string;
  }): Promise<Flight[]> {
    try {
      if (params.origin && params.destination) {
        // Query by route using GSI1
        const result = await docClient.send(new QueryCommand({
          TableName: this.tableName,
          IndexName: 'GSI1',
          KeyConditionExpression: params.departureDate
            ? 'GSI1PK = :gsi1pk AND begins_with(GSI1SK, :gsi1sk)'
            : 'GSI1PK = :gsi1pk',
          ExpressionAttributeValues: params.departureDate ? {
            ':gsi1pk': `ROUTE#${params.origin}#${params.destination}`,
            ':gsi1sk': `DATE#${params.departureDate}`
          } : {
            ':gsi1pk': `ROUTE#${params.origin}#${params.destination}`
          }
        }));
        return (result.Items || []).map(item => this.toFlight(item as DynamoDBFlight));
      } else if (params.departureDate) {
        // Query by date using GSI2
        const result = await docClient.send(new QueryCommand({
          TableName: this.tableName,
          IndexName: 'GSI2',
          KeyConditionExpression: 'GSI2PK = :gsi2pk',
          ExpressionAttributeValues: {
            ':gsi2pk': `DATE#${params.departureDate}`
          }
        }));
        return (result.Items || []).map(item => this.toFlight(item as DynamoDBFlight));
      } else {
        logger.warn('Search requires at least origin+destination or departureDate');
        return [];
      }
    } catch (error) {
      logger.error('Error searching flights', { params, error });
      throw error;
    }
  }

  async listFlights(): Promise<Flight[]> {
    try {
      // Query all flights by date (using current date as starting point)
      // This avoids using Scan, following the ADR-004 pattern
      const today = new Date().toISOString().split('T')[0];
      const dates = [today];

      // Add next 30 days
      for (let i = 1; i <= 30; i++) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + i);
        dates.push(futureDate.toISOString().split('T')[0]);
      }

      const results = await Promise.all(
        dates.map(date =>
          docClient.send(new QueryCommand({
            TableName: this.tableName,
            IndexName: 'GSI2',
            KeyConditionExpression: 'GSI2PK = :gsi2pk',
            ExpressionAttributeValues: {
              ':gsi2pk': `DATE#${date}`
            }
          }))
        )
      );

      const allItems = results.flatMap(result => result.Items || []);
      return allItems.map(item => this.toFlight(item as DynamoDBFlight));
    } catch (error) {
      logger.error('Error listing flights', { error });
      throw error;
    }
  }

  private toFlight(dynamoDBFlight: DynamoDBFlight): Flight {
    return {
      flightId: dynamoDBFlight.flightId,
      flightNumber: dynamoDBFlight.flightNumber,
      airlineCode: dynamoDBFlight.airlineCode,
      origin: dynamoDBFlight.origin,
      destination: dynamoDBFlight.destination,
      departureDate: dynamoDBFlight.departureDate,
      departureTime: dynamoDBFlight.departureTime,
      arrivalDate: dynamoDBFlight.arrivalDate,
      arrivalTime: dynamoDBFlight.arrivalTime,
      duration: dynamoDBFlight.duration,
      aircraft: dynamoDBFlight.aircraft,
      capacity: dynamoDBFlight.capacity,
      availableSeats: dynamoDBFlight.availableSeats,
      pricing: dynamoDBFlight.pricing,
      status: dynamoDBFlight.status,
      createdAt: dynamoDBFlight.createdAt,
      updatedAt: dynamoDBFlight.updatedAt
    };
  }
}

export const flightRepository = new FlightRepository();
