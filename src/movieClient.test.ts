/* eslint-disable @typescript-eslint/unbound-method */
import axios from 'axios';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { DateTime } from 'luxon';

import type { Movie } from './movieClient';
import { TestMovieClient, TMDBMovieClient } from './movieClient';

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
    const movies = await client.listMovies();
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/discover/movie',
      {
        params: {
          api_key: 'test-api-key',
          include_adult: true,
          language: 'en-US',
          sort_by: 'vote_average.desc',
          'vote_count.gte': 300,
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
    await expect(client.listMovies()).rejects.toThrow();
  });

  test('passes start date to api', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        page: 1,
        results: [],
        total_pages: 1,
      },
    });
    const client = new TMDBMovieClient({ apiKey: 'test-api-key' });
    await client.listMovies({ startDate: DateTime.fromISO('2020-01-01') });
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/discover/movie',
      {
        params: {
          api_key: 'test-api-key',
          include_adult: true,
          language: 'en-US',
          'release_date.gte': '2020-01-01',
          sort_by: 'vote_average.desc',
          'vote_count.gte': 300,
        },
      },
    );
  });

  test('passes end date to api', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        page: 1,
        results: [],
        total_pages: 1,
      },
    });
    const client = new TMDBMovieClient({ apiKey: 'test-api-key' });
    await client.listMovies({ endDate: DateTime.fromISO('2020-01-01') });
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/discover/movie',
      {
        params: {
          api_key: 'test-api-key',
          include_adult: true,
          language: 'en-US',
          'release_date.lte': '2020-01-01',
          sort_by: 'vote_average.desc',
          'vote_count.gte': 300,
        },
      },
    );
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
    await client.listMovies({ page: 10 });
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/discover/movie',
      {
        params: {
          api_key: 'test-api-key',
          include_adult: true,
          language: 'en-US',
          page: 10,
          sort_by: 'vote_average.desc',
          'vote_count.gte': 300,
        },
      },
    );
  });
});

function getMovie({
  id = 'test-id',
  releaseDate = '2020-01-01',
  reviewCount = 300,
  score = 6.0,
  title = 'Test Title',
}: {
  id?: string;
  releaseDate?: string;
  reviewCount?: number;
  score?: number;
  title?: string;
}): Movie {
  return {
    id,
    releaseDate: DateTime.fromISO(releaseDate),
    reviewCount,
    score,
    title,
  };
}

describe('test movie client', () => {
  test('returns movies ordered by score descending', async () => {
    const client = new TestMovieClient({
      movies: [
        getMovie({
          score: 7.0,
          title: 'Batman Begins',
        }),
        getMovie({
          score: 9.0,
          title: 'The Dark Knight',
        }),
        getMovie({
          score: 8.0,
          title: 'The Dark Knight Rises',
        }),
      ],
    });
    const movies = await client.listMovies();
    expect(movies).toMatchObject({
      page: 1,
      results: [
        getMovie({
          score: 9.0,
          title: 'The Dark Knight',
        }),
        getMovie({
          score: 8.0,
          title: 'The Dark Knight Rises',
        }),
        getMovie({
          score: 7.0,
          title: 'Batman Begins',
        }),
      ],
    });
  });

  test('excludes movies released before start date', async () => {
    const client = new TestMovieClient({
      movies: [
        getMovie({
          releaseDate: '2010-01-01',
          score: 7.0,
          title: 'Batman Begins',
        }),
        getMovie({
          releaseDate: '2020-01-01',
          score: 9.0,
          title: 'The Dark Knight',
        }),
        getMovie({
          releaseDate: '2020-01-01',
          score: 8.0,
          title: 'The Dark Knight Rises',
        }),
      ],
    });
    const movies = await client.listMovies({
      startDate: DateTime.fromISO('2015-01-01'),
    });
    expect(movies).toMatchObject({
      page: 1,
      results: [
        getMovie({
          releaseDate: '2020-01-01',
          score: 9.0,
          title: 'The Dark Knight',
        }),
        getMovie({
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
        getMovie({
          releaseDate: '2010-01-01',
          score: 7.0,
          title: 'Batman Begins',
        }),
        getMovie({
          releaseDate: '2010-01-01',
          score: 9.0,
          title: 'The Dark Knight',
        }),
        getMovie({
          releaseDate: '2020-01-01',
          score: 8.0,
          title: 'The Dark Knight Rises',
        }),
      ],
    });
    const movies = await client.listMovies({
      endDate: DateTime.fromISO('2015-01-01'),
    });
    expect(movies).toMatchObject({
      page: 1,
      results: [
        getMovie({
          releaseDate: '2010-01-01',
          score: 9.0,
          title: 'The Dark Knight',
        }),
        getMovie({
          releaseDate: '2010-01-01',
          score: 7.0,
          title: 'Batman Begins',
        }),
      ],
    });
  });
});
