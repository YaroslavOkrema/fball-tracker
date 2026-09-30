# FB-005: Football-Data.org v4 free-tier data contract

**Documentation verified:** 2026-09-30. **Authenticated free-account smoke check:** 2026-09-30 17:39–17:43 UTC; sanitized outcomes and examples are in [fixtures/football-data-free-2026-09-30.json](fixtures/football-data-free-2026-09-30.json). The check proves only the tested account, resources, IDs, and dates. Upstream documentation examples may describe paid or historical data.

## Boundaries and entitlement

The free plan advertises **12 competitions**, fixtures, league tables, **delayed scores and schedules**, and **10 requests per minute per account**. It does not promise live updates. Historical archives, squads, lineups, event timelines, odds, and advanced statistics are outside the MVP. Do not request unfolding headers or build screens around those fields. Keep the API token on the server when integration is implemented.

The public free-coverage page currently names nine domestic leagues and three cups. The authenticated account returned **13** competitions on 2026-09-30, including Copa Libertadores (`CLI`), which is absent from that public free-tier list. The advertised 12 is a plan description; the authenticated response governs the app. The public list is useful for choosing the initial domestic leagues, not for granting access:

| Domestic leagues shown first | Code |
| --- | --- |
| Primeira Liga (Portugal) | `PPL` |
| Premier League (England) | `PL` |
| Eredivisie (Netherlands) | `DED` |
| Bundesliga (Germany) | `BL1` |
| Ligue 1 (France) | `FL1` |
| Serie A (Italy) | `SA` |
| La Liga / Primera Division (Spain) | `PD` |
| Championship (England) | `ELC` |
| Série A (Brazil) | `BSA` |

| Cups, shown only when accessible and relevant to the current season | Code |
| --- | --- |
| UEFA Champions League | `CL` |
| FIFA World Cup | `WC` |
| European Championship | `EC` |
| Copa Libertadores (returned by the tested account) | `CLI` |

Use **authenticated** `GET /competitions` as the source of competition IDs, codes, types, and `currentSeason`; never use an unauthenticated list, the site's all-competitions table, or a documentation example to grant access. Start with the nine supported domestic leagues above, intersected with that response, and allow every authenticated, current-season cup. Do not assume the advertised 12 is an exact API count or that every returned competition is active today. The API defines `currentSeason` as the season with the latest start date, which may already have ended. On the checked date, `EC` and `WC` were returned but their latest seasons ended in 2024 and July 2026, respectively. For the MVP, omit a competition from the current-season UI when `currentSeason` is absent or its `endDate` is before the current UTC date. Preserve the API-provided type rather than inferring it from the name. Show an accessible cup's fixtures even when its standings endpoint has no table.

## Endpoint matrix

Base URL: `https://api.football-data.org/v4`. Send `X-Auth-Token` on every request. `{competition}` is an authenticated competition ID or code; `{matchId}` and `{teamId}` must come from accessible current-season responses. Omit `season` to use the API's current season; do not request earlier seasons. The paths below were smoke-tested with one free account; recheck access when the account, plan, or season changes.

| Purpose | GET path and MVP filters | Read from successful response | Empty/unsupported handling |
| --- | --- | --- | --- |
| Available competitions | `/competitions` | `competitions[]`: `id`, `code`, `name`, `type`, `emblem`, `currentSeason` | Empty list means no verified UI competitions. |
| Competition detail | `/competitions/{competition}` | `id`, `code`, `name`, `type`, `emblem`, `area`, `currentSeason` | 403 removes the candidate from the usable set; 404 means unavailable ID/code. Do not use `seasons[]` for archives. |
| Competition fixtures/results | `/competitions/{competition}/matches?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD` (or `matchday` for a league) | `matches[]`, `resultSet`; each match uses the compact match model below | Empty `matches` is valid. Do not assume a cup has `matchday`. |
| Competition standings | `/competitions/{competition}/standings` | `standings[]`, including `type`, `stage`, `group`, `table[]` | Probe each competition. `CL` (`CUP`) returned a `TOTAL` league-phase table, while `CLI` (`CUP`) returned 404. On 404 render fixtures without a table. An empty table is also valid. For a domestic LEAGUE prefer `TOTAL`; group tables can be separate. |
| Daily matches | `/matches?date=YYYY-MM-DD` | `matches[]`, then keep only IDs/codes from the authenticated current-season set | Empty day is valid. Never show an inaccessible competition based on this aggregate alone. |
| Match detail | `/matches/{matchId}` | Compact match fields; ignore deeper paid nodes | 403/404 means unavailable detail; keep the list item if already available. |
| Team detail | `/teams/{teamId}` | `id`, `name`, `shortName`, `tla`, `crest`, `area`, `venue` | 403/404 means no team detail page. Do not depend on `squad`, coach, market value, or `runningCompetitions`. |
| Team matches | `/teams/{teamId}/matches?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&limit=100` | `matches[]`, `resultSet`; keep only authenticated current-season competition IDs | Empty list is valid. The endpoint documents a default 100-item limit; use explicit bounded dates and `limit`. Do not promise all fixtures from a truncated response. |

