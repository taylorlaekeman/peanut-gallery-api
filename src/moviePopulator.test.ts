import { expect, test } from '@jest/globals';
import { DateTime } from 'luxon';

import { TestMetascoreClient } from './metascoreClient.js';
import { buildMovie, TestMovieClient } from './movieClient.js';
import { TestMovieWriter } from './movieWriter.js';
import { MoviePopulator } from './moviePopulator.js';

test('fetches and stores movies and metascores', async () => {
  const metascoreClient = new TestMetascoreClient({
    responses: {
      'Inside Out': { score: 94 },
      Soul: { score: 83 },
    },
  });
  const movieClient = new TestMovieClient({
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
  });
  const movieWriter = new TestMovieWriter();
  const populator = new MoviePopulator({
    metascoreClient,
    movieClient,
    movieWriter,
  });
  await populator.populate({
    endDate: DateTime.fromISO('2021-01-01'),
    startDate: DateTime.fromISO('2010-01-01'),
  });
  expect(movieWriter.data).toMatchObject({
    2: {
      id: '2',
      popularity: 100,
      releaseDate: DateTime.fromISO('2015-06-19'),
      score: 0.94,
      title: 'Inside Out',
    },
    1: {
      id: '1',
      popularity: 50,
      releaseDate: DateTime.fromISO('2020-08-11'),
      score: 0.83,
      title: 'Soul',
    },
  });
});

test('excludes movies below popularity threshold', async () => {
  const metascoreClient = new TestMetascoreClient({
    responses: {
      'Inside Out': { score: 94 },
      Soul: { score: 83 },
    },
  });
  const movieClient = new TestMovieClient({
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
  });
  const movieWriter = new TestMovieWriter();
  const populator = new MoviePopulator({
    metascoreClient,
    movieClient,
    movieWriter,
    popularityThreshold: 75,
  });
  await populator.populate({
    endDate: DateTime.fromISO('2021-01-01'),
    startDate: DateTime.fromISO('2010-01-01'),
  });
  expect(Object.entries(movieWriter.data)).toHaveLength(1);
  expect(movieWriter.data).toMatchObject({
    2: {
      id: '2',
      popularity: 100,
      releaseDate: DateTime.fromISO('2015-06-19'),
      score: 0.94,
      title: 'Inside Out',
    },
  });
});

test('populates movies from multiple pages', async () => {
  const metascoreClient = new TestMetascoreClient({
    responses: {
      Soul: { score: 83 },
    },
  });
  const movieClient = new TestMovieClient({
    movies: [
      buildMovie({ id: '1', title: 'Soul' }),
      buildMovie({ id: '2', title: 'Soul' }),
      buildMovie({ id: '3', title: 'Soul' }),
      buildMovie({ id: '4', title: 'Soul' }),
      buildMovie({ id: '5', title: 'Soul' }),
      buildMovie({ id: '6', title: 'Soul' }),
      buildMovie({ id: '7', title: 'Soul' }),
      buildMovie({ id: '8', title: 'Soul' }),
      buildMovie({ id: '9', title: 'Soul' }),
      buildMovie({ id: '10', title: 'Soul' }),
      buildMovie({ id: '11', title: 'Soul' }),
      buildMovie({ id: '12', title: 'Soul' }),
      buildMovie({ id: '13', title: 'Soul' }),
      buildMovie({ id: '14', title: 'Soul' }),
      buildMovie({ id: '15', title: 'Soul' }),
      buildMovie({ id: '16', title: 'Soul' }),
      buildMovie({ id: '17', title: 'Soul' }),
      buildMovie({ id: '18', title: 'Soul' }),
      buildMovie({ id: '19', title: 'Soul' }),
      buildMovie({ id: '20', title: 'Soul' }),
      buildMovie({ id: '21', title: 'Soul' }),
    ],
  });
  const movieWriter = new TestMovieWriter();
  const populator = new MoviePopulator({
    metascoreClient,
    movieClient,
    movieWriter,
  });
  await populator.populate({
    endDate: DateTime.fromISO('2021-01-01'),
    startDate: DateTime.fromISO('2010-01-01'),
  });
  expect(Object.entries(movieWriter.data)).toHaveLength(21);
});

test('handles error', async () => {
  const metascoreClient = new TestMetascoreClient({
    responses: {
      'Inside Out': { error: new Error() },
      Soul: { score: 83 },
    },
  });
  const movieClient = new TestMovieClient({
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
  });
  const movieWriter = new TestMovieWriter();
  const populator = new MoviePopulator({
    metascoreClient,
    movieClient,
    movieWriter,
  });
  await populator.populate({
    endDate: DateTime.fromISO('2021-01-01'),
    startDate: DateTime.fromISO('2010-01-01'),
  });
  expect(movieWriter.data).toMatchObject({
    1: {
      id: '1',
      popularity: 50,
      releaseDate: DateTime.fromISO('2020-08-11'),
      score: 0.83,
      title: 'Soul',
    },
  });
});
