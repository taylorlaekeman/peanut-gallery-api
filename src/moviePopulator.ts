import type { DateTime } from 'luxon';

import type { MetascoreClient } from './metascoreClient';
import type { Movie } from './movie';
import type { MovieClient } from './movieClient';
import type { MovieWriter } from './movieWriter';

export class MoviePopulator {
  private readonly metascoreClient: MetascoreClient;

  private readonly movieClient: MovieClient;

  private readonly movieWriter: MovieWriter;

  private readonly popularityThreshold: number;

  constructor({
    movieClient,
    movieWriter,
    metascoreClient,
    popularityThreshold = 40,
  }: {
    metascoreClient: MetascoreClient;
    movieClient: MovieClient;
    movieWriter: MovieWriter;
    popularityThreshold?: number;
  }) {
    this.metascoreClient = metascoreClient;
    this.movieClient = movieClient;
    this.movieWriter = movieWriter;
    this.popularityThreshold = popularityThreshold;
  }

  async populate({
    endDate,
    startDate,
  }: {
    endDate: DateTime;
    startDate: DateTime;
  }): Promise<void> {
    for (let i = 1; ; i += 1) {
      try {
        await this.populatePage({ endDate, page: i, startDate });
      } catch (error) {
        break;
      }
    }
  }

  private async populatePage({
    endDate,
    page,
    startDate,
  }: {
    endDate: DateTime;
    page: number;
    startDate: DateTime;
  }): Promise<void> {
    const moviePage = await this.movieClient.listMovies({
      endDate,
      page,
      startDate,
    });
    const moviesAbovePopularityThreshold = moviePage.results.filter(
      (movie) => movie.popularity >= this.popularityThreshold
    );
    const scoredMoviePromises = moviesAbovePopularityThreshold.map(
      async (movie) => await this.getScoredMovie(movie)
    );
    const scoredMovies = await Promise.all(scoredMoviePromises);
    const writePromises = scoredMovies.map(async (movie) => {
      if (movie !== undefined) await this.movieWriter.write({ movie });
    });
    await Promise.all(writePromises);
    const isLastPage = moviesAbovePopularityThreshold.length < 20;
    if (isLastPage) throw new LastPageError();
  }

  private async getScoredMovie(movie: Movie): Promise<Movie | undefined> {
    try {
      const score = await this.metascoreClient.getMetascore(movie.title);
      return { ...movie, score: score / 100 };
    } catch (error) {
      return undefined;
    }
  }
}

class LastPageError extends Error {}
