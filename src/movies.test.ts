/* eslint-disable @typescript-eslint/unbound-method */
import { expect, test } from '@jest/globals';
import { DateTime } from 'luxon';

import getServer from './api.js';
import type { Movie, PaginatedResult } from './movieClient';
import { buildMovie, TestMovieClient } from './movieClient.js';

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

test('resolver passes arguments to movie client', async () => {
  const client = new TestMovieClient({
    movies: [
      buildMovie({ id: '1', releaseDate: '2019-12-31' }),
      buildMovie({ id: '2', releaseDate: '2020-02-01' }),
      buildMovie({ id: '3', releaseDate: '2020-01-01' }),
      buildMovie({ id: '4', releaseDate: '2020-01-01' }),
      buildMovie({ id: '5', releaseDate: '2020-01-01' }),
      buildMovie({ id: '6', releaseDate: '2020-01-01' }),
      buildMovie({ id: '7', releaseDate: '2020-01-01' }),
      buildMovie({ id: '8', releaseDate: '2020-01-01' }),
      buildMovie({ id: '9', releaseDate: '2020-01-01' }),
      buildMovie({ id: '10', releaseDate: '2020-01-01' }),
      buildMovie({ id: '11', releaseDate: '2020-01-01' }),
      buildMovie({ id: '12', releaseDate: '2020-01-01' }),
      buildMovie({ id: '13', releaseDate: '2020-01-01' }),
      buildMovie({ id: '14', releaseDate: '2020-01-01' }),
      buildMovie({ id: '15', releaseDate: '2020-01-01' }),
      buildMovie({ id: '16', releaseDate: '2020-01-01' }),
      buildMovie({ id: '17', releaseDate: '2020-01-01' }),
      buildMovie({ id: '18', releaseDate: '2020-01-01' }),
      buildMovie({ id: '19', releaseDate: '2020-01-01' }),
      buildMovie({ id: '20', releaseDate: '2020-01-01' }),
      buildMovie({ id: '21', releaseDate: '2020-01-01' }),
      buildMovie({ id: '22', releaseDate: '2020-01-01' }),
      buildMovie({ id: '23', releaseDate: '2020-01-01' }),
    ],
  });
  const api = getServer();
  const response = await api.executeOperation(
    {
      query: moviesQuery,
      variables: {
        endDate: '2020-01-31',
        page: 2,
        startDate: '2020-01-01',
      },
    },
    {
      contextValue: {
        movieClient: client,
        now: DateTime.fromISO('2020-01-01'),
      },
    },
  );
  if (response.body.kind !== 'single') throw new Error('not single result');
  const responseData = response.body.singleResult.data;
  if (responseData === undefined || responseData === null)
    throw new Error('no data');
  const paginatedMovies = responseData.movies as PaginatedResult<Movie>;
  expect(paginatedMovies.page).toBe(2);
  expect(paginatedMovies.totalPages).toBe(2);
  expect(paginatedMovies.results).toHaveLength(1);
  expect(paginatedMovies.results[0].id).toBe('23');
});

test('uses start date one month ago when none is provided', async () => {
  const client = new TestMovieClient({
    movies: [
      buildMovie({ id: '1', releaseDate: '2019-12-31' }),
      buildMovie({ id: '2', releaseDate: '2020-01-01' }),
    ],
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
        movieClient: client,
        now: DateTime.fromISO('2020-02-01'),
      },
    },
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

test('uses end date today when none is provided', async () => {
  const client = new TestMovieClient({
    movies: [
      buildMovie({ id: '1', releaseDate: '2020-01-01' }),
      buildMovie({ id: '2', releaseDate: '2020-02-01' }),
    ],
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
        movieClient: client,
        now: DateTime.fromISO('2020-01-01'),
      },
    },
  );
  if (response.body.kind !== 'single') throw new Error('not single result');
  const responseData = response.body.singleResult.data;
  if (responseData === undefined || responseData === null)
    throw new Error('no data');
  const paginatedMovies = responseData.movies as PaginatedResult<Movie>;
  expect(paginatedMovies.page).toBe(1);
  expect(paginatedMovies.totalPages).toBe(1);
  expect(paginatedMovies.results).toHaveLength(1);
  expect(paginatedMovies.results[0].id).toBe('1');
});

test('uses page 1 when none is provided', async () => {
  const client = new TestMovieClient({
    movies: [
      buildMovie({ id: '1', releaseDate: '2020-01-01' }),
      buildMovie({ id: '2', releaseDate: '2020-01-01' }),
      buildMovie({ id: '3', releaseDate: '2020-01-01' }),
      buildMovie({ id: '4', releaseDate: '2020-01-01' }),
      buildMovie({ id: '5', releaseDate: '2020-01-01' }),
      buildMovie({ id: '6', releaseDate: '2020-01-01' }),
      buildMovie({ id: '7', releaseDate: '2020-01-01' }),
      buildMovie({ id: '8', releaseDate: '2020-01-01' }),
      buildMovie({ id: '9', releaseDate: '2020-01-01' }),
      buildMovie({ id: '10', releaseDate: '2020-01-01' }),
      buildMovie({ id: '11', releaseDate: '2020-01-01' }),
      buildMovie({ id: '12', releaseDate: '2020-01-01' }),
      buildMovie({ id: '13', releaseDate: '2020-01-01' }),
      buildMovie({ id: '14', releaseDate: '2020-01-01' }),
      buildMovie({ id: '15', releaseDate: '2020-01-01' }),
      buildMovie({ id: '16', releaseDate: '2020-01-01' }),
      buildMovie({ id: '17', releaseDate: '2020-01-01' }),
      buildMovie({ id: '18', releaseDate: '2020-01-01' }),
      buildMovie({ id: '19', releaseDate: '2020-01-01' }),
      buildMovie({ id: '20', releaseDate: '2020-01-01' }),
      buildMovie({ id: '21', releaseDate: '2020-01-01' }),
    ],
  });
  const api = getServer();
  const response = await api.executeOperation(
    {
      query: moviesQuery,
      variables: {
        endDate: '2020-01-31',
        startDate: '2020-01-01',
      },
    },
    {
      contextValue: {
        movieClient: client,
        now: DateTime.fromISO('2020-01-01'),
      },
    },
  );
  if (response.body.kind !== 'single') throw new Error('not single result');
  const responseData = response.body.singleResult.data;
  if (responseData === undefined || responseData === null)
    throw new Error('no data');
  const paginatedMovies = responseData.movies as PaginatedResult<Movie>;
  expect(paginatedMovies.page).toBe(1);
  expect(paginatedMovies.totalPages).toBe(2);
  expect(paginatedMovies.results).toHaveLength(20);
  expect(paginatedMovies.results[0].id).toBe('1');
  expect(paginatedMovies.results[paginatedMovies.results.length - 1].id).toBe(
    '20',
  );
});
