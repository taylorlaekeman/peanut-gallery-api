import { beforeAll, expect, test } from '@jest/globals';
import { DateTime } from 'luxon';

import { TMDBMovieClient } from './movieClient.js';

process.env.API_KEY = 'a2a71e4b2f8a2f01d898d8ba5241fc75';
let apiKey = 'api key';

beforeAll(() => {
  if (process.env.API_KEY === undefined) throw new Error('No API key');
  apiKey = process.env.API_KEY;
});

test('calls api correctly', async () => {
  const client = new TMDBMovieClient({ apiKey });
  const result = await client.listMovies();
  expect(result.results[0]).toMatchObject({
    id: '278',
    releaseDate: DateTime.fromISO('1994-09-23'),
    score: 8.7,
    title: 'The Shawshank Redemption',
  });
  expect(result.results[1]).toMatchObject({
    id: '238',
    releaseDate: DateTime.fromISO('1972-03-14'),
    score: 8.7,
    title: 'The Godfather',
  });
  expect(result.results[2]).toMatchObject({
    id: '240',
    releaseDate: DateTime.fromISO('1974-12-20'),
    score: 8.6,
    title: 'The Godfather Part II',
  });
  expect(result.results[3]).toMatchObject({
    id: '424',
    releaseDate: DateTime.fromISO('1993-12-15'),
    score: 8.6,
    title: "Schindler's List",
  });
  expect(result.results[4]).toMatchObject({
    id: '389',
    releaseDate: DateTime.fromISO('1957-04-10'),
    score: 8.5,
    title: '12 Angry Men',
  });
});

test('handles error', async () => {
  const client = new TMDBMovieClient({ apiKey: 'bad' });
  await expect(client.listMovies()).rejects.toThrow();
});
