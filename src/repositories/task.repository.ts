import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { Task, DynamoDBTask, CreateTaskInput, UpdateTaskInput, TaskStatus } from '../models/task.model';
import logger from '../utils/logger';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'concepto-tasks';

export class TaskRepository {
  private tableName: string;

  constructor(tableName: string = TABLE_NAME) {
    this.tableName = tableName;
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const task: DynamoDBTask = {
      PK: `TASK#${id}`,
      SK: `TASK#${id}`,
      GSI1PK: `STATUS#${input.status || TaskStatus.TODO}`,
      GSI1SK: `CREATED_AT#${now}`,
      id,
      title: input.title,
      description: input.description,
      status: input.status || TaskStatus.TODO,
      createdAt: now,
      updatedAt: now
    };

    try {
      await docClient.send(new PutCommand({
        TableName: this.tableName,
        Item: task
      }));

      logger.info('Task created', { taskId: id });
      return this.toTask(task);
    } catch (error) {
      logger.error('Error creating task', { error });
      throw error;
    }
  }

  async getById(id: string): Promise<Task | null> {
    try {
      const result = await docClient.send(new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `TASK#${id}`,
          SK: `TASK#${id}`
        }
      }));

      if (!result.Item) {
        return null;
      }

      return this.toTask(result.Item as DynamoDBTask);
    } catch (error) {
      logger.error('Error getting task', { taskId: id, error });
      throw error;
    }
  }

  async update(id: string, input: UpdateTaskInput): Promise<Task | null> {
    const existing = await this.getById(id);
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
    const expressionAttributeNames: Record<string, string> = {
      '#updatedAt': 'updatedAt'
    };
    const expressionAttributeValues: Record<string, string> = {
      ':updatedAt': now
    };

    if (input.title !== undefined) {
      updateExpressions.push('#title = :title');
      expressionAttributeNames['#title'] = 'title';
      expressionAttributeValues[':title'] = input.title;
    }

    if (input.description !== undefined) {
      updateExpressions.push('#description = :description');
      expressionAttributeNames['#description'] = 'description';
      expressionAttributeValues[':description'] = input.description;
    }

    if (input.status !== undefined) {
      updateExpressions.push('#status = :status');
      updateExpressions.push('#GSI1PK = :GSI1PK');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeNames['#GSI1PK'] = 'GSI1PK';
      expressionAttributeValues[':status'] = input.status;
      expressionAttributeValues[':GSI1PK'] = `STATUS#${input.status}`;
    }

    try {
      const result = await docClient.send(new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `TASK#${id}`,
          SK: `TASK#${id}`
        },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      }));

      logger.info('Task updated', { taskId: id });
      return this.toTask(result.Attributes as DynamoDBTask);
    } catch (error) {
      logger.error('Error updating task', { taskId: id, error });
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await docClient.send(new DeleteCommand({
        TableName: this.tableName,
        Key: {
          PK: `TASK#${id}`,
          SK: `TASK#${id}`
        }
      }));

      logger.info('Task deleted', { taskId: id });
      return true;
    } catch (error) {
      logger.error('Error deleting task', { taskId: id, error });
      throw error;
    }
  }

  async list(status?: TaskStatus): Promise<Task[]> {
    try {
      let result;

      if (status) {
        result = await docClient.send(new QueryCommand({
          TableName: this.tableName,
          IndexName: 'GSI1',
          KeyConditionExpression: 'GSI1PK = :gsi1pk',
          ExpressionAttributeValues: {
            ':gsi1pk': `STATUS#${status}`
          },
          ScanIndexForward: false
        }));
      } else {
        // Use Scan to get all tasks when no status filter
        result = await docClient.send(new ScanCommand({
          TableName: this.tableName,
          FilterExpression: 'begins_with(PK, :prefix)',
          ExpressionAttributeValues: {
            ':prefix': 'TASK#'
          }
        }));
      }

      return (result.Items || []).map(item => this.toTask(item as DynamoDBTask));
    } catch (error) {
      logger.error('Error listing tasks', { status, error });
      throw error;
    }
  }

  private toTask(dynamoDBTask: DynamoDBTask): Task {
    return {
      id: dynamoDBTask.id,
      title: dynamoDBTask.title,
      description: dynamoDBTask.description,
      status: dynamoDBTask.status,
      createdAt: dynamoDBTask.createdAt,
      updatedAt: dynamoDBTask.updatedAt
    };
  }
}

export const taskRepository = new TaskRepository();
