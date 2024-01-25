import axios from 'axios';
import { DateTime } from 'luxon';

export interface MovieClient {
  listMovies: (input?: ListMoviesInput) => Promise<PaginatedResult<Movie>>;
}

interface ListMoviesInput {
  endDate?: DateTime;
  page?: number;
  startDate?: DateTime;
}

interface PaginatedResult<Type> {
  page: number;
  results: Type[];
  totalPages: number;
}

export interface Movie {
  id: string;
  releaseDate: DateTime;
  reviewCount: number;
  score: number;
  title: string;
}

export class TMDBMovieClient implements MovieClient {
  readonly apiKey: string;

  constructor({ apiKey }: { apiKey: string }) {
    this.apiKey = apiKey;
  }

  async listMovies({
    endDate,
    page,
    startDate,
  }: ListMoviesInput | undefined = {}): Promise<PaginatedResult<Movie>> {
    const params: TMDBParams = {
      api_key: this.apiKey,
      include_adult: true,
      language: 'en-US',
      sort_by: 'vote_average.desc',
      'vote_count.gte': 300,
    };
    if (startDate !== undefined)
      params['release_date.gte'] = startDate.toISODate() ?? undefined;
    if (endDate !== undefined)
      params['release_date.lte'] = endDate.toISODate() ?? undefined;
    if (page !== undefined) params.page = page;
    const response = await axios.get<TMDBResponse>(
      'https://api.themoviedb.org/3/discover/movie',
      {
        params,
      },
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
  include_adult: boolean;
  language: string;
  page?: number;
  'release_date.gte'?: string;
  'release_date.lte'?: string;
  sort_by: string;
  'vote_count.gte': number;
}

interface TMDBResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

interface TMDBMovie {
  id: number;
  release_date: string;
  title: string;
  vote_average: number;
  vote_count: number;
}

function formatTMDBMovie(movie: TMDBMovie): Movie {
  return {
    id: movie.id.toString(),
    releaseDate: DateTime.fromISO(movie.release_date),
    reviewCount: movie.vote_count,
    score: movie.vote_average,
    title: movie.title,
  };
}

export class TestMovieClient implements MovieClient {
  readonly movies: Movie[];

  constructor({ movies = [] }: { movies?: Movie[] } = {}) {
    this.movies = movies;
  }

  async listMovies({ endDate, startDate }: ListMoviesInput = {}): Promise<
    PaginatedResult<Movie>
  > {
    const moviesAfterStartDate =
      startDate === undefined
        ? this.movies
        : this.movies.filter((movie) => movie.releaseDate >= startDate);
    const moviesBeforeEndDate =
      endDate === undefined
        ? moviesAfterStartDate
        : moviesAfterStartDate.filter((movie) => movie.releaseDate <= endDate);
    return {
      page: 1,
      results: moviesBeforeEndDate.sort((a, b) => (a.score > b.score ? -1 : 1)),
      totalPages: 1,
    };
  }
}
