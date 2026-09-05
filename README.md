# Eurovision ranker

Rank the entries of a Eurovision Grand Final while the show is running. You type a personal key, pick a contest, then add entries and move them into your order. The server saves one ranking per key and per contest, so the same key gives you the same ranking on a phone and on a laptop. For contests that already have official results, the app also shows the official top and the gap between your placement and the real one.

The frontend is React on Vite. The backend is a small Express API that stores rankings in SQLite. Contest data lives in the repo as JSON, so only the rankings need a server at runtime.

What you get beyond the ranking list:

- A results view and a comparison view for contests that have official results.
- Copy to the clipboard as a numbered list, and an import that reads the same format back.
- English and Russian, switchable in the header.
- Artist photos pulled from Wikipedia and cached in the browser.
- A service worker and a web app manifest, so the app installs to a home screen and opens with no network. Saving a ranking still needs the server.

Seven contest files ship today. List them with their entry counts:

```sh
jq -c '{id, entries: (.entries | length)}' src/data/contests/*.json
```

Further reading:

- [API and storage reference](docs/api.md) for endpoints, error strings, and every key the app writes.
- [How to add a contest](docs/contests.md) for the JSON shape and the rules that reject a bad file.
- [Architecture decisions](docs/architecture.md) for why the stack looks like this.
- [Repository guidelines](AGENTS.md) for the rules that break things quietly.

## What you need

A recent Node release. The Dockerfile pins 22.21.1, the checks below last ran on 24.20.0, and `better-sqlite3` declares support for 20, 22, 23, 24, and 25.

`better-sqlite3` compiles a native module during `npm ci`. If your npm config sets `ignore-scripts=true`, the install finishes but the module is missing, and every database call fails with "Could not locate the bindings file". Build it once:

```sh
npm rebuild better-sqlite3 --ignore-scripts=false
```

## Run the app locally

The API and the Vite dev server run as two processes. Start the API first:

```sh
npm ci
npm run build
npm start
```

`npm start` runs `node server-dist/index.js`, which needs the compiled output from `npm run build`. It listens on port 3000 and writes to `./data/eurovision-ranker.sqlite`.

In a second shell, start Vite:

```sh
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` to `http://localhost:3000`.

Vite reloads frontend edits on save. Nothing watches the backend. After you change a file under `server/`, recompile and restart the API:

```sh
npx tsc -p tsconfig.server.json
npm start
```

## Run the checks

Four scripts cover the repo, and all four pass at this commit:

- `npm test` runs 30 Vitest tests over the contest data, the ranking service, and the browser helpers.
- `npm run typecheck` type-checks the app, the server, and the tests as three projects.
- `npm run lint` runs ESLint.
- `npm run fmt:check` runs Prettier. Use `npm run fmt` to fix what it reports.

There is no CI workflow in this repo. Run the scripts yourself before you push.

## Serve the production build

```sh
npm run build
NODE_ENV=production npm start
```

With `NODE_ENV=production`, the same process serves `dist/` and answers any other GET request with `dist/index.html`, so client-side URLs such as `/?contest=esc-2025-eu` work on a refresh. Without that variable, the process serves the API only.

`npm run build` type-checks the frontend, compiles the server into `server-dist/`, then bundles the client and the service worker into `dist/`. Git ignores both output directories.

## Configure the environment

- `DATABASE_PATH` sets the SQLite file. If unset, the app uses `./data/eurovision-ranker.sqlite`. The server creates the parent directory at startup.
- `PORT` sets the listen port. Default 3000.
- `NODE_ENV=production` turns on static file serving.

## Deploy to Fly.io

`fly.toml` configures one app in `fra` with a volume mounted at `/data` and a health check on `/api/health`. It sets `DATABASE_PATH=/data/eurovision-ranker.sqlite` and `NODE_ENV=production`.

```sh
fly deploy
```

Keep the app at one machine. A second machine gets its own volume and its own database, and nothing reconciles the two. With `auto_stop_machines` and `min_machines_running = 0`, that single machine sleeps when nobody is ranking.
