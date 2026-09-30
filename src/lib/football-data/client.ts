const baseUrl = 'https://api.football-data.org/v4';
const maximumDateRangeDays = 31;
const defaultTimeoutMs = 8_000;
const allowedCompetitionCodes = new Set([
  'BSA',
  'ELC',
  'PL',
  'CL',
  'EC',
  'FL1',
  'BL1',
  'SA',
  'DED',
  'PPL',
  'CLI',
  'PD',
  'WC',
]);

export type FootballDataErrorCategory =
  | 'configuration'
  | 'invalid-input'
  | 'timeout'
  | 'network'
  | 'bad-request'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'rate-limited'
  | 'upstream'
  | 'malformed-response';

export class FootballDataError extends Error {
  readonly category: FootballDataErrorCategory;
  readonly status: number | null;

  constructor(
    category: FootballDataErrorCategory,
    status: number | null = null,
  ) {
    super(`Football data ${category}`);
    this.name = 'FootballDataError';
    this.category = category;
    this.status = status;
  }
}

export type FootballSeason = {
  id: number;
  startDate: string | null;
  endDate: string | null;
  currentMatchday: number | null;
};

export type FootballCompetition = {
  id: number;
  code: string;
  name: string;
  type: string | null;
  emblem: string | null;
  currentSeason: FootballSeason | null;
};

export type FootballTeamReference = {
  id: number | null;
  name: string | null;
  shortName: string | null;
  crest: string | null;
};

export type FootballTeam = {
  id: number;
  name: string;
  shortName: string | null;
  tla: string | null;
  crest: string | null;
  venue: string | null;
};

export type FootballMatch = {
  id: number;
  competition: { id: number | null; code: string | null; name: string | null };
  utcDate: string | null;
  status: string | null;
  matchday: number | null;
  stage: string | null;
  group: string | null;
  homeTeam: FootballTeamReference | null;
  awayTeam: FootballTeamReference | null;
  score: {
    winner: string | null;
    duration: string | null;
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
};

export type FootballStanding = {
  type: string | null;
  stage: string | null;
  group: string | null;
  table: Array<{
    position: number | null;
    team: FootballTeamReference | null;
    playedGames: number | null;
    won: number | null;
    draw: number | null;
    lost: number | null;
    points: number | null;
    goalsFor: number | null;
    goalsAgainst: number | null;
    goalDifference: number | null;
    form: string | null;
  }>;
};

export type DateRange = { dateFrom: string; dateTo: string };
export type TeamMatchRange = DateRange & { limit?: number };

export type FootballDataClient = {
  getCompetitions(): Promise<FootballCompetition[]>;
  getCompetition(competitionCode: string): Promise<FootballCompetition>;
  getCompetitionMatches(
    competitionCode: string,
    range: DateRange,
  ): Promise<FootballMatch[]>;
  getCompetitionStandings(competitionCode: string): Promise<FootballStanding[]>;
  getDailyMatches(
    date: string,
    competitionCodes?: readonly string[],
  ): Promise<FootballMatch[]>;
  getMatch(matchId: number): Promise<FootballMatch>;
  getTeam(teamId: number): Promise<FootballTeam>;
  getTeamMatches(
    teamId: number,
    range: TeamMatchRange,
  ): Promise<FootballMatch[]>;
};

type ClientOptions = {
  apiKey: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
};

function objectValue(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new FootballDataError('malformed-response');
  }
  return value as Record<string, unknown>;
}

function optionalObject(value: unknown): Record<string, unknown> | null {
  return value === null || value === undefined ? null : objectValue(value);
}

function requiredString(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new FootballDataError('malformed-response');
  }
  return value;
}

function optionalString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new FootballDataError('malformed-response');
  }
  return value;
}

function requiredId(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new FootballDataError('malformed-response');
  }
  return value;
}

function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new FootballDataError('malformed-response');
  }
  return value;
}

function requiredArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    throw new FootballDataError('malformed-response');
  }
  return value;
}

