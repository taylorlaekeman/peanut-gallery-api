import { wait } from './wait.js';

export async function waitUntil(
  executor: () => Promise<boolean>
): Promise<void> {
  let hasFinished = false;
  while (!hasFinished) {
    hasFinished = await executor();
    await wait(100);
  }
}
