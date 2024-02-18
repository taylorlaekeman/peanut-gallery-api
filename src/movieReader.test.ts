import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { beforeEach, describe, expect, test } from '@jest/globals';
import { DateTime } from 'luxon';

import {
  DynamoMovieReader,
  getWeeks,
  OrderBy,
  TestMovieReader,
} from './movieReader.js';

const mockedClient = mockClient(DynamoDBDocumentClient);

describe('dynamo movie reader', () => {
  beforeEach(() => {
    mockedClient.reset();
  });

  test('reads and returns movies ordered by score', async () => {
    mockedClient.on(QueryCommand).resolves({
      Items: [
        {
          movie: JSON.stringify({
            id: '1',
            popularity: 10,
            releaseDate: '2020-01-01',
            score: 0.1,
            title: 'test title',
          }),
          'popularity-id': '00010-1',
          'score-id': '0.1-1',
          'year-week': '2020-01',
        },
      ],
    });
    const reader = new DynamoMovieReader({ tableName: 'MovieTable' });
    const result = await reader.read({
      endDate: DateTime.fromISO('2020-01-01'),
      orderBy: OrderBy.Score,
      startDate: DateTime.fromISO('2020-01-01'),
    });
    const queryInput = mockedClient.commandCalls(QueryCommand)[0].args[0].input;
    expect(queryInput).toMatchObject({
      ExpressionAttributeNames: { '#yearWeek': 'year-week' },
      ExpressionAttributeValues: { ':yearWeek': '2020-01' },
      KeyConditionExpression: '#yearWeek = :yearWeek',
      ScanIndexForward: false,
      TableName: 'MovieTable',
    });
    expect(result).toEqual([
      {
        id: '1',
        popularity: 10,
        releaseDate: DateTime.fromISO('2020-01-01'),
        score: 0.1,
        title: 'test title',
      },
    ]);
  });
});

describe('test movie reader', () => {
  test('returns movies ordered by score', async () => {
    const reader = new TestMovieReader({
      movies: {
        '1': {
          id: '1',
          popularity: 10,
          releaseDate: DateTime.fromISO('2020-01-01'),
          score: 0.1,
          title: 'test title',
        },
        '2': {
          id: '2',
          popularity: 10,
          releaseDate: DateTime.fromISO('2020-01-01'),
          score: 0.11,
          title: 'test title',
        },
      },
    });
    const movies = await reader.read({
      endDate: DateTime.fromISO('2020-01-01'),
      orderBy: OrderBy.Score,
      startDate: DateTime.fromISO('2020-01-01'),
    });
    expect(movies).toEqual([
      {
        id: '2',
        popularity: 10,
        releaseDate: DateTime.fromISO('2020-01-01'),
        score: 0.11,
        title: 'test title',
      },
      {
        id: '1',
        popularity: 10,
        releaseDate: DateTime.fromISO('2020-01-01'),
        score: 0.1,
        title: 'test title',
      },
    ]);
  });

  test('excludes movies released outside date range', async () => {
    const reader = new TestMovieReader({
      movies: {
        '1': {
          id: '1',
          popularity: 10,
          releaseDate: DateTime.fromISO('2019-12-31'),
          score: 0.1,
          title: 'test title',
        },
        '2': {
          id: '2',
          popularity: 10,
          releaseDate: DateTime.fromISO('2020-01-01'),
          score: 0.1,
          title: 'test title',
        },
        '3': {
          id: '3',
          popularity: 10,
          releaseDate: DateTime.fromISO('2020-01-02'),
          score: 0.1,
          title: 'test title',
        },
      },
    });
    const movies = await reader.read({
      endDate: DateTime.fromISO('2020-01-01'),
      orderBy: OrderBy.Score,
      startDate: DateTime.fromISO('2020-01-01'),
    });
    expect(movies).toEqual([
      {
        id: '2',
        popularity: 10,
        releaseDate: DateTime.fromISO('2020-01-01'),
        score: 0.1,
        title: 'test title',
      },
    ]);
  });
});

describe('get weeks', () => {
  test('transforms date range', () => {
    const result = getWeeks({
      endDate: DateTime.fromISO('2020-01-21'),
      startDate: DateTime.fromISO('2020-01-01'),
    });
    expect(result).toEqual(['2020-01', '2020-02', '2020-03', '2020-04']);
  });

  test('returns single week', () => {
    const result = getWeeks({
      endDate: DateTime.fromISO('2020-01-01'),
      startDate: DateTime.fromISO('2020-01-01'),
    });
    expect(result).toEqual(['2020-01']);
  });

  test('returns no weeks when end date is before start date', () => {
    const result = getWeeks({
      endDate: DateTime.fromISO('2020-01-01'),
      startDate: DateTime.fromISO('2020-01-02'),
    });
    expect(result).toEqual([]);
  });
});
