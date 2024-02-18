import { describe, expect, test } from '@jest/globals';
import { DateTime } from 'luxon';

import { getWeeks } from './movieReader.js';

describe('get weeks', () => {
  test('transforms date range', () => {
    const result = getWeeks({
      endDate: DateTime.fromISO('2020-01-21'),
      startDate: DateTime.fromISO('2020-01-01'),
    });
    expect(result).toEqual(['2020-01', '2020-02', '2020-03', '2020-04']);
  });

  test('returns single week', () => {
    const result = getWeeks({
      endDate: DateTime.fromISO('2020-01-01'),
      startDate: DateTime.fromISO('2020-01-01'),
    });
    expect(result).toEqual(['2020-01']);
  });

  test('returns no weeks when end date is before start date', () => {
    const result = getWeeks({
      endDate: DateTime.fromISO('2020-01-01'),
      startDate: DateTime.fromISO('2020-01-02'),
    });
    expect(result).toEqual([]);
  });
});
