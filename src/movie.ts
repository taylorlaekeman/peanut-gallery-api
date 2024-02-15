import type { DateTime } from 'luxon';

export interface Movie {
  id: string;
  popularity: number;
  releaseDate: DateTime;
  score?: number;
  title: string;
}
