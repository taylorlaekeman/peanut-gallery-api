import axios from 'axios';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';

import {
  HttpMetascoreClient as MetascoreClient,
  InsufficientReviewsError,
  MovieNotFoundError,
  TestMetascoreClient,
} from './metascoreClient.js';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('HttpMetascoreClient', () => {
  test('returns metascore', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: '<div class="c-productScoreInfo"><div class="c-siteReviewScore"><span>90</span></div></div>',
    });
    const client = new MetascoreClient();
    const score = await client.getMetascore('Soul');
    expect(score).toBe(90);
  });

  test('throws movie not found', async () => {
    mockedAxios.isAxiosError.mockReturnValueOnce(true);
    mockedAxios.get.mockRejectedValueOnce({ response: { status: 404 } });
    const client = new MetascoreClient();
    await expect(client.getMetascore('asdf123')).rejects.toThrow(
      MovieNotFoundError,
    );
  });

  test('throws insufficient reviews', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: '<span class="c-productHero_scoreRemainder" />',
    });
    const client = new MetascoreClient();
    await expect(client.getMetascore('Badland Hunters')).rejects.toThrow(
      InsufficientReviewsError,
    );
  });
});

describe('TestMetascoreClient', () => {
  test('returns metascore', async () => {
    const client = new TestMetascoreClient({
      responses: { Soul: { score: 90 } },
    });
    const score = await client.getMetascore('Soul');
    expect(score).toBe(90);
  });

  test('throws movie not found', async () => {
    const client = new TestMetascoreClient();
    await expect(client.getMetascore('asdf123')).rejects.toThrow(
      MovieNotFoundError,
    );
  });

  test('throws insufficient reviews', async () => {
    const client = new TestMetascoreClient({
      responses: {
        'Badland Hunters': { error: new InsufficientReviewsError() },
      },
    });
    await expect(client.getMetascore('Badland Hunters')).rejects.toThrow(
      InsufficientReviewsError,
    );
  });
});
