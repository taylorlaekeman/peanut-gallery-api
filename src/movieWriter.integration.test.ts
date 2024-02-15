import { fromSSO } from '@aws-sdk/credential-providers';
import {
  CreateTableCommand,
  DeleteTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { beforeEach, describe, expect, test } from '@jest/globals';
import { DateTime } from 'luxon';

import { DynamoMovieWriter } from './movieWriter.js';

describe('dynamo movie writer', () => {
  const TABLE_NAME = 'MoviesIntegrationTest';

  function getClient(): DynamoDBClient {
    const credentials = fromSSO({ profile: 'PowerUserAccess' });
    return new DynamoDBClient({ credentials });
  }

  async function wait(milliseconds: number): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }

  async function hasTable(name: string): Promise<boolean> {
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

  async function waitUntil(executor: () => Promise<boolean>): Promise<void> {
    let hasFinished = false;
    while (!hasFinished) {
      hasFinished = await executor();
      await wait(100);
    }
  }

  beforeEach(async () => {
    const dynamoClient = getClient();
    if (await hasTable(TABLE_NAME)) {
      await dynamoClient.send(
        new DeleteTableCommand({ TableName: TABLE_NAME })
      );
      await waitUntil(async () => !(await hasTable(TABLE_NAME)));
    }
    await dynamoClient.send(
      new CreateTableCommand({
        AttributeDefinitions: [
          { AttributeName: 'year-week', AttributeType: 'S' },
          { AttributeName: 'score-id', AttributeType: 'S' },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [
          { AttributeName: 'year-week', KeyType: 'HASH' },
          { AttributeName: 'score-id', KeyType: 'RANGE' },
        ],
        TableName: TABLE_NAME,
      })
    );
    await waitUntil(async () => await hasTable(TABLE_NAME));
  }, 20000);

  test('writes and returns movie', async () => {
    const movie = {
      id: 'test-id',
      popularity: 10,
      releaseDate: DateTime.fromISO('2020-01-01'),
      score: 10,
      title: 'test title',
    };
    const writer = new DynamoMovieWriter({ tableName: TABLE_NAME });
    const result = await writer.write({
      movie,
    });
    expect(result).toMatchObject({
      movie,
    });
    const dynamoClient = DynamoDBDocumentClient.from(getClient());
    const queryResponse = await dynamoClient.send(
      new QueryCommand({
        ExpressionAttributeNames: {
          '#yearWeek': 'year-week',
        },
        ExpressionAttributeValues: {
          ':yearWeek': '2020-01',
        },
        KeyConditionExpression: '#yearWeek = :yearWeek',
        TableName: TABLE_NAME,
      })
    );
    expect(queryResponse.Items).toMatchObject([
      {
        movie: JSON.stringify({ ...movie, releaseDate: '2020-01-01' }),
        'popularity-id': '10-test-id',
        'score-id': '10-test-id',
        'year-week': '2020-01',
      },
    ]);
  });
});
