import { fromSSO } from '@aws-sdk/credential-providers';
import {
  CreateTableCommand,
  DeleteTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';

function getClient(): DynamoDBClient {
  const credentials = fromSSO({ profile: 'PowerUserAccess' });
  return new DynamoDBClient({ credentials });
}

export async function createTable({
  attributes,
  schema,
  tableName,
}: {
  attributes: Attribute[];
  schema: KeyAttribute[];
  tableName: string;
}): Promise<void> {
  const dynamoClient = getClient();
  await dynamoClient.send(
    new CreateTableCommand({
      AttributeDefinitions: attributes,
      BillingMode: 'PAY_PER_REQUEST',
      KeySchema: schema,
      TableName: tableName,
    })
  );
}

interface Attribute {
  AttributeName: string;
  AttributeType: 'S';
}

interface KeyAttribute {
  AttributeName: string;
  KeyType: 'HASH' | 'RANGE';
}

export async function deleteTable(tableName: string): Promise<void> {
  const dynamoClient = getClient();
  await dynamoClient.send(new DeleteTableCommand({ TableName: tableName }));
}

export async function hasTable(name: string): Promise<boolean> {
  const dynamoClient = getClient();
  try {
    const describeResult = await dynamoClient.send(
      new DescribeTableCommand({ TableName: name })
    );
    if (describeResult?.Table?.TableStatus === 'CREATING') return false;
  } catch (error) {
    return false;
  }
  return true;
}

export async function putItem({
  item,
  tableName,
}: {
  item: Record<string, any>;
  tableName: string;
}): Promise<void> {
  const dynamoClient = DynamoDBDocumentClient.from(getClient());
  await dynamoClient.send(
    new PutCommand({
      Item: item,
      TableName: tableName,
    })
  );
}

export async function query({
  condition,
  names,
  values,
  tableName,
}: {
  condition: string;
  names: Record<string, string>;
  tableName: string;
  values: Record<string, string>;
}): Promise<Array<Record<string, any>> | undefined> {
  const dynamoClient = DynamoDBDocumentClient.from(getClient());
  const queryResponse = await dynamoClient.send(
    new QueryCommand({
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      KeyConditionExpression: condition,
      TableName: tableName,
    })
  );
  return queryResponse.Items;
}
