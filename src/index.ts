/* eslint-disable-next-line import/extensions */
import 'dotenv/config';

import { startServer } from './api.js';

const url = await startServer();

console.log(`🚀  Server ready at: ${url}`);

export const handler = async (): Promise<void> => {
  console.log('handler overwritten');
};
