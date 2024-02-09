import type { DateTime } from 'luxon';

import type { MetascoreClient } from './metascoreClient';
import {
  InsufficientReviewsError,
  MovieNotFoundError,
} from './metascoreClient.js';
import type { Movie, MovieClient } from './movieClient';

export class MovieLister {
  readonly metascoreClient: MetascoreClient;
  readonly movieClient: MovieClient;
  readonly popularityThreshold: number;

  constructor({
    metascoreClient,
    movieClient,
    popularityThreshold = 40,
  }: {
    metascoreClient: MetascoreClient;
    movieClient: MovieClient;
    popularityThreshold?: number;
  }) {
    this.metascoreClient = metascoreClient;
    this.movieClient = movieClient;
    this.popularityThreshold = popularityThreshold;
  }

  async list({
    endDate,
    startDate,
  }: {
    endDate: DateTime;
    startDate: DateTime;
  }): Promise<Movie[]> {
    const movies = await this.getAllMovies({ endDate, startDate });
    return await this.addScores(movies);
  }

  private async getAllMovies({
    endDate,
    startDate,
  }: {
    endDate: DateTime;
    startDate: DateTime;
  }): Promise<Movie[]> {
    const movies: Movie[] = [];
    let page = 1;
    let shouldLoop = true;
    while (shouldLoop) {
      const moviePage = await this.movieClient.listMovies({
        endDate,
        page,
        startDate,
      });
      moviePage.results.every((movie) => {
        if (movie.popularity < this.popularityThreshold) {
          shouldLoop = false;
          return false;
        }
        movies.push(movie);
        return true;
      });
      page += 1;
      if (moviePage.page === moviePage.totalPages) break;
    }
    return movies;
  }

  private async addScores(movies: Movie[]): Promise<Movie[]> {
    const scoredMovies = [];
    for (const movie of movies) {
      try {
        const score = await this.metascoreClient.getMetascore(movie.title);
        scoredMovies.push({ ...movie, score });
      } catch (error) {
        if (error instanceof MovieNotFoundError) continue;
        if (error instanceof InsufficientReviewsError) continue;
        throw error;
      }
    }
    return scoredMovies.sort((a, b) => (a.score > b.score ? -1 : 1));
  }
}
