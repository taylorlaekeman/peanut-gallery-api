import { ApolloServer } from '@apollo/server';
/* eslint-disable-next-line import/extensions */
import { startStandaloneServer } from '@apollo/server/standalone';
import { DateTime } from 'luxon';

import type { MetascoreClient } from './metascoreClient';
import { HttpMetascoreClient, TestMetascoreClient } from './metascoreClient.js';
import type { MovieClient } from './movieClient';
import { TestMovieClient, TMDBMovieClient } from './movieClient.js';
import type { MovieReader } from './movieReader';
import { DynamoMovieReader, TestMovieReader } from './movieReader.js';
import type { MovieWriter } from './movieWriter';
import { DynamoMovieWriter, TestMovieWriter } from './movieWriter.js';
import { MoviePopulator } from './moviePopulator.js';

export async function startServer(): Promise<string> {
  const server = getServer();
  const { url } = await startStandaloneServer<Context>(server, {
    context: async () => ({
      metascoreClient: new HttpMetascoreClient(),
      movieClient: new TMDBMovieClient({ apiKey: process.env.API_KEY ?? '' }),
      movieWriter: new DynamoMovieWriter({
        tableName: process.env.MOVIE_TABLE_NAME ?? '',
      }),
      movieReader: new DynamoMovieReader({
        tableName: process.env.MOVIE_TABLE_NAME ?? '',
      }),
      now: DateTime.now(),
    }),
    listen: { port: 4000 },
  });
  return url;
}

export function getServer(): ApolloServer<Context> {
  return new ApolloServer<Context>({
    typeDefs: TYPE_DEFS,
    resolvers: RESOLVERS,
  });
}

interface Context {
  metascoreClient: MetascoreClient;
  movieClient: MovieClient;
  movieReader: MovieReader;
  movieWriter: MovieWriter;
  now: DateTime;
}

export function getTestContext({
  metascoreClient = new TestMetascoreClient(),
  movieClient = new TestMovieClient(),
  movieReader = new TestMovieReader(),
  movieWriter = new TestMovieWriter(),
  now = DateTime.fromISO('2020-01-01'),
}: {
  metascoreClient?: MetascoreClient;
  movieClient?: MovieClient;
  movieReader?: MovieReader;
  movieWriter?: MovieWriter;
  now?: DateTime;
}): Context {
  return { metascoreClient, movieClient, movieReader, movieWriter, now };
}

const TYPE_DEFS = `#graphql
  type Movie {
    id: ID
    releaseDate: String
    reviewCount: Int
    score: Float
    title: String
  }

  type PaginatedMoviesResult {
    page: Int
    results: [Movie]
    totalPages: Int
  }

  type PopulateMoviesResult {
    status: Int
  }

  type Query {
    movies(endDate: String, page: Int, startDate: String): PaginatedMoviesResult
  }

  type Mutation {
    populateMovies(endDate: String, startDate: String): PopulateMoviesResult
  }
`;

const RESOLVERS = {
  Mutation: {
    populateMovies: async (
      _parent: any,
      { endDate, startDate }: { endDate?: string; startDate?: string },
      { metascoreClient, movieClient, movieWriter, now }: Context
    ) => {
      const startDateOrDefault =
        startDate === undefined
          ? now.minus({ month: 1 })
          : DateTime.fromISO(startDate);
      const endDateOrDefault =
        endDate === undefined
          ? now.plus({ month: 1 })
          : DateTime.fromISO(endDate);
      const moviePopulator = new MoviePopulator({
        metascoreClient,
        movieClient,
        movieWriter,
      });
      await moviePopulator.populate({
        endDate: endDateOrDefault,
        startDate: startDateOrDefault,
      });
      return { status: 200 };
    },
  },
  Query: {
    movies: async (
      _parent: any,
      {
        endDate,
        page = 1,
        startDate,
      }: { endDate?: string; page?: number; startDate?: string },
      { movieReader, now }: Context
    ) => {
      const startDateOrDefault =
        startDate === undefined
          ? now.minus({ month: 1 })
          : DateTime.fromISO(startDate);
      const endDateOrDefault =
        endDate === undefined
          ? now.plus({ month: 1 })
          : DateTime.fromISO(endDate);
      const movies = await movieReader.read({
        endDate: endDateOrDefault,
        startDate: startDateOrDefault,
      });
      const formattedMovies = movies.map((movie) => ({
        ...movie,
        releaseDate: movie.releaseDate.toISODate(),
      }));
      return {
        page: 1,
        results: formattedMovies,
        totalPages: 1,
      };
    },
  },
};

export default getServer;
