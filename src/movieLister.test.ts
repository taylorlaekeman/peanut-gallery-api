import { expect, test } from '@jest/globals';
import { DateTime } from 'luxon';

import {
  InsufficientReviewsError,
  TestMetascoreClient,
} from './metascoreClient.js';
import { buildMovie, TestMovieClient } from './movieClient.js';
import { MovieLister } from './movieLister.js';

test('sorts results by metascore', async () => {
  const lister = new MovieLister({
    metascoreClient: new TestMetascoreClient({
      responses: {
        Soul: { score: 83 },
        'Inside Out': { score: 94 },
      },
    }),
    movieClient: new TestMovieClient({
      movies: [
        {
          id: '1',
          popularity: 50,
          releaseDate: DateTime.fromISO('2020-08-11'),
          score: 8.0,
          title: 'Soul',
        },
        {
          id: '2',
          popularity: 100,
          releaseDate: DateTime.fromISO('2015-06-19'),
          score: 8.0,
          title: 'Inside Out',
        },
      ],
    }),
  });
  const movies = await lister.list({
    endDate: DateTime.fromISO('2021-01-01'),
    startDate: DateTime.fromISO('2010-01-01'),
  });
  expect(movies).toMatchObject([
    {
      id: '2',
      popularity: 100,
      releaseDate: DateTime.fromISO('2015-06-19'),
      score: 94,
      title: 'Inside Out',
    },
    {
      id: '1',
      popularity: 50,
      releaseDate: DateTime.fromISO('2020-08-11'),
      score: 83,
      title: 'Soul',
    },
  ]);
});

test('excludes movies below popularity threshold', async () => {
  const lister = new MovieLister({
    metascoreClient: new TestMetascoreClient({
      responses: {
        Soul: { score: 83 },
        'Inside Out': { score: 94 },
      },
    }),
    movieClient: new TestMovieClient({
      movies: [
        {
          id: '1',
          popularity: 50,
          releaseDate: DateTime.fromISO('2020-08-11'),
          score: 8.0,
          title: 'Soul',
        },
        {
          id: '2',
          popularity: 100,
          releaseDate: DateTime.fromISO('2015-06-19'),
          score: 8.0,
          title: 'Inside Out',
        },
      ],
    }),
    popularityThreshold: 75,
  });
  const movies = await lister.list({
    endDate: DateTime.fromISO('2021-01-01'),
    startDate: DateTime.fromISO('2010-01-01'),
  });
  expect(movies).toMatchObject([
    {
      id: '2',
      popularity: 100,
      releaseDate: DateTime.fromISO('2015-06-19'),
      score: 94,
      title: 'Inside Out',
    },
  ]);
});

test('returns results from multiple pages', async () => {
  const lister = new MovieLister({
    metascoreClient: new TestMetascoreClient({
      responses: {
        Soul: { score: 83 },
      },
    }),
    movieClient: new TestMovieClient({
      movies: [
        buildMovie({ title: 'Soul' }),
        buildMovie({ title: 'Soul' }),
        buildMovie({ title: 'Soul' }),
        buildMovie({ title: 'Soul' }),
        buildMovie({ title: 'Soul' }),
        buildMovie({ title: 'Soul' }),
        buildMovie({ title: 'Soul' }),
        buildMovie({ title: 'Soul' }),
        buildMovie({ title: 'Soul' }),
        buildMovie({ title: 'Soul' }),
        buildMovie({ title: 'Soul' }),
        buildMovie({ title: 'Soul' }),
        buildMovie({ title: 'Soul' }),
        buildMovie({ title: 'Soul' }),
        buildMovie({ title: 'Soul' }),
        buildMovie({ title: 'Soul' }),
        buildMovie({ title: 'Soul' }),
        buildMovie({ title: 'Soul' }),
        buildMovie({ title: 'Soul' }),
        buildMovie({ title: 'Soul' }),
        buildMovie({ title: 'Soul' }),
      ],
    }),
  });
  const movies = await lister.list({
    endDate: DateTime.fromISO('2021-01-01'),
    startDate: DateTime.fromISO('2010-01-01'),
  });
  expect(movies).toHaveLength(21);
});

test('handles movie not found error', async () => {
  const lister = new MovieLister({
    metascoreClient: new TestMetascoreClient({
      responses: {
        Soul: { score: 83 },
      },
    }),
    movieClient: new TestMovieClient({
      movies: [
        {
          id: '1',
          popularity: 50,
          releaseDate: DateTime.fromISO('2020-08-11'),
          score: 8.0,
          title: 'Soul',
        },
        {
          id: '2',
          popularity: 100,
          releaseDate: DateTime.fromISO('2015-06-19'),
          score: 8.0,
          title: 'Inside Out',
        },
      ],
    }),
  });
  const movies = await lister.list({
    endDate: DateTime.fromISO('2021-01-01'),
    startDate: DateTime.fromISO('2010-01-01'),
  });
  expect(movies).toMatchObject([
    {
      id: '1',
      popularity: 50,
      releaseDate: DateTime.fromISO('2020-08-11'),
      score: 83,
      title: 'Soul',
    },
  ]);
});

test('handles insufficient reviews', async () => {
  const lister = new MovieLister({
    metascoreClient: new TestMetascoreClient({
      responses: {
        Soul: { score: 83 },
        'Inside Out': { error: new InsufficientReviewsError() },
      },
    }),
    movieClient: new TestMovieClient({
      movies: [
        {
          id: '1',
          popularity: 50,
          releaseDate: DateTime.fromISO('2020-08-11'),
          score: 8.0,
          title: 'Soul',
        },
        {
          id: '2',
          popularity: 100,
          releaseDate: DateTime.fromISO('2015-06-19'),
          score: 8.0,
          title: 'Inside Out',
        },
      ],
    }),
  });
  const movies = await lister.list({
    endDate: DateTime.fromISO('2021-01-01'),
    startDate: DateTime.fromISO('2010-01-01'),
  });
  expect(movies).toMatchObject([
    {
      id: '1',
      popularity: 50,
      releaseDate: DateTime.fromISO('2020-08-11'),
      score: 83,
      title: 'Soul',
    },
  ]);
});

test('rethrows unhandled error', async () => {
  const lister = new MovieLister({
    metascoreClient: new TestMetascoreClient({
      responses: {
        Soul: { score: 83 },
        'Inside Out': { error: new Error() },
      },
    }),
    movieClient: new TestMovieClient({
      movies: [
        {
          id: '1',
          popularity: 50,
          releaseDate: DateTime.fromISO('2020-08-11'),
          score: 8.0,
          title: 'Soul',
        },
        {
          id: '2',
          popularity: 100,
          releaseDate: DateTime.fromISO('2015-06-19'),
          score: 8.0,
          title: 'Inside Out',
        },
      ],
    }),
  });
  await expect(
    lister.list({
      endDate: DateTime.fromISO('2021-01-01'),
      startDate: DateTime.fromISO('2010-01-01'),
    })
  ).rejects.toThrow();
});
