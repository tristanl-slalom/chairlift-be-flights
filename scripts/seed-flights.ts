import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { CreateFlightInput } from '../src/models/flight.model';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'chairlift-flights';

// Predefined test flights - easy to remember for testing
const TEST_FLIGHTS: CreateFlightInput[] = [
  // Seattle to Los Angeles
  {
    flightNumber: 'SL100',
    airlineCode: 'SL',
    origin: 'SEA',
    destination: 'LAX',
    departureDate: '2024-03-15',
    departureTime: '08:00',
    arrivalDate: '2024-03-15',
    arrivalTime: '11:00',
    duration: 180,
    aircraft: 'Boeing 737',
    capacity: { economy: 120, business: 20, first: 10 },
    pricing: { economy: 199, business: 599, first: 999 },
    status: 'SCHEDULED'
  },
  {
    flightNumber: 'SL101',
    airlineCode: 'SL',
    origin: 'SEA',
    destination: 'LAX',
    departureDate: '2024-03-15',
    departureTime: '14:00',
    arrivalDate: '2024-03-15',
    arrivalTime: '17:00',
    duration: 180,
    aircraft: 'Boeing 737',
    capacity: { economy: 120, business: 20, first: 10 },
    pricing: { economy: 249, business: 649, first: 1099 },
    status: 'SCHEDULED'
  },

  // Los Angeles to Seattle
  {
    flightNumber: 'SL200',
    airlineCode: 'SL',
    origin: 'LAX',
    destination: 'SEA',
    departureDate: '2024-03-15',
    departureTime: '09:00',
    arrivalDate: '2024-03-15',
    arrivalTime: '12:00',
    duration: 180,
    aircraft: 'Boeing 737',
    capacity: { economy: 120, business: 20, first: 10 },
    pricing: { economy: 199, business: 599, first: 999 },
    status: 'SCHEDULED'
  },

  // Seattle to New York
  {
    flightNumber: 'SL300',
    airlineCode: 'SL',
    origin: 'SEA',
    destination: 'JFK',
    departureDate: '2024-03-15',
    departureTime: '07:00',
    arrivalDate: '2024-03-15',
    arrivalTime: '15:30',
    duration: 330,
    aircraft: 'Boeing 787',
    capacity: { economy: 180, business: 30, first: 12 },
    pricing: { economy: 399, business: 1299, first: 2499 },
    status: 'SCHEDULED'
  },
  {
    flightNumber: 'SL301',
    airlineCode: 'SL',
    origin: 'SEA',
    destination: 'JFK',
    departureDate: '2024-03-15',
    departureTime: '18:00',
    arrivalDate: '2024-03-16',
    arrivalTime: '02:30',
    duration: 330,
    aircraft: 'Boeing 787',
    capacity: { economy: 180, business: 30, first: 12 },
    pricing: { economy: 349, business: 1199, first: 2299 },
    status: 'SCHEDULED'
  },

  // New York to Seattle
  {
    flightNumber: 'SL400',
    airlineCode: 'SL',
    origin: 'JFK',
    destination: 'SEA',
    departureDate: '2024-03-15',
    departureTime: '08:00',
    arrivalDate: '2024-03-15',
    arrivalTime: '11:30',
    duration: 390,
    aircraft: 'Boeing 787',
    capacity: { economy: 180, business: 30, first: 12 },
    pricing: { economy: 399, business: 1299, first: 2499 },
    status: 'SCHEDULED'
  },

  // San Francisco to New York
  {
    flightNumber: 'SL500',
    airlineCode: 'SL',
    origin: 'SFO',
    destination: 'JFK',
    departureDate: '2024-03-15',
    departureTime: '09:00',
    arrivalDate: '2024-03-15',
    arrivalTime: '17:30',
    duration: 330,
    aircraft: 'Airbus A321',
    capacity: { economy: 150, business: 25, first: 10 },
    pricing: { economy: 379, business: 1199, first: 2399 },
    status: 'SCHEDULED'
  },

  // Los Angeles to New York
  {
    flightNumber: 'SL600',
    airlineCode: 'SL',
    origin: 'LAX',
    destination: 'JFK',
    departureDate: '2024-03-15',
    departureTime: '10:00',
    arrivalDate: '2024-03-15',
    arrivalTime: '18:30',
    duration: 330,
    aircraft: 'Airbus A321',
    capacity: { economy: 150, business: 25, first: 10 },
    pricing: { economy: 359, business: 1149, first: 2299 },
    status: 'SCHEDULED'
  },

  // Chicago to Los Angeles
  {
    flightNumber: 'SL700',
    airlineCode: 'SL',
    origin: 'ORD',
    destination: 'LAX',
    departureDate: '2024-03-15',
    departureTime: '11:00',
    arrivalDate: '2024-03-15',
    arrivalTime: '14:00',
    duration: 240,
    aircraft: 'Boeing 737',
    capacity: { economy: 120, business: 20, first: 10 },
    pricing: { economy: 299, business: 899, first: 1699 },
    status: 'SCHEDULED'
  },

  // Miami to Seattle
  {
    flightNumber: 'SL800',
    airlineCode: 'SL',
    origin: 'MIA',
    destination: 'SEA',
    departureDate: '2024-03-15',
    departureTime: '06:00',
    arrivalDate: '2024-03-15',
    arrivalTime: '11:30',
    duration: 390,
    aircraft: 'Boeing 787',
    capacity: { economy: 180, business: 30, first: 12 },
    pricing: { economy: 449, business: 1399, first: 2599 },
    status: 'SCHEDULED'
  }
];

