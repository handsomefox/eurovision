# Architecture decisions

The job is narrow. A handful of people rank one Grand Final on their phones while it airs, and each of them wants their own list back on the next device they pick up. That is the whole product, and it explains most of what follows. The app started as one React component with the 2026 lineup hardcoded inside it.

## One process serves both the API and the build

`server/index.ts` opens the database, builds the Express app, and listens. With `NODE_ENV=production` the same app serves `dist/` and falls back to `index.html` for GET requests outside `/api`. One process, one port, one deploy.

The alternative was a static host for the frontend and a separate API service. That means two deploys, a CORS setup, and a second thing to keep awake, all for a client bundle that `npm run build` reports at about 280 kB. Not worth it at this size.

Next.js was considered early and dropped. The routing, server components, and build model solve problems this app does not have. It is one page with a query parameter.

## Contest data is code, not rows

Each contest is a JSON file in `src/data/contests/`, imported explicitly by `src/data/contestRegistry.ts` and bundled by Vite. Nothing about a contest is loaded at runtime.

This is the decision that keeps the app small. Contest data changes when a lineup is announced, which is a few times a year, and it is exactly the kind of change that wants a diff and a review rather than an admin form. The database then holds one thing: user rankings. No joins, no seed scripts, no drift between what a deployed machine believes and what the repo says.

The registry is an explicit list instead of a directory glob, which costs one line per contest and buys a deterministic build.

The server does not read the registry. `server/contestCatalog.ts` scans the contests directory at startup and validates every file it finds. So the two sides of the app learn about contests in two different ways, and a file that is present but unregistered exists for the API and not for the UI. That is a wart, not a design. If it ever bites, the fix is to generate the catalog from the registry at build time.

## SQLite on a mounted volume, and the price of it

`better-sqlite3` writes to a file at `DATABASE_PATH`, with WAL and a 5 second busy timeout. Writes are synchronous. For a table whose rows are a JSON array of at most 100 short strings, synchronous is not a problem.

The price is real, though. One file on one volume means one machine, and nothing in `fly.toml` enforces that. Scale the app to two machines and each one gets its own volume, so the two databases diverge with no error to tell you about it. If this ever needs more than one machine, the answer is Postgres, not clever SQLite. Nothing else in the design would have to change, because the ranking service is the only code that touches the database.

## The personal key is a namespace, not a login

Users type any string they like. The server hashes it with SHA-256 and uses the hash as half of the primary key. There are no accounts, no passwords, no sessions.

Be clear about what that does and does not give you. Hashing means a stolen database file does not hand out the keys people typed, and it means keys of any length store the same way. It does not authenticate anybody. Anyone who guesses your key can read and overwrite your ranking, and the key travels in the query string of a GET request, so it lands in any proxy log along the way. For deciding who ranked Finland first among friends, that is the right amount of security. For anything with a stake in it, this is not the model to copy.

The raw key does sit in `localStorage` on the device, which is what lets the app skip the key gate on a return visit.

## The frontend holds one ranking at a time

`useSavedRanking` loads the ranking whenever the key or the contest changes, then saves 450 ms after the last edit. It compares against the last saved JSON before sending, so moving a card and moving it back sends nothing.

The loaded ranking is filtered against the entries of the current contest, on both sides. The server drops unknown ids before it answers, and the client drops them again through `uniqueKnownIds`. Doubling up looks redundant until an entry id changes in the repo while a saved ranking still names the old one. Then the stale id disappears quietly instead of rendering an empty card.

## Photos come from Wikipedia at view time

Contest files carry Wikipedia titles rather than image URLs, and `src/lib/wikiFetch.ts` resolves a thumbnail through the Wikipedia API, four requests at a time. Found images are cached in `localStorage` for 30 days, misses for 3 days.

Storing image URLs in the repo instead would be faster and would rot. Wikipedia moves files. The escape hatches are per entry: `officialPhotoUrl` when a broadcaster photo exists, `exactImageOnly` when the search finds the wrong person, `forceFlag` when there is no artist yet.

This is also the part most likely to annoy someone. Wikipedia is a third-party dependency in the render path, and if it is slow, cards show flags until it answers.

## What is missing on purpose, and what is not

On purpose: no router, no accounts, no admin UI, no migration table. Each of them would earn its place only if the app grew a second kind of user.

Not on purpose:

- `flag` is required by the server loader but never read by the UI, which draws flags from `code` through flagcdn.com. Every contest file carries emoji nobody sees.
- There is no CI workflow, so `npm test`, `npm run lint`, `npm run typecheck`, and `npm run fmt:check` only run when somebody remembers.
- There is no watch script for the server. Backend edits need `npx tsc -p tsconfig.server.json` and a restart.
- A schema change would have to be applied by hand, because `initializeDatabase` only ever runs `CREATE TABLE IF NOT EXISTS`.

Ideas worth doing before any of the above: a read-only share link for a finished ranking, and one page that shows every ranking saved under a key instead of one contest at a time.