The v4 range uses inclusive `dateFrom` and **exclusive `dateTo`**. For one UTC day, `dateFrom=2026-09-30&dateTo=2026-10-01`; the daily endpoint's `date=2026-09-30` is simpler. Use UTC for API date selection and `utcDate` parsing. Convert to a user's local timezone only at display time; a match can appear under a different local calendar day. Do not use local midnight to form API ranges. `utcDate` can be a rough scheduling date for `SCHEDULED`, so do not imply a confirmed kickoff until status is `TIMED` or later.

## Minimal DTO and view-model fields

These are the fields the MVP may consume, not a claim that every response includes all of them. Parse external JSON defensively. Missing or `null` optional values map to `null`; an absent or empty list maps to `[]`. Do not coerce a missing score to zero.

| Model | Required identity | Nullable/optional data to preserve | View rule |
| --- | --- | --- | --- |
| Competition | `id: number`, `code: string`, `name: string` | `type`, `emblem`, `area.name`, `currentSeason.id`, `currentSeason.startDate`, `currentSeason.endDate`, `currentSeason.currentMatchday` | Use name with an emblem fallback; only authenticated current-season entries appear. |
| Season | `id: number` when present | `startDate`, `endDate`: `YYYY-MM-DD` or null; `currentMatchday`: number or null | Season's start year is the API's `season` filter value if ever needed; no historical selector in MVP. |
| Team | `id: number`, `name: string` when a complete team object is available | `shortName`, `tla`, `crest`, `area.name`, `venue` | Fall back to `name` and a neutral crest; a placeholder team in a future fixture may have no usable ID. |
| Match | `id: number` | `competition.id/code/name`, `utcDate`, `status`, `matchday`, `stage`, `group`, `homeTeam`, `awayTeam`, `score`, `venue`, `lastUpdated` | Show a date only when present; group/stage can replace matchday for cups. Never label delayed data as live. |
| Score | none | `winner`, `duration`, `fullTime.home/away`, `halfTime.home/away`, optionally `regularTime`, `extraTime`, `penalties`, with nullable numeric sides | Display `fullTime` only when both sides are numbers; otherwise show a dash. No guessed score. |
| Standing | `type`, `table[]` when returned | `stage`, `group`; row `position`, `team`, `playedGames`, `won`, `draw`, `lost`, `points`, `goalsFor`, `goalsAgainst`, `goalDifference`, `form` | Default to `TOTAL` for a league; an absent table means no standings. Treat `form` as optional. |

The API's match status values documented across its match page and lookup table are `SCHEDULED`, `TIMED`, `IN_PLAY`, `PAUSED`, `EXTRA_TIME`, `PENALTY_SHOOTOUT`, `FINISHED`, `SUSPENDED`, `POSTPONED`, `CANCELLED`, and `AWARDED`. The match page omits `EXTRA_TIME` and `PENALTY_SHOOTOUT` from its enum while the lookup table includes them; accept both and preserve unknown future strings as an unknown state. `LIVE` is a **filter alias** for `IN_PLAY` and `PAUSED`, not a stored match status and not a free-plan freshness guarantee. `SCHEDULED` means rough date; `TIMED` means confirmed kickoff. Treat all score fields as nullable even for finished matches because the free plan is delayed and data may be incomplete.

## Errors and request budget

The documented error response is a small JSON object such as `{ "error": "..." }`; the tested `CLI` standings 404 contained both `error` and `message` keys. Treat either key as optional and also handle missing, malformed, or non-JSON error bodies. Preserve HTTP status separately from a safe display message; never render the raw upstream body or token. Expected outcomes:

| Status | Meaning for this contract |
| --- | --- |
| 400 | Invalid ID or filter; correct the request, do not retry unchanged. |
| 403 | Authenticated account cannot access this resource, or the token is missing/invalid; remove access assumptions and investigate the token/entitlement. |
| 404 | Missing resource, or standings intentionally unavailable for CUP/PLAYOFFS; distinguish by endpoint. |
| 429 | Rate budget exhausted; stop requests until the counter resets. |
| 5xx / network failure | Upstream unavailable; show a retryable unavailable state, without inventing data. |

Use the account-wide **10 requests/minute** budget across all endpoints and users. At implementation time, centralize pacing and caching; no automatic polling for live scores. The documented response headers `X-RequestsAvailable` and `X-RequestCounter-Reset` can guide pacing, but do not assume they are always present. A manual check should send no more than one request every 7 seconds and stop on 429. Empty arrays and null values are normal responses, not errors.

