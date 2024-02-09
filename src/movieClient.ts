import axios from 'axios';
import { DateTime } from 'luxon';

export interface MovieClient {
  listMovies: (input: ListMoviesInput) => Promise<PaginatedResult<Movie>>;
}

interface ListMoviesInput {
  endDate: DateTime;
  page?: number;
  startDate: DateTime;
}

export interface PaginatedResult<Type> {
  page: number;
  results: Type[];
  totalPages: number;
}

export interface Movie {
  id: string;
  popularity: number;
  releaseDate: DateTime;
  score?: number;
  title: string;
}

export class TMDBMovieClient implements MovieClient {
  readonly apiKey: string;

  constructor({ apiKey }: { apiKey: string }) {
    this.apiKey = apiKey;
  }

  async listMovies({
    endDate,
    page = 1,
    startDate,
  }: ListMoviesInput): Promise<PaginatedResult<Movie>> {
    const params: TMDBParams = {
      api_key: this.apiKey,
      language: 'en-US',
      page,
      'primary_release_date.gte': startDate.toISODate() ?? undefined,
      'primary_release_date.lte': endDate.toISODate() ?? undefined,
      sort_by: 'popularity.desc',
      'vote_count.gte': 10,
      'with_runtime.gte': 60,
    };
    const response = await axios.get<TMDBResponse>(
      'https://api.themoviedb.org/3/discover/movie',
      {
        params,
      }
    );
    return {
      page: response.data.page,
      results: response.data.results.map(formatTMDBMovie),
      totalPages: response.data.total_pages,
    };
  }
}

interface TMDBParams {
  api_key: string;
  include_adult?: boolean;
  language: string;
  page?: number;
  'primary_release_date.gte'?: string;
  'primary_release_date.lte'?: string;
  sort_by: string;
  'vote_count.gte': number;
  'with_runtime.gte'?: number;
}

interface TMDBResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

interface TMDBMovie {
  id: number;
  popularity: number;
  release_date: string;
  title: string;
  vote_average: number;
  vote_count: number;
}

function formatTMDBMovie(movie: TMDBMovie): Movie {
  return {
    id: movie.id.toString(),
    popularity: movie.popularity,
    releaseDate: DateTime.fromISO(movie.release_date),
    score: movie.vote_average,
    title: movie.title,
  };
}

export class TestMovieClient implements MovieClient {
  readonly movies: Movie[];

  readonly pageSize: number = 20;

  constructor({ movies = [] }: { movies?: Movie[] } = {}) {
    this.movies = movies;
  }

  async listMovies({
    endDate,
    page = 1,
    startDate,
  }: ListMoviesInput): Promise<PaginatedResult<Movie>> {
    const moviesAfterStartDate =
      startDate === undefined
        ? this.movies
        : this.movies.filter((movie) => movie.releaseDate >= startDate);
    const moviesBeforeEndDate =
      endDate === undefined
        ? moviesAfterStartDate
        : moviesAfterStartDate.filter((movie) => movie.releaseDate <= endDate);
    const sortedMovies = moviesBeforeEndDate.sort((a, b) =>
      a.popularity > b.popularity ? -1 : 1
    );
    const pageStartIndex = (page - 1) * this.pageSize;
    const pageEndIndex = pageStartIndex + this.pageSize;
    const pagedMovies = sortedMovies.slice(pageStartIndex, pageEndIndex);
    return {
      page,
      results: pagedMovies,
      totalPages: Math.ceil(sortedMovies.length / this.pageSize),
    };
  }
}

export function buildMovie({
  id = 'test-id',
  popularity = 50,
  releaseDate = '2020-01-01',
  score = 6.0,
  title = 'Test Title',
}: {
  id?: string;
  popularity?: number;
  releaseDate?: string;
  reviewCount?: number;
  score?: number;
  title?: string;
} = {}): Movie {
  return {
    id,
    popularity,
    releaseDate: DateTime.fromISO(releaseDate),
    score,
    title,
  };
}
