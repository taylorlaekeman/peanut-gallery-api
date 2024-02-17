import { expect, test } from '@jest/globals';
import { DateTime } from 'luxon';

import getServer, { getTestContext } from './api.js';
import { TestMetascoreClient } from './metascoreClient.js';
import { TestMovieClient } from './movieClient.js';
import { TestMovieWriter } from './movieWriter.js';

const POPULATE_MOVIES_QUERY = `#graphql
  mutation PopulateMovies($endDate: String, $startDate: String) {
    populateMovies(endDate: $endDate, startDate: $startDate) {
      status
    }
  }
`;

test('populates movies', async () => {
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
  const api = getServer();
  const response = await api.executeOperation(
    {
      query: POPULATE_MOVIES_QUERY,
      variables: {
        endDate: '2021-01-01',
        startDate: '2010-01-01',
      },
    },
    {
      contextValue: getTestContext({
        metascoreClient,
        movieClient,
        movieWriter,
        now: DateTime.fromISO('2020-01-01'),
      }),
    }
  );
  if (response.body.kind !== 'single') throw new Error('not single result');
  expect(response.body.singleResult.data).toMatchObject({
    populateMovies: { status: 200 },
  });
  expect(movieWriter.data).toMatchObject({
    1: {
      id: '1',
      popularity: 50,
      releaseDate: DateTime.fromISO('2020-08-11'),
      score: 0.83,
      title: 'Soul',
    },
    2: {
      id: '2',
      popularity: 100,
      releaseDate: DateTime.fromISO('2015-06-19'),
      score: 0.94,
      title: 'Inside Out',
    },
  });
});

test('uses start date one month ago when none is provided', async () => {
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
        releaseDate: DateTime.fromISO('2019-12-01'),
        score: 8.0,
        title: 'Soul',
      },
      {
        id: '2',
        popularity: 100,
        releaseDate: DateTime.fromISO('2019-11-30'),
        score: 8.0,
        title: 'Inside Out',
      },
    ],
  });
  const movieWriter = new TestMovieWriter();
  const api = getServer();
  const response = await api.executeOperation(
    {
      query: POPULATE_MOVIES_QUERY,
      variables: {
        endDate: '2021-01-01',
      },
    },
    {
      contextValue: getTestContext({
        metascoreClient,
        movieClient,
        movieWriter,
        now: DateTime.fromISO('2020-01-01'),
      }),
    }
  );
  if (response.body.kind !== 'single') throw new Error('not single result');
  expect(response.body.singleResult.data).toMatchObject({
    populateMovies: { status: 200 },
  });
  expect(movieWriter.data).toMatchObject({
    1: {
      id: '1',
      popularity: 50,
      releaseDate: DateTime.fromISO('2019-12-01'),
      score: 0.83,
      title: 'Soul',
    },
  });
});

test('uses end date one month in the future when none is provided', async () => {
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
        releaseDate: DateTime.fromISO('2020-02-01'),
        score: 8.0,
        title: 'Soul',
      },
      {
        id: '2',
        popularity: 100,
        releaseDate: DateTime.fromISO('2020-02-02'),
        score: 8.0,
        title: 'Inside Out',
      },
    ],
  });
  const movieWriter = new TestMovieWriter();
  const api = getServer();
  const response = await api.executeOperation(
    {
      query: POPULATE_MOVIES_QUERY,
      variables: {
        startDate: '2010-01-01',
      },
    },
    {
      contextValue: getTestContext({
        metascoreClient,
        movieClient,
        movieWriter,
        now: DateTime.fromISO('2020-01-01'),
      }),
    }
  );
  if (response.body.kind !== 'single') throw new Error('not single result');
  expect(response.body.singleResult.data).toMatchObject({
    populateMovies: { status: 200 },
  });
  expect(movieWriter.data).toMatchObject({
    1: {
      id: '1',
      popularity: 50,
      releaseDate: DateTime.fromISO('2020-02-01'),
      score: 0.83,
      title: 'Soul',
    },
  });
});
