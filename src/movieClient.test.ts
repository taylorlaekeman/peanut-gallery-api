/* eslint-disable @typescript-eslint/unbound-method */
import axios from 'axios';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { DateTime } from 'luxon';

import { buildMovie, TestMovieClient, TMDBMovieClient } from './movieClient.js';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('tmdb movie client', () => {
  test('calls api correctly with default arguments', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        page: 1,
        results: [
          {
            id: 1,
            release_date: '2020-01-01',
            title: 'Test Title',
            vote_average: 8.0,
            vote_count: 500,
          },
        ],
        total_pages: 1,
      },
    });
    const client = new TMDBMovieClient({ apiKey: 'test-api-key' });
    const movies = await client.listMovies({
      endDate: DateTime.fromISO('2020-01-31'),
      startDate: DateTime.fromISO('2020-01-01'),
    });
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/discover/movie',
      {
        params: {
          api_key: 'test-api-key',
          language: 'en-US',
          page: 1,
          'primary_release_date.gte': '2020-01-01',
          'primary_release_date.lte': '2020-01-31',
          sort_by: 'popularity.desc',
          'vote_count.gte': 10,
          'with_runtime.gte': 60,
        },
      },
    );
    expect(movies).toMatchObject({
      page: 1,
      results: [
        {
          id: '1',
          releaseDate: DateTime.fromISO('2020-01-01'),
          reviewCount: 500,
          score: 8.0,
          title: 'Test Title',
        },
      ],
    });
  });

  test('handles api error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('test'));
    const client = new TMDBMovieClient({ apiKey: 'test-api-key' });
    await expect(
      client.listMovies({
        endDate: DateTime.fromISO('2020-01-31'),
        startDate: DateTime.fromISO('2020-01-01'),
      }),
    ).rejects.toThrow();
  });

  test('passes page to api', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        page: 10,
        results: [],
        total_pages: 10,
      },
    });
    const client = new TMDBMovieClient({ apiKey: 'test-api-key' });
    await client.listMovies({
      endDate: DateTime.fromISO('2020-01-31'),
      page: 10,
      startDate: DateTime.fromISO('2020-01-01'),
    });
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/discover/movie',
      {
        params: {
          api_key: 'test-api-key',
          language: 'en-US',
          page: 10,
          'primary_release_date.gte': '2020-01-01',
          'primary_release_date.lte': '2020-01-31',
          sort_by: 'popularity.desc',
          'vote_count.gte': 10,
          'with_runtime.gte': 60,
        },
      },
    );
  });
});

describe('test movie client', () => {
  test('returns movies ordered by score descending', async () => {
    const client = new TestMovieClient({
      movies: [
        buildMovie({
          score: 7.0,
          title: 'Batman Begins',
        }),
        buildMovie({
          score: 9.0,
          title: 'The Dark Knight',
        }),
        buildMovie({
          score: 8.0,
          title: 'The Dark Knight Rises',
        }),
      ],
    });
    const movies = await client.listMovies({
      endDate: DateTime.fromISO('2020-01-31'),
      startDate: DateTime.fromISO('2020-01-01'),
    });
    expect(movies).toMatchObject({
      page: 1,
      results: [
        buildMovie({
          score: 9.0,
          title: 'The Dark Knight',
        }),
        buildMovie({
          score: 8.0,
          title: 'The Dark Knight Rises',
        }),
        buildMovie({
          score: 7.0,
          title: 'Batman Begins',
        }),
      ],
    });
  });

  test('excludes movies released before start date', async () => {
    const client = new TestMovieClient({
      movies: [
        buildMovie({
          releaseDate: '2010-01-01',
          score: 7.0,
          title: 'Batman Begins',
        }),
        buildMovie({
          releaseDate: '2020-01-01',
          score: 9.0,
          title: 'The Dark Knight',
        }),
        buildMovie({
          releaseDate: '2020-01-01',
          score: 8.0,
          title: 'The Dark Knight Rises',
        }),
      ],
    });
    const movies = await client.listMovies({
      startDate: DateTime.fromISO('2015-01-01'),
      endDate: DateTime.fromISO('2030-01-01'),
    });
    expect(movies).toMatchObject({
      page: 1,
      results: [
        buildMovie({
          releaseDate: '2020-01-01',
          score: 9.0,
          title: 'The Dark Knight',
        }),
        buildMovie({
          releaseDate: '2020-01-01',
          score: 8.0,
          title: 'The Dark Knight Rises',
        }),
      ],
    });
  });

  test('excludes movies released after end date', async () => {
    const client = new TestMovieClient({
      movies: [
        buildMovie({
          releaseDate: '2010-01-01',
          score: 7.0,
          title: 'Batman Begins',
        }),
        buildMovie({
          releaseDate: '2010-01-01',
          score: 9.0,
          title: 'The Dark Knight',
        }),
        buildMovie({
          releaseDate: '2020-01-01',
          score: 8.0,
          title: 'The Dark Knight Rises',
        }),
      ],
    });
    const movies = await client.listMovies({
      endDate: DateTime.fromISO('2015-01-01'),
      startDate: DateTime.fromISO('2000-01-01'),
    });
    expect(movies).toMatchObject({
      page: 1,
      results: [
        buildMovie({
          releaseDate: '2010-01-01',
          score: 9.0,
          title: 'The Dark Knight',
        }),
        buildMovie({
          releaseDate: '2010-01-01',
          score: 7.0,
          title: 'Batman Begins',
        }),
      ],
    });
  });

  test('limits movies to one page', async () => {
    const client = new TestMovieClient({
      movies: [
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
      ],
    });
    const result = await client.listMovies({
      endDate: DateTime.fromISO('2020-01-31'),
      startDate: DateTime.fromISO('2020-01-01'),
    });
    expect(result.page).toBe(1);
    expect(result.results).toHaveLength(20);
    expect(result.totalPages).toBe(2);
  });

  test('selects movies based on page', async () => {
    const client = new TestMovieClient({
      movies: [
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
        buildMovie(),
      ],
    });
    const result = await client.listMovies({
      endDate: DateTime.fromISO('2020-01-31'),
      page: 2,
      startDate: DateTime.fromISO('2020-01-01'),
    });
    expect(result.page).toBe(2);
    expect(result.results).toHaveLength(1);
    expect(result.totalPages).toBe(2);
  });
});
