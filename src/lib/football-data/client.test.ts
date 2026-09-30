import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createFootballDataClient, FootballDataError } from './client.ts';

const competitionPayload = {
  competitions: [
    {
      id: 2021,
      code: 'PL',
      name: 'Premier League',
      type: 'LEAGUE',
      emblem: null,
      currentSeason: {
        id: 2502,
        startDate: '2026-08-21',
        endDate: '2027-05-30',
        currentMatchday: null,
      },
    },
  ],
};

const matchPayload = {
  id: 560593,
  competition: { id: 2021, code: 'PL', name: 'Premier League' },
  utcDate: '2026-10-03T14:00:00Z',
  status: 'TIMED',
  matchday: 7,
  stage: 'REGULAR_SEASON',
  group: null,
  homeTeam: { id: 402, name: 'Brentford FC', shortName: null, crest: null },
  awayTeam: {
    id: 65,
    name: 'Manchester City FC',
    shortName: 'Man City',
    crest: null,
  },
  score: {
    winner: null,
    duration: 'REGULAR',
    fullTime: { home: null, away: null },
  },
};

describe('Football-Data.org client', () => {
  it('maps authenticated competitions without exposing the token', async () => {
    let requestedUrl = '';
    let requestedToken = '';
    const fetcher: typeof fetch = async (input, init) => {
      requestedUrl = String(input);
      requestedToken = new Headers(init?.headers).get('X-Auth-Token') ?? '';
      return Response.json(competitionPayload);
    };
    const client = createFootballDataClient({ apiKey: 'private-key', fetcher });

    const competitions = await client.getCompetitions();

    assert.equal(requestedUrl, 'https://api.football-data.org/v4/competitions');
    assert.equal(requestedToken, 'private-key');
    assert.deepEqual(competitions, [
      {
        id: 2021,
        code: 'PL',
        name: 'Premier League',
        type: 'LEAGUE',
        emblem: null,
        currentSeason: {
          id: 2502,
          startDate: '2026-08-21',
          endDate: '2027-05-30',
          currentMatchday: null,
        },
      },
    ]);
    assert.equal(JSON.stringify(competitions).includes('private-key'), false);
  });

  it('uses bounded filters and preserves a future match null score', async () => {
    let requestedUrl = '';
    const fetcher: typeof fetch = async (input) => {
      requestedUrl = String(input);
      return Response.json({ matches: [matchPayload] });
    };
    const client = createFootballDataClient({ apiKey: 'private-key', fetcher });

    const matches = await client.getCompetitionMatches('PL', {
      dateFrom: '2026-10-01',
      dateTo: '2026-10-08',
    });

    assert.equal(
      requestedUrl,
      'https://api.football-data.org/v4/competitions/PL/matches?dateFrom=2026-10-01&dateTo=2026-10-08',
    );
    assert.equal(matches[0]?.status, 'TIMED');
    assert.deepEqual(matches[0]?.score.fullTime, { home: null, away: null });
    assert.equal(matches[0]?.homeTeam?.name, 'Brentford FC');
  });

  it('accepts only listed competition codes in daily filters', async () => {
    let requestedUrl = '';
    const fetcher: typeof fetch = async (input) => {
      requestedUrl = String(input);
      return Response.json({ matches: [] });
    };
    const client = createFootballDataClient({ apiKey: 'private-key', fetcher });

    await client.getDailyMatches('2026-09-30', ['PL', 'CLI']);

    assert.equal(
      requestedUrl,
      'https://api.football-data.org/v4/matches?date=2026-09-30&competitions=PL%2CCLI',
    );
    await assert.rejects(
      client.getDailyMatches('2026-09-30', ['PL', '../secret']),
      (error: unknown) =>
        error instanceof FootballDataError &&
        error.category === 'invalid-input',
    );
    await assert.rejects(
      client.getDailyMatches('2026-09-30', 'PL' as unknown as string[]),
      (error: unknown) =>
        error instanceof FootballDataError &&
        error.category === 'invalid-input',
    );
  });

  it('routes the remaining contract endpoints through fixed paths', async () => {
    const requestedPaths: string[] = [];
    const fetcher: typeof fetch = async (input) => {
      const requestedPath = new URL(String(input)).pathname;
      requestedPaths.push(requestedPath);
      if (requestedPath.endsWith('/standings')) {
        return Response.json({ standings: [] });
      }
      if (requestedPath.endsWith('/matches')) {
        return Response.json({ matches: [] });
      }
      if (requestedPath.includes('/teams/')) {
        return Response.json({
          id: 402,
          name: 'Brentford FC',
          shortName: null,
          tla: null,
          crest: null,
          venue: null,
        });
      }
      if (requestedPath.includes('/competitions/')) {
        return Response.json(competitionPayload.competitions[0]);
      }
      return Response.json(matchPayload);
    };
    const client = createFootballDataClient({ apiKey: 'private-key', fetcher });

    await client.getCompetition('PL');
    await client.getCompetitionStandings('CL');
    await client.getMatch(560593);
    await client.getTeam(402);
    await client.getTeamMatches(402, {
      dateFrom: '2026-09-01',
      dateTo: '2026-10-01',
      limit: 20,
    });

    assert.deepEqual(requestedPaths, [
      '/v4/competitions/PL',
      '/v4/competitions/CL/standings',
      '/v4/matches/560593',
      '/v4/teams/402',
      '/v4/teams/402/matches',
    ]);
  });

  it('rejects invalid ids, dates and unbounded ranges before fetch', async () => {
    let requestCount = 0;
    const fetcher: typeof fetch = async () => {
      requestCount += 1;
      return Response.json({ matches: [] });
    };
    const client = createFootballDataClient({ apiKey: 'private-key', fetcher });
    const calls = [
      () => client.getMatch(0),
      () => client.getTeam(Number.NaN),
      () => client.getCompetition('../PL'),
      () => client.getDailyMatches('2026-02-30'),
      () =>
        client.getCompetitionMatches('PL', {
          dateFrom: '2026-09-01',
          dateTo: '2026-11-01',
        }),
      () =>
        client.getTeamMatches(402, {
          dateFrom: '2026-10-02',
          dateTo: '2026-10-01',
        }),
      () =>
        client.getTeamMatches(402, {
          dateFrom: '2026-09-01',
          dateTo: '2026-10-01',
          limit: 501,
        }),
    ];

    for (const call of calls) {
      await assert.rejects(
        call(),
        (error: unknown) =>
          error instanceof FootballDataError &&
          error.category === 'invalid-input',
      );
    }
    assert.equal(requestCount, 0);
  });

  it('classifies HTTP failures without returning upstream text or token', async () => {
    const cases = [
      { status: 400, category: 'bad-request' },
      { status: 401, category: 'unauthorized' },
      { status: 403, category: 'forbidden' },
      { status: 404, category: 'not-found' },
      { status: 429, category: 'rate-limited' },
      { status: 503, category: 'upstream' },
    ] as const;
    for (const { status, category } of cases) {
      const fetcher: typeof fetch = async () =>
        new Response('private-key sensitive upstream details', { status });
      const client = createFootballDataClient({
        apiKey: 'private-key',
        fetcher,
      });

      await assert.rejects(client.getCompetitions(), (error: unknown) => {
        assert.ok(error instanceof FootballDataError);
        assert.equal(error.category, category);
        assert.equal(error.status, status);
        assert.equal(error.message.includes('private-key'), false);
        assert.equal(error.message.includes('sensitive'), false);
        return true;
      });
    }
  });

  it('classifies timeout and malformed success payloads', async () => {
    const timeoutFetcher: typeof fetch = async () => {
      throw new DOMException('provider details', 'TimeoutError');
    };
    const timedClient = createFootballDataClient({
      apiKey: 'private-key',
      fetcher: timeoutFetcher,
    });
    await assert.rejects(
      timedClient.getCompetitions(),
      (error: unknown) =>
        error instanceof FootballDataError && error.category === 'timeout',
    );

    const malformedFetcher: typeof fetch = async () =>
      Response.json({ competitions: null });
    const malformedClient = createFootballDataClient({
      apiKey: 'private-key',
      fetcher: malformedFetcher,
    });
    await assert.rejects(
      malformedClient.getCompetitions(),
      (error: unknown) =>
        error instanceof FootballDataError &&
        error.category === 'malformed-response',
    );

    const invalidJsonFetcher: typeof fetch = async () =>
      new Response('not json', { status: 200 });
    const invalidJsonClient = createFootballDataClient({
      apiKey: 'private-key',
      fetcher: invalidJsonFetcher,
    });
    await assert.rejects(
      invalidJsonClient.getCompetitions(),
      (error: unknown) =>
        error instanceof FootballDataError &&
        error.category === 'malformed-response',
    );
  });

  it('classifies network failures without leaking fetch errors', async () => {
    const fetcher: typeof fetch = async () => {
      throw new TypeError('private-key and provider URL');
    };
    const client = createFootballDataClient({ apiKey: 'private-key', fetcher });

    await assert.rejects(client.getCompetitions(), (error: unknown) => {
      assert.ok(error instanceof FootballDataError);
      assert.equal(error.category, 'network');
      assert.equal(error.message.includes('private-key'), false);
      return true;
    });
  });
});
