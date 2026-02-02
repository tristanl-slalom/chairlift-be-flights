import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const STATUS_CONFIG_TABLE = process.env.STATUS_CONFIG_TABLE_NAME || 'concepto-task-statuses';
const WORKSPACE_PK = 'CONFIG#WORKSPACE#default';

interface DefaultStatus {
  statusKey: string;
  displayName: string;
  displayOrder: number;
  color: string;
  icon: string;
  isDefault: boolean;
}

const DEFAULT_STATUSES: DefaultStatus[] = [
  {
    statusKey: 'TODO',
    displayName: 'To Do',
    displayOrder: 0,
    color: '#6B7280',
    icon: '📋',
    isDefault: true
  },
  {
    statusKey: 'IN_PROGRESS',
    displayName: 'In Progress',
    displayOrder: 10,
    color: '#3B82F6',
    icon: '🔄',
    isDefault: false
  },
  {
    statusKey: 'DONE',
    displayName: 'Done',
    displayOrder: 20,
    color: '#10B981',
    icon: '✅',
    isDefault: false
  }
];

async function seedDefaultStatuses(): Promise<void> {
  console.log('Starting to seed default statuses...');

  // Check if statuses already exist
  const existingStatuses = await docClient.send(new QueryCommand({
    TableName: STATUS_CONFIG_TABLE,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': WORKSPACE_PK,
      ':sk': 'STATUS#'
    }
  }));

  if (existingStatuses.Items && existingStatuses.Items.length > 0) {
    console.log(`Found ${existingStatuses.Items.length} existing statuses. Skipping seed.`);
    return;
  }

  // Seed default statuses
  const now = new Date().toISOString();

  for (const status of DEFAULT_STATUSES) {
    try {
      await docClient.send(new PutCommand({
        TableName: STATUS_CONFIG_TABLE,
        Item: {
          PK: WORKSPACE_PK,
          SK: `STATUS#${status.statusKey}`,
          statusKey: status.statusKey,
          displayName: status.displayName,
          displayOrder: status.displayOrder,
          color: status.color,
          icon: status.icon,
          isDefault: status.isDefault,
          isActive: true,
          createdAt: now,
          updatedAt: now
        }
      }));

      console.log(`✓ Seeded status: ${status.statusKey} - ${status.displayName}`);
    } catch (error) {
      console.error(`✗ Failed to seed status: ${status.statusKey}`, error);
      throw error;
    }
  }

  console.log('Successfully seeded all default statuses!');
}

// Run if called directly
if (require.main === module) {
  seedDefaultStatuses()
    .then(() => {
      console.log('Seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}

export { seedDefaultStatuses };
