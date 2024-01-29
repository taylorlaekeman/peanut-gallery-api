import { ApolloServer } from '@apollo/server';
import { DateTime } from 'luxon';

import type { MovieClient } from './movieClient';

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
      return await movieClient.listMovies({
        endDate: endDateOrDefault,
        page,
        startDate: startDateOrDefault,
      });
    },
  },
};

export default getServer;