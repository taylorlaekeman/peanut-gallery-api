import { beforeAll, expect, test } from '@jest/globals';
import { DateTime } from 'luxon';

import type { Movie } from './movie';
import { TMDBMovieClient } from './movieClient.js';

let apiKey = 'api key';

beforeAll(() => {
  if (process.env.API_KEY === undefined) throw new Error('No API key');
  apiKey = process.env.API_KEY;
});

test('calls api correctly', async () => {
  const client = new TMDBMovieClient({ apiKey });
  const result = await client.listMovies({
    endDate: DateTime.fromISO('2020-01-31'),
    startDate: DateTime.fromISO('2020-01-01'),
  });
  expect(result.results[0]).toMatchObject({
    id: '660521',
    releaseDate: DateTime.fromISO('2020-01-07'),
    title: 'The Mercenary',
  });
  expect(result.results[1]).toMatchObject({
    id: '522627',
    releaseDate: DateTime.fromISO('2020-01-01'),
    title: 'The Gentlemen',
  });
  expect(result.results[2]).toMatchObject({
    id: '38700',
    releaseDate: DateTime.fromISO('2020-01-15'),
    title: 'Bad Boys for Life',
  });
  expect(result.results[3]).toMatchObject({
    id: '659676',
    releaseDate: DateTime.fromISO('2020-01-09'),
    title: 'Masameer: The Movie',
  });
  expect(result.results[4]).toMatchObject({
    id: '573730',
    releaseDate: DateTime.fromISO('2020-01-17'),
    title: 'Made in Abyss: Dawn of the Deep Soul',
  });
});

test('handles error', async () => {
  const client = new TMDBMovieClient({ apiKey: 'bad' });
  await expect(
    client.listMovies({
      endDate: DateTime.fromISO('2020-01-01'),
      startDate: DateTime.fromISO('2020-01-01'),
    })
  ).rejects.toThrow();
});
