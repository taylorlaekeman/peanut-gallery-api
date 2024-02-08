import { ApolloServer } from '@apollo/server';
/* eslint-disable-next-line import/extensions */
import { startStandaloneServer } from '@apollo/server/standalone';
import { DateTime } from 'luxon';

import type { MovieClient } from './movieClient';
import { TMDBMovieClient } from './movieClient.js';

export async function startServer(): Promise<string> {
  const server = getServer();
  const { url } = await startStandaloneServer<Context>(server, {
    context: async () => ({
      movieClient: new TMDBMovieClient({ apiKey: process.env.API_KEY ?? '' }),
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
  movieClient: MovieClient;
  now: DateTime;
}

const TYPE_DEFS = `#graphql
  type Movie {
    id: String
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

  type Query {
    movies(endDate: String, page: Int, startDate: String): PaginatedMoviesResult
  }
`;

const RESOLVERS = {
  Query: {
    movies: async (
      _parent: any,
      {
        endDate,
        page = 1,
        startDate,
      }: { endDate?: string; page?: number; startDate?: string },
      { movieClient, now }: Context,
    ) => {
      const startDateOrDefault =
        startDate === undefined
          ? now.minus({ month: 1 })
          : DateTime.fromISO(startDate);
      const endDateOrDefault =
        endDate === undefined ? now : DateTime.fromISO(endDate);
      const results = await movieClient.listMovies({
        endDate: endDateOrDefault,
        page,
        startDate: startDateOrDefault,
      });
      const formattedResults = {
        ...results,
        results: results.results.map((movie) => ({
          ...movie,
          releaseDate: movie.releaseDate.toISODate(),
        })),
      };
      return formattedResults;
    },
  },
};

export default getServer;
