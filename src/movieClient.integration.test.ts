import { beforeAll, expect, test } from '@jest/globals';
import { DateTime } from 'luxon';

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
    id: '653567',
    releaseDate: DateTime.fromISO('2020-01-31'),
    title: 'Miss Americana',
  });
  expect(result.results[1]).toMatchObject({
    id: '573730',
    releaseDate: DateTime.fromISO('2020-01-17'),
    title: 'Made in Abyss: Dawn of the Deep Soul',
  });
  expect(result.results[2]).toMatchObject({
    id: '609242',
    releaseDate: DateTime.fromISO('2020-01-16'),
    title: 'The Heist of the Century',
  });
  expect(result.results[3]).toMatchObject({
    id: '522627',
    releaseDate: DateTime.fromISO('2020-01-01'),
    title: 'The Gentlemen',
  });
  expect(result.results[4]).toMatchObject({
    id: '656690',
    releaseDate: DateTime.fromISO('2020-01-26'),
    title: 'The Social Dilemma',
  });
});

test('handles error', async () => {
  const client = new TMDBMovieClient({ apiKey: 'bad' });
  await expect(
    client.listMovies({
      endDate: DateTime.fromISO('2020-01-01'),
      startDate: DateTime.fromISO('2020-01-01'),
    }),
  ).rejects.toThrow();
});
