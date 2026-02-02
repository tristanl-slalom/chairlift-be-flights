# Chairlift Flights Microservice

Backend microservice for managing flights in the Chairlift application. Built with AWS Lambda, DynamoDB, and API Gateway.

## Architecture

- **Runtime**: Node.js 20 with TypeScript
- **Database**: Amazon DynamoDB
- **API**: AWS Lambda + API Gateway (REST)
- **Infrastructure**: AWS CDK
- **CI/CD**: GitHub Actions with OIDC authentication

## Features

- CRUD operations for flights
- Flight search by route (origin/destination) and date
- Seat inventory management
- Input validation with Zod
- Structured logging with Winston
- Comprehensive test coverage
- Production-ready infrastructure code

## API Endpoints

### Create Flight
```
POST /flights
Content-Type: application/json

{
  "flightNumber": "AA100",
  "airlineCode": "AA",
  "origin": "LAX",
  "destination": "JFK",
  "departureDate": "2026-03-15",
  "departureTime": "08:00",
  "arrivalDate": "2026-03-15",
  "arrivalTime": "16:30",
  "duration": 330,
  "aircraft": "Boeing 737-800",
  "capacity": {
    "economy": 120,
    "business": 20,
    "first": 10
  },
  "pricing": {
    "economy": 299.99,
    "business": 899.99,
    "first": 1499.99
  },
  "status": "SCHEDULED"
}

Response: 201 Created
{
  "data": {
    "flightId": "uuid",
    "flightNumber": "AA100",
    "airlineCode": "AA",
    "origin": "LAX",
    "destination": "JFK",
    "departureDate": "2026-03-15",
    "departureTime": "08:00",
    "arrivalDate": "2026-03-15",
    "arrivalTime": "16:30",
    "duration": 330,
    "aircraft": "Boeing 737-800",
    "capacity": {
      "economy": 120,
      "business": 20,
      "first": 10
    },
    "availableSeats": {
      "economy": 120,
      "business": 20,
      "first": 10
    },
    "pricing": {
      "economy": 299.99,
      "business": 899.99,
      "first": 1499.99
    },
    "status": "SCHEDULED",
    "createdAt": "2026-02-01T00:00:00.000Z",
    "updatedAt": "2026-02-01T00:00:00.000Z"
  }
}
```

### Search Flights
```
GET /flights/search?origin=LAX&destination=JFK&departureDate=2026-03-15

Response: 200 OK
{
  "data": [
    {
      "flightId": "uuid",
      "flightNumber": "AA100",
      // ... full flight details
    }
  ]
}
```

### Get Flight
```
GET /flights/{id}

Response: 200 OK / 404 Not Found
{
  "data": {
    "flightId": "uuid",
    "flightNumber": "AA100",
    // ... full flight details
  }
}
```

### Update Flight
```
PUT /flights/{id}
Content-Type: application/json

{
  "status": "BOARDING",
  "departureTime": "08:15"
}

Response: 200 OK / 404 Not Found
{
  "data": {
    "flightId": "uuid",
    "status": "BOARDING",
    "departureTime": "08:15",
    // ... full flight details
  }
}
```

### Update Seats
```
PUT /flights/{id}/seats
Content-Type: application/json

{
  "economy": 115,
  "business": 18,
  "first": 9
}

Response: 200 OK / 404 Not Found
{
  "data": {
    "flightId": "uuid",
    "availableSeats": {
      "economy": 115,
      "business": 18,
      "first": 9
    },
    // ... full flight details
  }
}
```

### Delete Flight
```
DELETE /flights/{id}

Response: 200 OK / 404 Not Found
{
  "data": {
    "message": "Flight deleted successfully"
  }
}
```

## Local Development

### Prerequisites

- Node.js 20+
- npm or yarn
- AWS CLI configured (for deployment)
- AWS CDK CLI (`npm install -g aws-cdk`)

### Setup

1. Install dependencies:
```bash
npm install
```

2. Run tests:
```bash
npm test
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

3. Lint code:
```bash
npm run lint
npm run lint:fix
```

4. Build:
```bash
npm run build
```

### Testing with DynamoDB Local

For integration testing with DynamoDB Local:

```bash
# Install DynamoDB Local
docker pull amazon/dynamodb-local

