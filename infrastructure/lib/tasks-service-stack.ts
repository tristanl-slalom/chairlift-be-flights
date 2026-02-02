import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

export class TasksServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table
    const table = new dynamodb.Table(this, 'TasksTable', {
      tableName: 'concepto-tasks',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true
    });

    // GSI for querying by status
    table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // Status Configuration Table
    const statusConfigTable = new dynamodb.Table(this, 'TaskStatusConfigTable', {
      tableName: 'concepto-task-statuses',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true
    });

    // Lambda function configuration
    const lambdaEnvironment = {
      TABLE_NAME: table.tableName,
      STATUS_CONFIG_TABLE_NAME: statusConfigTable.tableName,
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
    const createTaskFn = new lambda.Function(this, 'CreateTaskFunction', {
      ...lambdaProps,
      functionName: 'concepto-create-task',
      handler: 'handlers/create-task.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda-dist'))
    });

    const getTaskFn = new lambda.Function(this, 'GetTaskFunction', {
      ...lambdaProps,
      functionName: 'concepto-get-task',
      handler: 'handlers/get-task.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda-dist'))
    });

    const listTasksFn = new lambda.Function(this, 'ListTasksFunction', {
      ...lambdaProps,
      functionName: 'concepto-list-tasks',
      handler: 'handlers/list-tasks.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda-dist'))
    });

    const updateTaskFn = new lambda.Function(this, 'UpdateTaskFunction', {
      ...lambdaProps,
      functionName: 'concepto-update-task',
      handler: 'handlers/update-task.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda-dist'))
    });

    const deleteTaskFn = new lambda.Function(this, 'DeleteTaskFunction', {
      ...lambdaProps,
      functionName: 'concepto-delete-task',
      handler: 'handlers/delete-task.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda-dist'))
    });

    // Status Management Lambda Functions
    const createStatusFn = new lambda.Function(this, 'CreateStatusFunction', {
      ...lambdaProps,
      functionName: 'concepto-create-status',
      handler: 'handlers/status/create-status.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda-dist'))
    });

    const listStatusesFn = new lambda.Function(this, 'ListStatusesFunction', {
      ...lambdaProps,
      functionName: 'concepto-list-statuses',
      handler: 'handlers/status/list-statuses.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda-dist'))
    });

    const getStatusFn = new lambda.Function(this, 'GetStatusFunction', {
      ...lambdaProps,
      functionName: 'concepto-get-status',
      handler: 'handlers/status/get-status.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda-dist'))
    });

    const updateStatusFn = new lambda.Function(this, 'UpdateStatusFunction', {
      ...lambdaProps,
      functionName: 'concepto-update-status',
      handler: 'handlers/status/update-status.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda-dist'))
    });

    const deleteStatusFn = new lambda.Function(this, 'DeleteStatusFunction', {
      ...lambdaProps,
      functionName: 'concepto-delete-status',
      handler: 'handlers/status/delete-status.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda-dist'))
    });

    const reorderStatusesFn = new lambda.Function(this, 'ReorderStatusesFunction', {
      ...lambdaProps,
      functionName: 'concepto-reorder-statuses',
      handler: 'handlers/status/reorder-statuses.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda-dist'))
    });

    // Grant DynamoDB permissions
    table.grantReadWriteData(createTaskFn);
    table.grantReadData(getTaskFn);
    table.grantReadData(listTasksFn);
    table.grantReadWriteData(updateTaskFn);
    table.grantReadWriteData(deleteTaskFn);

    // Grant status config table permissions
    statusConfigTable.grantReadData(createTaskFn);
    statusConfigTable.grantReadData(updateTaskFn);
    statusConfigTable.grantReadData(listTasksFn);
    statusConfigTable.grantReadWriteData(createStatusFn);
    statusConfigTable.grantReadData(listStatusesFn);
    statusConfigTable.grantReadData(getStatusFn);
    statusConfigTable.grantReadWriteData(updateStatusFn);
    statusConfigTable.grantReadWriteData(deleteStatusFn);
    statusConfigTable.grantReadWriteData(reorderStatusesFn);

    // API Gateway
    const api = new apigateway.RestApi(this, 'TasksApi', {
      restApiName: 'Concepto Tasks API',
      description: 'API for managing tasks in Concepto application',
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
    const tasks = api.root.addResource('tasks');
    const task = tasks.addResource('{id}');

    const statuses = api.root.addResource('statuses');
    const status = statuses.addResource('{statusKey}');
    const statusesReorder = statuses.addResource('reorder');

    // Task API Methods
    tasks.addMethod('POST', new apigateway.LambdaIntegration(createTaskFn));
    tasks.addMethod('GET', new apigateway.LambdaIntegration(listTasksFn));
    task.addMethod('GET', new apigateway.LambdaIntegration(getTaskFn));
    task.addMethod('PUT', new apigateway.LambdaIntegration(updateTaskFn));
    task.addMethod('DELETE', new apigateway.LambdaIntegration(deleteTaskFn));

    // Status API Methods
    statuses.addMethod('POST', new apigateway.LambdaIntegration(createStatusFn));
    statuses.addMethod('GET', new apigateway.LambdaIntegration(listStatusesFn));
    status.addMethod('GET', new apigateway.LambdaIntegration(getStatusFn));
    status.addMethod('PUT', new apigateway.LambdaIntegration(updateStatusFn));
    status.addMethod('DELETE', new apigateway.LambdaIntegration(deleteStatusFn));
    statusesReorder.addMethod('POST', new apigateway.LambdaIntegration(reorderStatusesFn));

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway endpoint URL',
      exportName: 'ConceptoTasksApiUrl'
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: table.tableName,
      description: 'DynamoDB table name',
      exportName: 'ConceptoTasksTableName'
    });
  }
}
