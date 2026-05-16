# Eurovision Ranker

A Vite React ranker with a small Express API and SQLite persistence.

## Local Development

Install dependencies:

```sh
npm install
```

Run the API server:

```sh
npm start
```

In another shell, run Vite:

```sh
npm run dev
```

Vite proxies `/api` to `http://localhost:3000`.

## Production

Build and start the single service:

```sh
npm run build
NODE_ENV=production npm start
```

The server listens on `process.env.PORT || 3000` and serves `dist` in production.

## Environment

`DATABASE_PATH` controls where SQLite is stored. If unset, the app uses:

```txt
./data/eurovision-ranker.sqlite
```

For Railway, mount one volume at `/data` and set:

```sh
DATABASE_PATH=/data/eurovision-ranker.sqlite
NODE_ENV=production
```

Keep Railway replicas at `1` while using SQLite on a mounted volume.

## Contest Data

Contests live in `src/data/contests/` and are registered explicitly in `src/data/contestRegistry.js`.

Each entry needs:

```txt
id, order, country, flag, code, artist, song
```

Optional entry fields include:

```txt
wikiTitles, songWikiTitle, officialPhotoUrl, fallbackPhotoUrl, forceFlag, exactImageOnly
```

The browser validates contest IDs and entry IDs at startup.

## API

Health:

```txt
GET /api/health
```

Load a ranking:

```txt
GET /api/ranking?key=<raw-user-key>&contestId=<contest-id>
```

Save a ranking:

```txt
PUT /api/ranking
Content-Type: application/json

{
  "key": "raw-user-key",
  "contestId": "esc-2026-eu",
  "rankingIds": ["denmark", "germany"]
}
```

The server stores only a SHA-256 hash of the key.
