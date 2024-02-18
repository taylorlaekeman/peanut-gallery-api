import { beforeEach, describe, expect, test } from '@jest/globals';
import { DateTime } from 'luxon';

import { createTable, hasTable, deleteTable, query } from './dynamoUtils.js';
import { DynamoMovieWriter } from './movieWriter.js';
import { waitUntil } from './waitUntil.js';

describe('dynamo movie writer', () => {
  const TABLE_NAME = 'MovieWriterIntegrationTest';

  beforeEach(async () => {
    if (await hasTable(TABLE_NAME)) {
      await deleteTable(TABLE_NAME);
      await waitUntil(async () => !(await hasTable(TABLE_NAME)));
    }
    await createTable({
      attributes: [
        { AttributeName: 'year-week', AttributeType: 'S' },
        { AttributeName: 'score-id', AttributeType: 'S' },
      ],
      schema: [
        { AttributeName: 'year-week', KeyType: 'HASH' },
        { AttributeName: 'score-id', KeyType: 'RANGE' },
      ],
      tableName: TABLE_NAME,
    });
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
    const queryResponse = await query({
      condition: '#yearWeek = :yearWeek',
      names: {
        '#yearWeek': 'year-week',
      },
      values: {
        ':yearWeek': '2020-01',
      },
      tableName: TABLE_NAME,
    });
    expect(queryResponse).toMatchObject([
      {
        movie: JSON.stringify({ ...movie, releaseDate: '2020-01-01' }),
        'popularity-id': '00010-test-id',
        'score-id': '10-test-id',
        title: 'test title',
        'year-week': '2020-01',
      },
    ]);
  });
});
