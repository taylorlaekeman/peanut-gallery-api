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
  const endDate = DateTime.fromISO('2020-01-31');
  const startDate = DateTime.fromISO('2020-01-01');
  const result = await client.listMovies({ endDate, startDate });
  expect(result.results).toHaveLength(20);
  expect(areBetweenDates(result.results, { endDate, startDate })).toBe(true);
  expect(areOrderedByPopularity(result.results)).toBe(true);
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

function areBetweenDates(
  movies: Movie[],
  { startDate, endDate }: { endDate: DateTime; startDate: DateTime }
): boolean {
  for (const movie of movies) {
    if (movie.releaseDate > endDate) return false;
    if (movie.releaseDate < startDate) return false;
  }
  return true;
}

function areOrderedByPopularity(movies: Movie[]): boolean {
  let lastPopularity = movies[0].popularity;
  for (const movie of movies) {
    if (movie.popularity > lastPopularity) return false;
    lastPopularity = movie.popularity;
  }
  return true;
}
