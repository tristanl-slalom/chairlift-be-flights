import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

export class FlightsServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table
    const table = new dynamodb.Table(this, 'FlightsTable', {
      tableName: 'chairlift-flights',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true
    });

    // GSI1 for route search (origin-destination)
    table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // GSI2 for departure date search
    table.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // GSI3 for flight number search
    table.addGlobalSecondaryIndex({
      indexName: 'GSI3',
      partitionKey: { name: 'GSI3PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI3SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // Lambda function configuration
    const lambdaEnvironment = {
      TABLE_NAME: table.tableName,
      LOG_LEVEL: 'info'
    };

    const lambdaProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: lambdaEnvironment,
      logRetention: logs.RetentionDays.ONE_WEEK
    };

    // Lambda Functions
    const createFlightFn = new lambda.Function(this, 'CreateFlightFunction', {
      ...lambdaProps,
      functionName: 'chairlift-create-flight',
      handler: 'handlers/create-flight.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda-dist'))
    });

    const getFlightFn = new lambda.Function(this, 'GetFlightFunction', {
      ...lambdaProps,
      functionName: 'chairlift-get-flight',
      handler: 'handlers/get-flight.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda-dist'))
    });

    const searchFlightsFn = new lambda.Function(this, 'SearchFlightsFunction', {
      ...lambdaProps,
      functionName: 'chairlift-search-flights',
      handler: 'handlers/search-flights.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda-dist'))
    });

    const updateFlightFn = new lambda.Function(this, 'UpdateFlightFunction', {
      ...lambdaProps,
      functionName: 'chairlift-update-flight',
      handler: 'handlers/update-flight.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda-dist'))
    });

    const updateSeatsFn = new lambda.Function(this, 'UpdateSeatsFunction', {
      ...lambdaProps,
      functionName: 'chairlift-update-seats',
      handler: 'handlers/update-seats.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda-dist'))
    });

    const deleteFlightFn = new lambda.Function(this, 'DeleteFlightFunction', {
      ...lambdaProps,
      functionName: 'chairlift-delete-flight',
      handler: 'handlers/delete-flight.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda-dist'))
    });

    // Grant DynamoDB permissions
    table.grantReadWriteData(createFlightFn);
    table.grantReadData(getFlightFn);
    table.grantReadData(searchFlightsFn);
    table.grantReadWriteData(updateFlightFn);
    table.grantReadWriteData(updateSeatsFn);
    table.grantReadWriteData(deleteFlightFn);

    // API Gateway
    const api = new apigateway.RestApi(this, 'FlightsApi', {
      restApiName: 'Chairlift Flights API',
      description: 'API for managing flights in Chairlift application',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token'
        ]
      },
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true
      }
    });

    // API Resources
    const flights = api.root.addResource('flights');
    const search = flights.addResource('search');
    const flight = flights.addResource('{id}');
    const seats = flight.addResource('seats');

    // Flight API Methods
    flights.addMethod('POST', new apigateway.LambdaIntegration(createFlightFn));
    search.addMethod('GET', new apigateway.LambdaIntegration(searchFlightsFn));
    flight.addMethod('GET', new apigateway.LambdaIntegration(getFlightFn));
    flight.addMethod('PUT', new apigateway.LambdaIntegration(updateFlightFn));
    flight.addMethod('DELETE', new apigateway.LambdaIntegration(deleteFlightFn));
    seats.addMethod('PUT', new apigateway.LambdaIntegration(updateSeatsFn));

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway endpoint URL',
      exportName: 'ChairliftFlightsApiUrl'
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: table.tableName,
      description: 'DynamoDB table name',
      exportName: 'ChairliftFlightsTableName'
    });
  }
}
