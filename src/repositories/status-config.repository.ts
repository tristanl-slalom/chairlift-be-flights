import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
  TransactWriteCommand
} from '@aws-sdk/lib-dynamodb';
import {
  StatusConfig,
  DynamoDBStatusConfig,
  CreateStatusConfigInput,
  UpdateStatusConfigInput,
  ReorderStatusesInput
} from '../models/status-config.model';
import logger from '../utils/logger';
import { statusCache } from '../utils/status-cache';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const STATUS_CONFIG_TABLE = process.env.STATUS_CONFIG_TABLE_NAME || 'concepto-task-statuses';
const WORKSPACE_PK = 'CONFIG#WORKSPACE#default';

export class StatusConfigRepository {
  private tableName: string;

  constructor(tableName: string = STATUS_CONFIG_TABLE) {
    this.tableName = tableName;
  }

  async create(input: CreateStatusConfigInput): Promise<StatusConfig> {
    // Check if status key already exists
    const existing = await this.getByStatusKey(input.statusKey);
    if (existing && existing.isActive) {
      throw new Error(`Status with key '${input.statusKey}' already exists`);
    }

    // If this is marked as default, unset other defaults
    if (input.isDefault) {
      await this.unsetAllDefaults();
    }

    const now = new Date().toISOString();

    const statusConfig: DynamoDBStatusConfig = {
      PK: WORKSPACE_PK,
      SK: `STATUS#${input.statusKey}`,
      statusKey: input.statusKey,
      displayName: input.displayName,
      displayOrder: input.displayOrder,
      color: input.color,
      icon: input.icon,
      isDefault: input.isDefault || false,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    try {
      await docClient.send(new PutCommand({
        TableName: this.tableName,
        Item: statusConfig,
        ConditionExpression: 'attribute_not_exists(PK) OR isActive = :false',
        ExpressionAttributeValues: {
          ':false': false
        }
      }));

      logger.info('Status config created', { statusKey: input.statusKey });
      statusCache.invalidate();
      return this.toStatusConfig(statusConfig);
    } catch (error) {
      logger.error('Error creating status config', { error });
      throw error;
    }
  }

  async getByStatusKey(statusKey: string): Promise<StatusConfig | null> {
    try {
      const result = await docClient.send(new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: WORKSPACE_PK,
          SK: `STATUS#${statusKey}`
        }
      }));

      if (!result.Item) {
        return null;
      }

