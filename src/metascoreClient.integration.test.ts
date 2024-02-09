import { expect, test } from '@jest/globals';

import {
  HttpMetascoreClient as MetascoreClient,
  InsufficientReviewsError,
  MovieNotFoundError,
} from './metascoreClient.js';

test('returns metascore', async () => {
  const client = new MetascoreClient();
  const score = await client.getMetascore('Soul');
  expect(score).toBe(83);
});

test('throws movie not found', async () => {
  const client = new MetascoreClient();
  await expect(client.getMetascore('asdf123')).rejects.toThrow(
    MovieNotFoundError
  );
});

test('throws insufficient reviews', async () => {
  const client = new MetascoreClient();
  await expect(client.getMetascore('Badland Hunters')).rejects.toThrow(
    InsufficientReviewsError
  );
});
