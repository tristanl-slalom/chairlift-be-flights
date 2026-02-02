import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import logger from './logger';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const STATUS_CONFIG_TABLE = process.env.STATUS_CONFIG_TABLE_NAME || 'concepto-task-statuses';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface StatusConfigItem {
  statusKey: string;
  displayName: string;
  displayOrder: number;
  color: string;
  icon: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

class StatusCache {
  private cache: string[] | null = null;
  private fullCache: StatusConfigItem[] | null = null;
  private lastFetch: number = 0;
  private readonly TTL = CACHE_TTL;

  async getActiveStatusKeys(): Promise<string[]> {
    if (this.cache && (Date.now() - this.lastFetch) < this.TTL) {
      return this.cache;
    }

    await this.refreshCache();
    return this.cache || [];
  }

  async getActiveStatuses(): Promise<StatusConfigItem[]> {
    if (this.fullCache && (Date.now() - this.lastFetch) < this.TTL) {
      return this.fullCache;
    }

    await this.refreshCache();
    return this.fullCache || [];
  }

  async getDefaultStatus(): Promise<string> {
    const statuses = await this.getActiveStatuses();
    const defaultStatus = statuses.find(s => s.isDefault);
    return defaultStatus?.statusKey || 'TODO';
  }

  private async refreshCache(): Promise<void> {
    try {
      logger.info('Refreshing status cache');

      const result = await docClient.send(new QueryCommand({
        TableName: STATUS_CONFIG_TABLE,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        FilterExpression: 'isActive = :active',
        ExpressionAttributeValues: {
          ':pk': 'CONFIG#WORKSPACE#default',
          ':sk': 'STATUS#',
          ':active': true
        }
      }));

      const items = (result.Items || []) as StatusConfigItem[];
      this.fullCache = items.sort((a, b) => a.displayOrder - b.displayOrder);
      this.cache = this.fullCache.map(item => item.statusKey);
      this.lastFetch = Date.now();

      logger.info('Status cache refreshed', { statusCount: this.cache.length });
    } catch (error) {
      logger.error('Error refreshing status cache', { error });
      // Keep stale cache if refresh fails
      if (!this.cache) {
        throw error;
      }
    }
  }

  invalidate(): void {
    this.cache = null;
    this.fullCache = null;
    this.lastFetch = 0;
    logger.info('Status cache invalidated');
  }
}

export const statusCache = new StatusCache();