# Run DynamoDB Local
docker run -p 8000:8000 amazon/dynamodb-local

# Set environment variable
export AWS_ENDPOINT_URL=http://localhost:8000
export TABLE_NAME=chairlift-flights-local

# Run tests
npm test
```

## Deployment

### Prerequisites

1. AWS OIDC setup completed (see main project README)
2. GitHub repository secrets configured:
   - `AWS_ROLE_ARN`
   - `AWS_REGION`
   - `AWS_ACCOUNT_ID`

### Manual Deployment

```bash
# Build the project
npm run build

# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy
cdk deploy

# View outputs
aws cloudformation describe-stacks \
  --stack-name ChairliftFlightsServiceStack \
  --query 'Stacks[0].Outputs'
```

### CI/CD Pipeline

The project uses GitHub Actions for CI/CD:

- **CI Pipeline** (`.github/workflows/ci.yml`): Runs on PRs and pushes to main
  - Linting
  - Type checking
  - Tests
  - Build verification

- **CD Pipeline** (`.github/workflows/cd.yml`): Runs on pushes to main
  - Builds the application
  - Deploys to AWS using CDK
  - Outputs API URL

## DynamoDB Table Design

**Table Name**: `chairlift-flights`

**Primary Key**:
- PK (Partition Key): `FLIGHT#{flightId}`
- SK (Sort Key): `METADATA`

**GSI1** (for route search):
- GSI1PK (Partition Key): `ROUTE#{origin}#{destination}`
- GSI1SK (Sort Key): `DATE#{departureDate}#TIME#{departureTime}`

**GSI2** (for date search):
- GSI2PK (Partition Key): `DATE#{departureDate}`
- GSI2SK (Sort Key): `TIME#{departureTime}#FLIGHT#{flightId}`

**GSI3** (for flight number search):
- GSI3PK (Partition Key): `FLIGHT_NUMBER#{flightNumber}`
- GSI3SK (Sort Key): `DATE#{departureDate}`

**Attributes**:
- flightId: UUID
- flightNumber: string (1-10 chars)
- airlineCode: string (2 chars, IATA code)
- origin: string (3 chars, airport code)
- destination: string (3 chars, airport code)
- departureDate: string (YYYY-MM-DD)
- departureTime: string (HH:MM)
- arrivalDate: string (YYYY-MM-DD)
- arrivalTime: string (HH:MM)
- duration: number (minutes)
- aircraft: string (1-50 chars)
- capacity: object (economy, business, first)
- availableSeats: object (economy, business, first)
- pricing: object (economy, business, first)
- status: enum (SCHEDULED, BOARDING, DEPARTED, IN_FLIGHT, LANDED, CANCELLED, DELAYED)
- createdAt: ISO 8601 timestamp
- updatedAt: ISO 8601 timestamp

## Project Structure

```
chairlift-be-flights/
├── src/
│   ├── handlers/              # Lambda function handlers
│   │   ├── create-flight.ts
│   │   ├── get-flight.ts
│   │   ├── search-flights.ts
│   │   ├── update-flight.ts
│   │   ├── update-seats.ts
│   │   └── delete-flight.ts
│   ├── repositories/          # Data access layer
│   │   └── flight.repository.ts
│   ├── models/               # Data models and schemas
│   │   └── flight.model.ts
│   └── utils/                # Utilities
│       ├── logger.ts
│       └── response.ts
├── infrastructure/           # AWS CDK code
│   ├── bin/
│   │   └── app.ts
│   └── lib/
│       └── flights-service-stack.ts
├── .github/
│   └── workflows/           # CI/CD pipelines
│       ├── ci.yml
│       └── cd.yml
├── package.json
├── tsconfig.json
├── jest.config.js
└── cdk.json
```

## Environment Variables

- `TABLE_NAME`: DynamoDB table name (default: `chairlift-flights`)
- `LOG_LEVEL`: Logging level (default: `info`)
- `AWS_REGION`: AWS region (default: `us-west-2`)

## Related Repositories

- [chairlift-meta](https://github.com/tristanl-slalom/chairlift-meta) - Meta repository with documentation

## License

MIT