async function seedFlights() {
  console.log('🌱 Seeding flights...\n');
  console.log(`Table: ${TABLE_NAME}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const flightInput of TEST_FLIGHTS) {
    const flightId = `test-${flightInput.flightNumber.toLowerCase()}`;
    const now = new Date().toISOString();

    const flight = {
      PK: `FLIGHT#${flightId}`,
      SK: 'METADATA',
      GSI1PK: `ROUTE#${flightInput.origin}#${flightInput.destination}`,
      GSI1SK: `DATE#${flightInput.departureDate}#TIME#${flightInput.departureTime}`,
      GSI2PK: `DATE#${flightInput.departureDate}`,
      GSI2SK: `TIME#${flightInput.departureTime}#FLIGHT#${flightId}`,
      GSI3PK: `FLIGHT_NUMBER#${flightInput.flightNumber}`,
      GSI3SK: `DATE#${flightInput.departureDate}`,
      flightId,
      ...flightInput,
      availableSeats: { ...flightInput.capacity },
      createdAt: now,
      updatedAt: now
    };

    try {
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: flight
      }));

      console.log(`✅ ${flightInput.flightNumber}: ${flightInput.origin} → ${flightInput.destination} @ ${flightInput.departureTime}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to seed ${flightInput.flightNumber}:`, error);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary: ${successCount} flights seeded, ${errorCount} errors\n`);

  // Print the available routes
  console.log('📋 Available Test Routes:\n');
  const routes = new Map<string, string[]>();

  for (const flight of TEST_FLIGHTS) {
    const route = `${flight.origin} → ${flight.destination}`;
    if (!routes.has(route)) {
      routes.set(route, []);
    }
    routes.get(route)!.push(`${flight.flightNumber} @ ${flight.departureTime} ($${flight.pricing.economy})`);
  }

  routes.forEach((flights, route) => {
    console.log(`  ${route}`);
    flights.forEach(flight => console.log(`    - ${flight}`));
  });

  console.log('\n🔍 Test Search Examples:\n');
  console.log('  SEA → LAX on 2024-03-15 (2 flights)');
  console.log('  SEA → JFK on 2024-03-15 (2 flights)');
  console.log('  LAX → SEA on 2024-03-15 (1 flight)');
  console.log('  JFK → SEA on 2024-03-15 (1 flight)');
  console.log('\n✨ Done!\n');
}

seedFlights().catch(console.error);
