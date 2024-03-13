import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { beforeEach, describe, expect, test } from '@jest/globals';
import { DateTime } from 'luxon';

import { DynamoMovieWriter, TestMovieWriter } from './movieWriter.js';

const mockedClient = mockClient(DynamoDBDocumentClient);

describe('dynamo movie writer', () => {
  beforeEach(() => {
    mockedClient.reset();
  });

  test('writes and returns movie', async () => {
    const movie = {
      id: 'test-id',
      popularity: 10,
      releaseDate: DateTime.fromISO('2020-01-01'),
      score: 10,
      title: 'test title',
    };
    const writer = new DynamoMovieWriter({ tableName: 'MovieTable' });
    const result = await writer.write({
      movie,
    });
    expect(result).toMatchObject({
      movie,
    });
    const putInput = mockedClient.commandCalls(PutCommand)[0].args[0].input;
    expect(putInput).toMatchObject({
      Item: {
        id: 'test-id',
        movie: JSON.stringify({
          id: 'test-id',
          popularity: 10,
          releaseDate: '2020-01-01',
          score: 10,
          title: 'test title',
        }),
        'popularity-id': '00010-test-id',
        'score-id': '10-test-id',
        'year-week': '2020-01',
      },
      TableName: 'MovieTable',
    });
  });
});

describe('test movie writer', () => {
  test('writes and returns movie', async () => {
    const movie = {
      id: 'test-id',
      popularity: 10,
      releaseDate: DateTime.fromISO('2020-01-01'),
      score: 10,
      title: 'test title',
    };
    const writer = new TestMovieWriter();
    const result = await writer.write({
      movie,
    });
    expect(result).toMatchObject({ movie });
    expect(writer.data).toMatchObject({
      'test-id': movie,
    });
  });
});
