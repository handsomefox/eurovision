# Repository guidelines

The [README](README.md) covers running the app and the checks. [Architecture decisions](docs/architecture.md) explains why the stack looks like this. This page covers the rules that break things quietly.

## Adding a contest takes two edits, not one

A contest is a JSON file in `src/data/contests/` and an explicit import in `src/data/contestRegistry.ts`. Do both. The server scans the directory and the browser reads the registry, so a file that exists but is unregistered is writable through the API and invisible in the UI. [How to add a contest](docs/contests.md) has the field list.

## Two validators, and `npm test` only covers one

`validateContests` in `src/lib/contestValidation.ts` runs in the browser. `loadContestCatalog` in `server/contestCatalog.ts` runs at server startup. Their rules overlap but are not identical, and only the server pass requires `flag`. `tests/contestData.test.ts` exercises the browser pass over the real files; `tests/contestCatalog.test.ts` uses fixtures. A file missing `flag` therefore passes `npm test` and then stops `npm start`, so start the server once before you deploy.

`tests/contestData.test.ts` also pins entry counts in `expectedHistoricalCounts`. Changing a past lineup fails that test until you update the number there.

## Entry ids are stored data

The API stores `rankingIds` as an array of entry ids. Renaming an entry id drops that entry from every saved ranking, with no error anywhere, because both the server and `uniqueKnownIds` filter unknown ids out on purpose. Treat an id in a shipped contest as permanent.

## The personal key is a namespace, not a login

The server hashes the key with SHA-256 and uses it as half of the primary key. There are no accounts and no sessions. Anyone who guesses a key can read and overwrite that ranking, and the key travels in the query string of a GET. Do not build anything on it that needs real authentication.

## One machine, and nothing enforces it

`better-sqlite3` writes to one file on one volume. A second Fly machine gets its own volume and its own database, and the two diverge with no error. If the app ever needs more than one machine, move to Postgres rather than working around SQLite. `server/rankings.ts` is the only code that touches the database, so that swap stays contained.

There is no migration system. A schema change means editing `initializeDatabase` in `server/db.ts` and handling the existing file by hand.

## Before you commit

There is no CI workflow, so nothing runs these but you:

```sh
npm test
npm run typecheck
npm run lint
npm run fmt:check
```

Frontend edits hot-reload. Backend edits do not: recompile with `npx tsc -p tsconfig.server.json` and restart `npm start`.
