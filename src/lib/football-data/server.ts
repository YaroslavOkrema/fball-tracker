import 'server-only';

import { createFootballDataClient, type FootballDataClient } from './client';

export function getFootballDataClient(): FootballDataClient {
  return createFootballDataClient({
    apiKey: process.env.FOOTBALL_DATA_API_KEY ?? '',
  });
}
