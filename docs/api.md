# API and storage reference

The server exposes three endpoints under `/api` and, in production, serves the client bundle. Source: `server/app.ts` and `server/rankings.ts`.

Every response is JSON. Every failure has the shape `{ "error": "<message>" }` with the exact messages listed below. `express.json` rejects a request body over 64 kb with status 413.

## GET /api/health

No parameters.

```json
{ "ok": true }
```

## GET /api/ranking

Loads one saved ranking. Both query parameters are trimmed before use.

| Parameter   | Required | Description                               |
| ----------- | -------- | ----------------------------------------- |
| `key`       | yes      | The raw personal key the user typed.      |
| `contestId` | yes      | A contest id known to the server catalog. |

Status 200:

```json
{
  "rankingIds": ["denmark", "germany"],
  "updatedAt": "2026-09-05T11:02:51.819Z"
}
```

When the key and contest have no saved row, the response is `{ "rankingIds": [], "updatedAt": null }`. The server drops ids that no longer belong to the contest and drops duplicates before it answers, so a response can be shorter than what was saved.

Status 400 with `key is required`, `contestId is required`, or `contestId is unknown`.

Status 500 with `stored ranking is invalid` when the stored JSON does not parse.

## PUT /api/ranking

Saves one ranking. An existing row for the same key and contest is overwritten.

```http
PUT /api/ranking
Content-Type: application/json

{
  "key": "vienna-night",
  "contestId": "esc-2026-eu",
  "rankingIds": ["denmark", "germany"]
}
```

Status 200:

```json
{
  "ok": true,
  "updatedAt": "2026-09-05T11:02:51.819Z"
}
```

`updatedAt` is the server clock in ISO 8601, written to both `created_at` and `updated_at` on insert.

Status 400 for every validation failure, with one of these messages:

| Message                                         | Cause                                           |
| ----------------------------------------------- | ----------------------------------------------- |
| `key is required`                               | `key` is missing or empty after trimming.       |
| `contestId is required`                         | `contestId` is missing or empty after trimming. |
| `contestId is unknown`                          | No contest file declares that id.               |
| `rankingIds must be an array`                   | `rankingIds` is another type.                   |
| `rankingIds cannot contain more than 100 items` | The array is longer than `MAX_RANKING_LENGTH`.  |
| `rankingIds must contain non-empty strings`     | An item is not a string, or is blank.           |
| `rankingIds cannot contain duplicates`          | The same id appears twice.                      |
| `rankingIds must belong to contestId`           | An id is not an entry of that contest.          |

A partial ranking is valid. The client sends a save 450 ms after the last edit.

## Static files in production

With `NODE_ENV=production`, the server serves `dist/` and answers any remaining GET request with `dist/index.html`, which is what makes `/?contest=esc-2025-eu` survive a refresh. Requests under `/api` and requests with another method skip that fallback and get 404.

Without `NODE_ENV=production`, the server answers API requests only. The Vite dev server serves the client.

## SQLite storage

`server/db.ts` opens the file at `DATABASE_PATH`, or `./data/eurovision-ranker.sqlite` when that variable is unset. It creates the parent directory, sets `journal_mode = WAL` and `busy_timeout = 5000`, then creates the table:

```sql
CREATE TABLE IF NOT EXISTS rankings (
  user_key_hash TEXT NOT NULL,
  contest_id TEXT NOT NULL,
  ranking_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_key_hash, contest_id)
);
```

`user_key_hash` is the hex SHA-256 of the raw key. The raw key never reaches the database. `ranking_json` is the id array as JSON text.

There is no migration system. A schema change means editing `initializeDatabase` and handling the existing file yourself.

## Contest catalog on the server

`loadContestCatalog` reads every `.json` file in `src/data/contests/` at startup and builds a map from contest id to the set of entry ids. That map backs the `contestId is unknown` and `rankingIds must belong to contestId` checks. The loader throws on a malformed file, so the server refuses to start rather than accept rankings it cannot validate.

The loader scans the directory. The browser instead reads the explicit list in `src/data/contestRegistry.ts`. A file that exists but is not registered is therefore writable through the API and invisible in the UI.

## Browser storage

The client keeps everything else in `localStorage`.

| Key                                            | Written by             | Contents                                                    |
| ---------------------------------------------- | ---------------------- | ----------------------------------------------------------- |
| `eurovision-ranker-user-key`                   | `src/App.tsx`          | The raw personal key, so the key gate is skipped next time. |
| `eurovision-ranker-contest-id`                 | `src/App.tsx`          | The last selected contest id.                               |
| `eurovision-ranker-locale`                     | `src/App.tsx`          | `en` or `ru`.                                               |
| `eurovision-ranker-image-v1:<entry-id>:<hash>` | `src/lib/wikiCache.ts` | One resolved Wikipedia thumbnail, with the timestamp.       |

The image cache holds a found image for 30 days and a missing one for 3 days. The hash covers the fields that decide the image, so editing `wikiTitles` or `fallbackPhotoUrl` in a contest file produces a new key and the old value is ignored. Every cache read and write sits in a `try` block. In private mode, or over quota, the app keeps working and fetches the images again.

The ranking itself is not cached in the browser. It is loaded from the API on every key change and contest change.
