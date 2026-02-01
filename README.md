# Concepto Tasks Microservice

Backend microservice for managing tasks in the Concepto application. Built with AWS Lambda, DynamoDB, and API Gateway.

## Architecture

- **Runtime**: Node.js 20 with TypeScript
- **Database**: Amazon DynamoDB
- **API**: AWS Lambda + API Gateway (REST)
- **Infrastructure**: AWS CDK
- **CI/CD**: GitHub Actions with OIDC authentication

## Features

- CRUD operations for tasks
- Task filtering by status
- Input validation with Zod
- Structured logging with Winston
- Comprehensive test coverage
- Production-ready infrastructure code

## API Endpoints

### Create Task
```
POST /tasks
Content-Type: application/json

{
  "title": "Task title (1-200 chars)",
  "description": "Task description (max 2000 chars)",
  "status": "TODO" | "IN_PROGRESS" | "DONE" (optional, defaults to TODO)
}

Response: 201 Created
{
  "data": {
    "id": "uuid",
    "title": "Task title",
    "description": "Task description",
    "status": "TODO",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### List Tasks
```
GET /tasks?status=TODO|IN_PROGRESS|DONE

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "title": "Task title",
      "description": "Task description",
      "status": "TODO",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Task
```
GET /tasks/{id}

Response: 200 OK / 404 Not Found
{
  "data": {
    "id": "uuid",
    "title": "Task title",
    "description": "Task description",
    "status": "TODO",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update Task
```
PUT /tasks/{id}
Content-Type: application/json

{
  "title": "Updated title (optional)",
  "description": "Updated description (optional)",
  "status": "IN_PROGRESS" (optional)
}

Response: 200 OK / 404 Not Found
{
  "data": {
    "id": "uuid",
    "title": "Updated title",
    "description": "Updated description",
    "status": "IN_PROGRESS",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Delete Task
```
DELETE /tasks/{id}

Response: 200 OK / 404 Not Found
{
  "data": {
    "message": "Task deleted successfully"
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
export TABLE_NAME=concepto-tasks-local

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
  --stack-name ConceptoTasksServiceStack \
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

**Table Name**: `concepto-tasks`

**Primary Key**:
- PK (Partition Key): `TASK#{taskId}`
- SK (Sort Key): `TASK#{taskId}`

**GSI1** (for status filtering):
- GSI1PK (Partition Key): `STATUS#{status}`
- GSI1SK (Sort Key): `CREATED_AT#{createdAt}`

**Attributes**:
- id: UUID
- title: string (1-200 chars)
- description: string (max 2000 chars)
- status: enum (TODO, IN_PROGRESS, DONE)
- createdAt: ISO 8601 timestamp
- updatedAt: ISO 8601 timestamp

## Project Structure

```
concepto-be-tasks/
├── src/
│   ├── handlers/           # Lambda function handlers
│   │   ├── create-task.ts
│   │   ├── get-task.ts
│   │   ├── list-tasks.ts
│   │   ├── update-task.ts
│   │   └── delete-task.ts
│   ├── repositories/       # Data access layer
│   │   └── task.repository.ts
│   ├── models/            # Data models and schemas
│   │   └── task.model.ts
│   └── utils/             # Utilities
│       ├── logger.ts
│       └── response.ts
├── infrastructure/        # AWS CDK code
│   ├── bin/
│   │   └── app.ts
│   └── lib/
│       └── tasks-service-stack.ts
├── .github/
│   └── workflows/        # CI/CD pipelines
│       ├── ci.yml
│       └── cd.yml
├── package.json
├── tsconfig.json
├── jest.config.js
└── cdk.json
```

## Environment Variables

- `TABLE_NAME`: DynamoDB table name (default: `concepto-tasks`)
- `LOG_LEVEL`: Logging level (default: `info`)
- `AWS_REGION`: AWS region (default: `us-west-2`)

## Related Repositories

- [concepto-bff](https://github.com/tristanl-slalom/concepto-bff) - Backend for Frontend
- [concepto-fe](https://github.com/tristanl-slalom/concepto-fe) - React Frontend
- [concepto-meta](https://github.com/tristanl-slalom/concepto-meta) - Meta repository with documentation

## License

MIT