function mapSeason(value: unknown): FootballSeason | null {
  const season = optionalObject(value);
  if (!season) {
    return null;
  }
  return {
    id: requiredId(season.id),
    startDate: optionalString(season.startDate),
    endDate: optionalString(season.endDate),
    currentMatchday: optionalNumber(season.currentMatchday),
  };
}

function mapCompetition(value: unknown): FootballCompetition {
  const competition = objectValue(value);
  return {
    id: requiredId(competition.id),
    code: requiredString(competition.code),
    name: requiredString(competition.name),
    type: optionalString(competition.type),
    emblem: optionalString(competition.emblem),
    currentSeason: mapSeason(competition.currentSeason),
  };
}

function mapTeamReference(value: unknown): FootballTeamReference | null {
  const team = optionalObject(value);
  if (!team) {
    return null;
  }
  return {
    id: team.id === null || team.id === undefined ? null : requiredId(team.id),
    name: optionalString(team.name),
    shortName: optionalString(team.shortName),
    crest: optionalString(team.crest),
  };
}

function mapTeam(value: unknown): FootballTeam {
  const team = objectValue(value);
  return {
    id: requiredId(team.id),
    name: requiredString(team.name),
    shortName: optionalString(team.shortName),
    tla: optionalString(team.tla),
    crest: optionalString(team.crest),
    venue: optionalString(team.venue),
  };
}

function mapScoreSide(value: unknown): {
  home: number | null;
  away: number | null;
} {
  const side = optionalObject(value);
  return {
    home: optionalNumber(side?.home),
    away: optionalNumber(side?.away),
  };
}

function mapMatch(value: unknown): FootballMatch {
  const match = objectValue(value);
  const competition = optionalObject(match.competition);
  const score = optionalObject(match.score);
  return {
    id: requiredId(match.id),
    competition: {
      id:
        competition?.id === null || competition?.id === undefined
          ? null
          : requiredId(competition.id),
      code: optionalString(competition?.code),
      name: optionalString(competition?.name),
    },
    utcDate: optionalString(match.utcDate),
    status: optionalString(match.status),
    matchday: optionalNumber(match.matchday),
    stage: optionalString(match.stage),
    group: optionalString(match.group),
    homeTeam: mapTeamReference(match.homeTeam),
    awayTeam: mapTeamReference(match.awayTeam),
    score: {
      winner: optionalString(score?.winner),
      duration: optionalString(score?.duration),
      fullTime: mapScoreSide(score?.fullTime),
      halfTime: mapScoreSide(score?.halfTime),
    },
  };
}

function mapStanding(value: unknown): FootballStanding {
  const standing = objectValue(value);
  return {
    type: optionalString(standing.type),
    stage: optionalString(standing.stage),
    group: optionalString(standing.group),
    table: requiredArray(standing.table).map((value) => {
      const row = objectValue(value);
      return {
        position: optionalNumber(row.position),
        team: mapTeamReference(row.team),
        playedGames: optionalNumber(row.playedGames),
        won: optionalNumber(row.won),
        draw: optionalNumber(row.draw),
        lost: optionalNumber(row.lost),
        points: optionalNumber(row.points),
        goalsFor: optionalNumber(row.goalsFor),
        goalsAgainst: optionalNumber(row.goalsAgainst),
        goalDifference: optionalNumber(row.goalDifference),
        form: optionalString(row.form),
      };
    }),
  };
}

function validateCompetitionCode(competitionCode: string): string {
  if (!allowedCompetitionCodes.has(competitionCode)) {
    throw new FootballDataError('invalid-input');
  }
  return competitionCode;
}

function validateId(id: number): number {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new FootballDataError('invalid-input');
  }
  return id;
}

function validateDate(date: string): string {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new FootballDataError('invalid-input');
  }
  const timestamp = Date.parse(`${date}T00:00:00Z`);
  if (
    !Number.isFinite(timestamp) ||
    new Date(timestamp).toISOString().slice(0, 10) !== date
  ) {
    throw new FootballDataError('invalid-input');
  }
  return date;
}

