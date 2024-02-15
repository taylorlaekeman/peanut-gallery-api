/* eslint-disable @typescript-eslint/unbound-method */
import { expect, test } from '@jest/globals';
import { DateTime } from 'luxon';

import getServer from './api.js';
import type { Movie } from './movie';
import type { PaginatedResult } from './movieClient';
import { buildMovie, TestMovieClient } from './movieClient.js';
import { TestMetascoreClient } from './metascoreClient.js';

const moviesQuery = `#graphql
  query GetMovies($endDate: String, $page: Int, $startDate: String) {
    movies(endDate: $endDate, page: $page, startDate: $startDate) {
      page
      results {
        id
        releaseDate
        reviewCount
        score
        title
      }
      totalPages
    }
  }
`;

test('returns movie with metascore', async () => {
  const movieClient = new TestMovieClient({
    movies: [buildMovie({ id: '1', releaseDate: '2020-01-01', title: 'Soul' })],
  });
  const metascoreClient = new TestMetascoreClient({
    responses: { Soul: { score: 83 } },
  });
  const api = getServer();
  const response = await api.executeOperation(
    {
      query: moviesQuery,
    },
    {
      contextValue: {
        metascoreClient,
        movieClient,
        now: DateTime.fromISO('2020-02-01'),
      },
    }
  );
  if (response.body.kind !== 'single') throw new Error('not single result');
  const responseData = response.body.singleResult.data;
  if (responseData === undefined || responseData === null)
    throw new Error('no data');
  const paginatedMovies = responseData.movies as PaginatedResult<Movie>;
  expect(paginatedMovies.page).toBe(1);
  expect(paginatedMovies.totalPages).toBe(1);
  expect(paginatedMovies.results).toHaveLength(1);
  expect(paginatedMovies.results[0].title).toBe('Soul');
  expect(paginatedMovies.results[0].score).toBe(8.3);
});

test('uses start date one month ago when none is provided', async () => {
  const movieClient = new TestMovieClient({
    movies: [
      buildMovie({ id: '1', releaseDate: '2019-12-31', title: 'Soul' }),
      buildMovie({ id: '2', releaseDate: '2020-01-01', title: 'Soul' }),
    ],
  });
  const metascoreClient = new TestMetascoreClient({
    responses: { Soul: { score: 83 } },
  });
  const api = getServer();
  const response = await api.executeOperation(
    {
      query: moviesQuery,
      variables: {
        endDate: '2020-01-31',
        page: 1,
      },
    },
    {
      contextValue: {
        metascoreClient,
        movieClient,
        now: DateTime.fromISO('2020-02-01'),
      },
    }
  );
  if (response.body.kind !== 'single') throw new Error('not single result');
  const responseData = response.body.singleResult.data;
  if (responseData === undefined || responseData === null)
    throw new Error('no data');
  const paginatedMovies = responseData.movies as PaginatedResult<Movie>;
  expect(paginatedMovies.page).toBe(1);
  expect(paginatedMovies.totalPages).toBe(1);
  expect(paginatedMovies.results).toHaveLength(1);
  expect(paginatedMovies.results[0].id).toBe('2');
});

test('uses end date one month in the future when none is provided', async () => {
  const movieClient = new TestMovieClient({
    movies: [
      buildMovie({ id: '1', releaseDate: '2020-01-01', title: 'Soul' }),
      buildMovie({ id: '2', releaseDate: '2020-02-01', title: 'Soul' }),
    ],
  });
  const metascoreClient = new TestMetascoreClient({
    responses: { Soul: { score: 83 } },
  });
  const api = getServer();
  const response = await api.executeOperation(
    {
      query: moviesQuery,
      variables: {
        page: 1,
        startDate: '2020-01-01',
      },
    },
    {
      contextValue: {
        metascoreClient,
        movieClient,
        now: DateTime.fromISO('2020-01-01'),
      },
    }
  );
  if (response.body.kind !== 'single') throw new Error('not single result');
  const responseData = response.body.singleResult.data;
  if (responseData === undefined || responseData === null)
    throw new Error('no data');
  const paginatedMovies = responseData.movies as PaginatedResult<Movie>;
  expect(paginatedMovies.page).toBe(1);
  expect(paginatedMovies.totalPages).toBe(1);
  expect(paginatedMovies.results).toHaveLength(2);
});