      return this.toStatusConfig(result.Item as DynamoDBStatusConfig);
    } catch (error) {
      logger.error('Error getting status config', { statusKey, error });
      throw error;
    }
  }

  async list(): Promise<StatusConfig[]> {
    try {
      const result = await docClient.send(new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        FilterExpression: 'isActive = :active',
        ExpressionAttributeValues: {
          ':pk': WORKSPACE_PK,
          ':sk': 'STATUS#',
          ':active': true
        }
      }));

      const items = (result.Items || []) as DynamoDBStatusConfig[];
      return items
        .map(item => this.toStatusConfig(item))
        .sort((a, b) => a.displayOrder - b.displayOrder);
    } catch (error) {
      logger.error('Error listing status configs', { error });
      throw error;
    }
  }

  async update(statusKey: string, input: UpdateStatusConfigInput): Promise<StatusConfig | null> {
    const existing = await this.getByStatusKey(statusKey);
    if (!existing || !existing.isActive) {
      return null;
    }

    // If setting this as default, unset other defaults first
    if (input.isDefault === true) {
      await this.unsetAllDefaults();
    }

    const now = new Date().toISOString();
    const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
    const expressionAttributeNames: Record<string, string> = {
      '#updatedAt': 'updatedAt'
    };
    const expressionAttributeValues: Record<string, string | number | boolean> = {
      ':updatedAt': now
    };

    if (input.displayName !== undefined) {
      updateExpressions.push('#displayName = :displayName');
      expressionAttributeNames['#displayName'] = 'displayName';
      expressionAttributeValues[':displayName'] = input.displayName;
    }

    if (input.displayOrder !== undefined) {
      updateExpressions.push('#displayOrder = :displayOrder');
      expressionAttributeNames['#displayOrder'] = 'displayOrder';
      expressionAttributeValues[':displayOrder'] = input.displayOrder;
    }

    if (input.color !== undefined) {
      updateExpressions.push('#color = :color');
      expressionAttributeNames['#color'] = 'color';
      expressionAttributeValues[':color'] = input.color;
    }

    if (input.icon !== undefined) {
      updateExpressions.push('#icon = :icon');
      expressionAttributeNames['#icon'] = 'icon';
      expressionAttributeValues[':icon'] = input.icon;
    }

    if (input.isDefault !== undefined) {
      updateExpressions.push('#isDefault = :isDefault');
      expressionAttributeNames['#isDefault'] = 'isDefault';
      expressionAttributeValues[':isDefault'] = input.isDefault;
    }

    try {
      const result = await docClient.send(new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: WORKSPACE_PK,
          SK: `STATUS#${statusKey}`
        },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: {
          ...expressionAttributeValues,
          ':true': true
        },
        ConditionExpression: 'attribute_exists(PK) AND isActive = :true',
        ReturnValues: 'ALL_NEW'
      }));

      logger.info('Status config updated', { statusKey });
      statusCache.invalidate();
      return this.toStatusConfig(result.Attributes as DynamoDBStatusConfig);
    } catch (error) {
      logger.error('Error updating status config', { statusKey, error });
      throw error;
    }
  }

  async delete(statusKey: string): Promise<boolean> {
    // Check if status is in use (simplified - in production, check against tasks table)
    const existing = await this.getByStatusKey(statusKey);
    if (!existing) {
      return false;
    }

    // Soft delete by setting isActive to false
    try {
      await docClient.send(new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: WORKSPACE_PK,
          SK: `STATUS#${statusKey}`
        },
        UpdateExpression: 'SET isActive = :false, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':false': false,
          ':updatedAt': new Date().toISOString()
        },
        ConditionExpression: 'attribute_exists(PK)'
      }));

      logger.info('Status config deleted (soft)', { statusKey });
      statusCache.invalidate();
      return true;
    } catch (error) {
      logger.error('Error deleting status config', { statusKey, error });
      throw error;
    }
  }

  async reorder(input: ReorderStatusesInput): Promise<void> {
    // Build transaction for atomic update
    const transactItems = input.statuses.map(({ statusKey, displayOrder }) => ({
      Update: {
        TableName: this.tableName,
        Key: {
          PK: WORKSPACE_PK,
          SK: `STATUS#${statusKey}`
        },
        UpdateExpression: 'SET displayOrder = :displayOrder, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':displayOrder': displayOrder,
          ':updatedAt': new Date().toISOString(),
          ':true': true
        },
        ConditionExpression: 'attribute_exists(PK) AND isActive = :true'
      }
    }));

    try {
      await docClient.send(new TransactWriteCommand({
        TransactItems: transactItems
      }));

      logger.info('Status configs reordered', { count: input.statuses.length });
      statusCache.invalidate();
    } catch (error) {
      logger.error('Error reordering status configs', { error });
      throw error;
    }
  }

  private async unsetAllDefaults(): Promise<void> {
    const allStatuses = await this.list();
    const defaultStatus = allStatuses.find(s => s.isDefault);

    if (defaultStatus) {
      await docClient.send(new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: WORKSPACE_PK,
          SK: `STATUS#${defaultStatus.statusKey}`
        },
        UpdateExpression: 'SET isDefault = :false, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':false': false,
          ':updatedAt': new Date().toISOString()
        }
      }));
    }
  }

  private toStatusConfig(dynamoDBStatusConfig: DynamoDBStatusConfig): StatusConfig {
    return {
      statusKey: dynamoDBStatusConfig.statusKey,
      displayName: dynamoDBStatusConfig.displayName,
      displayOrder: dynamoDBStatusConfig.displayOrder,
      color: dynamoDBStatusConfig.color,
      icon: dynamoDBStatusConfig.icon,
      isDefault: dynamoDBStatusConfig.isDefault,
      isActive: dynamoDBStatusConfig.isActive,
      createdAt: dynamoDBStatusConfig.createdAt,
      updatedAt: dynamoDBStatusConfig.updatedAt
    };
  }
}

export const statusConfigRepository = new StatusConfigRepository();