function validateRange(range: DateRange): DateRange {
  if (!range || typeof range !== 'object') {
    throw new FootballDataError('invalid-input');
  }
  const dateFrom = validateDate(range.dateFrom);
  const dateTo = validateDate(range.dateTo);
  const durationDays =
    (Date.parse(`${dateTo}T00:00:00Z`) - Date.parse(`${dateFrom}T00:00:00Z`)) /
    86_400_000;
  if (durationDays < 1 || durationDays > maximumDateRangeDays) {
    throw new FootballDataError('invalid-input');
  }
  return { dateFrom, dateTo };
}

function categoryForStatus(status: number): FootballDataErrorCategory {
  if (status === 400) return 'bad-request';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-found';
  if (status === 429) return 'rate-limited';
  return 'upstream';
}

export function createFootballDataClient(
  options: ClientOptions,
): FootballDataClient {
  if (!options.apiKey || options.apiKey.trim().length === 0) {
    throw new FootballDataError('configuration');
  }
  const fetcher = options.fetcher ?? fetch;
  const timeoutMs = options.timeoutMs ?? defaultTimeoutMs;

  async function request(
    path: string,
    searchParams?: URLSearchParams,
  ): Promise<unknown> {
    const query = searchParams?.toString();
    const url = `${baseUrl}${path}${query ? `?${query}` : ''}`;
    let response: Response;
    try {
      response = await fetcher(url, {
        headers: { 'X-Auth-Token': options.apiKey },
        signal: AbortSignal.timeout(timeoutMs),
        cache: 'no-store',
      });
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === 'TimeoutError' || error.name === 'AbortError')
      ) {
        throw new FootballDataError('timeout');
      }
      throw new FootballDataError('network');
    }
    if (!response.ok) {
      throw new FootballDataError(
        categoryForStatus(response.status),
        response.status,
      );
    }
    try {
      return await response.json();
    } catch {
      throw new FootballDataError('malformed-response');
    }
  }

  async function requestList<T>(
    path: string,
    field: string,
    mapper: (value: unknown) => T,
    searchParams?: URLSearchParams,
  ): Promise<T[]> {
    const payload = objectValue(await request(path, searchParams));
    return requiredArray(payload[field]).map(mapper);
  }

  return {
    getCompetitions: () =>
      requestList('/competitions', 'competitions', mapCompetition),
    getCompetition: async (competitionCode) =>
      mapCompetition(
        await request(
          `/competitions/${validateCompetitionCode(competitionCode)}`,
        ),
      ),
    getCompetitionMatches: async (competitionCode, range) => {
      const code = validateCompetitionCode(competitionCode);
      const { dateFrom, dateTo } = validateRange(range);
      return requestList(
        `/competitions/${code}/matches`,
        'matches',
        mapMatch,
        new URLSearchParams({ dateFrom, dateTo }),
      );
    },
    getCompetitionStandings: async (competitionCode) =>
      requestList(
        `/competitions/${validateCompetitionCode(competitionCode)}/standings`,
        'standings',
        mapStanding,
      ),
    getDailyMatches: async (date, competitionCodes) => {
      const searchParams = new URLSearchParams({ date: validateDate(date) });
      if (competitionCodes !== undefined) {
        if (!Array.isArray(competitionCodes) || competitionCodes.length === 0) {
          throw new FootballDataError('invalid-input');
        }
        searchParams.set(
          'competitions',
          competitionCodes.map(validateCompetitionCode).join(','),
        );
      }
      return requestList('/matches', 'matches', mapMatch, searchParams);
    },
    getMatch: async (matchId) =>
      mapMatch(await request(`/matches/${validateId(matchId)}`)),
    getTeam: async (teamId) =>
      mapTeam(await request(`/teams/${validateId(teamId)}`)),
    getTeamMatches: async (teamId, range) => {
      const id = validateId(teamId);
      const { dateFrom, dateTo } = validateRange(range);
      const limit = range.limit ?? 100;
      if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
        throw new FootballDataError('invalid-input');
      }
      return requestList(
        `/teams/${id}/matches`,
        'matches',
        mapMatch,
        new URLSearchParams({ dateFrom, dateTo, limit: String(limit) }),
      );
    },
  };
}