## Required authenticated smoke check

**Status on 2026-09-30:** completed for the supplied free account. All eight required endpoint kinds returned HTTP 200 for the sampled current-season Premier League data. `CL` fixtures and standings, and `CLI` details and fixtures, returned 200; `CLI` standings returned the documented 404 fallback. The authenticated `/competitions` response contained 13 entries. This does not establish access to untested competitions, match IDs, future seasons, or historical archives. Re-run this gate if entitlement or API behavior changes.

1. Set a developer free key as a local environment variable, `FOOTBALL_DATA_API_KEY`, outside tracked files. Do not paste it into this document, a fixture, a URL, logs, or a commit.
2. Request authenticated `/competitions` first. Record HTTP status, response timestamp, count, and the returned `id`/`code`/`type`/current-season dates for the candidate competitions. Select one active domestic league and, if present, one active cup. Do not infer coverage for absent codes.
3. Pace requests at least 7 seconds apart, observe `X-RequestsAvailable` and `X-RequestCounter-Reset` when present, and stop if the account responds with 429. Probe each of the eight matrix rows with IDs and dates obtained from the authenticated responses. For standings, probe a league and an accessible CUP/PLAYOFFS if available; a cup 404 is the documented fallback, not a failed entitlement. For the match and team rows, use IDs from a returned current-season fixture.
4. Record each request's sanitized path (no token), timestamp, HTTP status, response content type, result count when applicable, and presence/nullability of each MVP field. Record 400/403/404/429 bodies only as sanitized shape and category. Do not publish the authenticated client name or complete response headers.
5. Save only minimal sanitized JSON fixtures needed by the future adapter: one competition list entry, league fixtures with a scheduled and a finished match if available, a standings slice, a daily match, one match detail, one team detail and team matches, plus a cup standings 404 shape if observed. Keep IDs/names only where needed to preserve joins; remove unrelated personal data and paid-only nodes. If an endpoint or optional field is unavailable, remove that assumption from this contract before API implementation is accepted.

Recorded HTTP outcomes (UTC timestamps, sanitized paths, counts and small payload slices are in the linked fixture file):

| Endpoint | UTC checked at | HTTP | Result/shape | Verified fields and exceptions |
| --- | --- | --- | --- | --- |
| `/competitions` | 17:39:20 | 200 | 13 entries | Includes `CLI`; `EC` and `WC` latest seasons already ended. |
| `/competitions/PL` | 17:39:27 | 200 | Competition object | `currentSeason` and `seasons` present; MVP uses only `currentSeason`. |
| `/competitions/PL/matches` | 17:39:34; 17:42:53 | 200; 200 | 20; 10 matches | Saved one `FINISHED` with numeric score and one `TIMED` with null score. |
| `/competitions/PL/standings` | 17:39:41 | 200 | 1 table | `TOTAL` with rows. |
| `/matches?date=2026-09-18` | 17:39:48 | 200 | 8 matches | Cross-competition list; filter by authenticated competition IDs. |
| `/matches/560591` | 17:39:55 | 200 | Match object | Basic score and participants present; paid/deep nodes ignored. |
| `/teams/402` | 17:40:02 | 200 | Team object | Basic identity present; squad and staff ignored. |
| `/teams/402/matches` | 17:40:09 | 200 | 6 matches | Bounded date range and limit. |
| `/competitions/CL/standings` | 17:40:16 | 200 | 1 `TOTAL` table | `CUP` type can have standings; group label `League phase`. |
| `/competitions/CL/matches` | 17:40:23 | 200 | 36 matches | Accessible cup fixtures. |
| `/competitions/CLI` | 17:40:30 | 200 | Competition object | Additional authenticated cup. |
| `/competitions/CLI/matches` | 17:40:37 | 200 | 9 matches | Additional authenticated cup fixtures. |
| `/competitions/CLI/standings` | 17:43:00 | 404 | JSON `error`, `message` | Render fixtures without standings. |

## Official sources

- [Free-plan pricing and rate limit](https://www.football-data.org/pricing)
- [Free-tier coverage](https://www.football-data.org/coverage)
- [v4 policies: authentication limits, nulls, UTC defaults, current season](https://docs.football-data.org/general/v4/policies.html)
- [Competition list, standings and competition matches](https://docs.football-data.org/general/v4/competition.html)
- [Match resource, daily filters and statuses](https://docs.football-data.org/general/v4/match.html)
- [Team resource and team matches](https://docs.football-data.org/general/v4/team.html)
- [v4 date-range behavior](https://docs.football-data.org/general/v4/index.html)
- [Score nullability](https://docs.football-data.org/general/v4/overtime.html)
- [Error responses and HTTP statuses](https://docs.football-data.org/general/v4/errors.html)
- [Codes, enums and response headers](https://docs.football-data.org/general/v4/lookup_tables.html)
