import { fromSSO } from '@aws-sdk/credential-providers';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DateTime } from 'luxon';

import type { Movie } from './movie';

export interface MovieReader {
  read: (input: {
    endDate: DateTime;
    orderBy?: OrderBy;
    startDate: DateTime;
  }) => Promise<Movie[]>;
}

export enum OrderBy {
  Popularity = 'popularity',
  Score = 'score',
}

export class DynamoMovieReader implements MovieReader {
  private readonly tableName: string;

  constructor({ tableName }: { tableName: string }) {
    this.tableName = tableName;
  }

  async read({
    endDate,
    orderBy = OrderBy.Score,
    startDate,
  }: {
    endDate: DateTime;
    orderBy?: OrderBy;
    startDate: DateTime;
  }): Promise<Movie[]> {
    const credentials = fromSSO({ profile: 'PowerUserAccess' });
    const client = DynamoDBDocumentClient.from(
      new DynamoDBClient({ credentials })
    );
    const weeks = getWeeks({ endDate, startDate });
    const weekMoviePromises = weeks.map(
      async (week) => await this.readWeek({ client, orderBy, week })
    );
    const results = await Promise.all(weekMoviePromises);
    return results
      .flat()
      .sort((a, b) => ((a.score ?? 0) > (b.score ?? 0) ? -1 : 1));
  }

  private async readWeek({
    client,
    orderBy,
    week,
  }: {
    client: DynamoDBDocumentClient;
    orderBy: OrderBy;
    week: string;
  }): Promise<Movie[]> {
    const response = await client.send(
      new QueryCommand({
        ExpressionAttributeNames: { '#yearWeek': 'year-week' },
        ExpressionAttributeValues: { ':yearWeek': week },
        IndexName: 'moviesByScore',
        KeyConditionExpression: '#yearWeek = :yearWeek',
        ScanIndexForward: false,
        TableName: this.tableName,
      })
    );
    const movies =
      response.Items?.map((item) => deserializeMovie(item.movie as string)) ??
      [];
    return movies;
  }
}

export function getWeeks({
  endDate,
  startDate,
}: {
  endDate: DateTime;
  startDate: DateTime;
}): string[] {
  if (startDate > endDate) return [];
  const startWeek = startDate.toFormat('yyyy-WW');
  const endWeek = endDate.toFormat('yyyy-WW');
  if (startWeek === endWeek) return [startWeek];
  const result = [startWeek];
  let date = DateTime.fromISO(startDate.toISO() ?? '');
  let week = date.toFormat('yyyy-WW');
  while (week < endWeek) {
    date = date.plus({ week: 1 });
    week = date.toFormat('yyyy-WW');
    result.push(week);
  }
  return result;
}

function deserializeMovie(serializedMovie: string): Movie {
  const deserializedJson = JSON.parse(serializedMovie);
  const movie: Movie = {
    ...deserializedJson,
    releaseDate: DateTime.fromISO(deserializedJson.releaseDate as string),
  };
  return movie;
}

export class TestMovieReader implements MovieReader {
  private readonly movies: Record<string, Movie>;

  constructor({ movies = {} }: { movies?: Record<string, Movie> } = {}) {
    this.movies = movies;
  }

  async read({
    endDate,
    orderBy = OrderBy.Score,
    startDate,
  }: {
    endDate: DateTime;
    orderBy?: OrderBy;
    startDate: DateTime;
  }): Promise<Movie[]> {
    const sortedMovies = Object.values(this.movies).sort((a, b) =>
      (a.score ?? 0) > (b.score ?? 0) ? -1 : 1
    );
    const moviesReleasedAfterStartDate = sortedMovies.filter(
      (movie) => movie.releaseDate >= startDate
    );
    const moviesReleasedBeforeEndDate = moviesReleasedAfterStartDate.filter(
      (movie) => movie.releaseDate <= endDate
    );
    return moviesReleasedBeforeEndDate;
  }
}
