import { beforeEach, expect, test } from '@jest/globals';
import { DateTime } from 'luxon';

import { createTable, deleteTable, hasTable, putItem } from './dynamoUtils.js';
import type { Movie } from './movie';
import { DynamoMovieReader, OrderBy } from './movieReader.js';
import { waitUntil } from './waitUntil.js';

const TABLE_NAME = 'MovieReaderIntegrationTest';

function getMovieItem(movie: Movie): Record<string, any> {
  return {
    movie: JSON.stringify({
      ...movie,
      releaseDate: movie.releaseDate.toISODate(),
    }),
    'popularity-id': `${movie.popularity.toString().padStart(5, '0')}-${movie.id}`,
    'score-id': `${movie.score}-${movie.id}`,
    title: movie.title,
    'year-week': movie.releaseDate.toFormat('yyyy-WW'),
  };
}

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

test('reads and returns movies by score', async () => {
  const movies = [
    {
      id: '1',
      popularity: 10,
      releaseDate: DateTime.fromISO('2020-01-01'),
      score: 0.1,
      title: 'test title',
    },
    {
      id: '2',
      popularity: 10,
      releaseDate: DateTime.fromISO('2020-01-08'),
      score: 0.11,
      title: 'test title',
    },
    {
      id: '3',
      popularity: 10,
      releaseDate: DateTime.fromISO('2020-01-08'),
      score: 0.09,
      title: 'test title',
    },
  ];
  await putItem({
    item: getMovieItem(movies[0]),
    tableName: TABLE_NAME,
  });
  await putItem({
    item: getMovieItem(movies[1]),
    tableName: TABLE_NAME,
  });
  await putItem({
    item: getMovieItem(movies[2]),
    tableName: TABLE_NAME,
  });
  const reader = new DynamoMovieReader({ tableName: TABLE_NAME });
  const result = await reader.read({
    endDate: DateTime.fromISO('2020-01-08'),
    orderBy: OrderBy.Score,
    startDate: DateTime.fromISO('2020-01-01'),
  });
  expect(result).toMatchObject([
    { ...movies[1], releaseDate: '2020-01-08' },
    { ...movies[0], releaseDate: '2020-01-01' },
    { ...movies[2], releaseDate: '2020-01-08' },
  ]);
});

test.skip('reads and returns movies by popularity', async () => {
  const movies = [
    {
      id: '1',
      popularity: 10,
      releaseDate: DateTime.fromISO('2020-01-01'),
      score: 0.1,
      title: 'test title',
    },
    {
      id: '2',
      popularity: 11,
      releaseDate: DateTime.fromISO('2020-01-08'),
      score: 0.1,
      title: 'test title',
    },
    {
      id: '3',
      popularity: 9,
      releaseDate: DateTime.fromISO('2020-01-08'),
      score: 0.1,
      title: 'test title',
    },
  ];
  await putItem({
    item: getMovieItem(movies[0]),
    tableName: TABLE_NAME,
  });
  await putItem({
    item: getMovieItem(movies[1]),
    tableName: TABLE_NAME,
  });
  await putItem({
    item: getMovieItem(movies[2]),
    tableName: TABLE_NAME,
  });
  const reader = new DynamoMovieReader({ tableName: TABLE_NAME });
  const result = await reader.read({
    endDate: DateTime.fromISO('2020-01-08'),
    orderBy: OrderBy.Popularity,
    startDate: DateTime.fromISO('2020-01-01'),
  });
  expect(result).toMatchObject([
    { ...movies[1], releaseDate: '2020-01-08' },
    { ...movies[0], releaseDate: '2020-01-01' },
    { ...movies[2], releaseDate: '2020-01-08' },
  ]);
});
