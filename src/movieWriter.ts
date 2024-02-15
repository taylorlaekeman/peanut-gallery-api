import { fromSSO } from '@aws-sdk/credential-providers';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

import type { Movie } from './movie';

export interface MovieWriter {
  write: (input: WriteMovieInput) => Promise<WriteMovieResult>;
}

interface WriteMovieInput {
  movie: Movie;
}

interface WriteMovieResult {
  movie: Movie;
}

export class DynamoMovieWriter implements MovieWriter {
  private readonly tableName: string;

  constructor({ tableName }: { tableName: string }) {
    this.tableName = tableName;
  }

  async write({ movie }: WriteMovieInput): Promise<WriteMovieResult> {
    const credentials = fromSSO({ profile: 'PowerUserAccess' });
    const client = DynamoDBDocumentClient.from(
      new DynamoDBClient({ credentials })
    );
    const yearWeek = movie.releaseDate.toFormat('yyyy-WW');
    await client.send(
      new PutCommand({
        Item: {
          movie: JSON.stringify({
            ...movie,
            releaseDate: movie.releaseDate.toISODate(),
          }),
          'popularity-id': `${movie.popularity}-${movie.id}`,
          'score-id': `${movie.score}-${movie.id}`,
          'year-week': yearWeek,
        },
        TableName: this.tableName,
      })
    );
    return {
      movie,
    };
  }
}

export class TestMovieWriter implements MovieWriter {
  readonly data: Record<string, Movie> = {};

  async write({ movie }: WriteMovieInput): Promise<WriteMovieResult> {
    this.data[movie.id] = movie;
    return { movie };
  }
}
