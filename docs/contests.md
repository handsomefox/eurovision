# How to add a contest

A contest is one JSON file under `src/data/contests/` plus one line in the registry. Vite bundles the file at build time, so adding a contest is a code change and a deploy, not a database write.

## Add the file and register it

1. Create `src/data/contests/<contest-id>.json`. Existing files are named after the id they declare, for example `esc-2025-eu.json` for `esc-2025-eu`.
2. Fill in the contest fields and the entries, both described below.
3. Import the file in `src/data/contestRegistry.ts` and add it to the exported array:

   ```ts
   import esc2027Eu from "./contests/esc-2027-eu.json";

   export const contests = [esc2027Eu, esc2026Eu /* ... */] as Contest[];
   ```

   Array order is the order of the contest picker, and the first contest is the default for a visitor with no saved choice.

4. Run `npm test`. Then restart `npm start`, because the server builds its contest catalog once at startup and rejects saves for a contest it has not seen.
5. Run `npm run dev` and open the contest.

If you skip step 3, the API still accepts rankings for the contest, because the server reads the whole directory, but nobody can select it in the UI.

## Contest fields

Every field is required except `i18n`.

| Field         | Type                            | Notes                                                                           |
| ------------- | ------------------------------- | ------------------------------------------------------------------------------- |
| `id`          | string                          | Unique across all contests. Appears in the `?contest=` URL and in the database. |
| `year`        | number                          |                                                                                 |
| `family`      | string                          | `eurovision` in every current file.                                             |
| `region`      | string                          | `eu` or `asia` in every current file.                                           |
| `label`       | string                          | The name in the contest picker.                                                 |
| `title`       | string                          | The heading above the ranking.                                                  |
| `badge`       | string                          | The small line under the heading, such as `Vienna 2026`.                        |
| `status`      | `"complete"` or `"placeholder"` | `placeholder` shows a notice that the lineup is not final.                      |
| `description` | string                          | The paragraph under the heading.                                                |
| `sourceUrl`   | string                          | Where the data came from.                                                       |
| `i18n`        | object                          | Russian overrides. See below.                                                   |
| `entries`     | array                           | At least one entry.                                                             |

Only `ru` is a supported translation locale, and it may override `label`, `title`, `badge`, and `description`. Any other locale key throws when the browser loads the contest list.

```json
"i18n": {
	"ru": {
		"label": "Евровидение 2026 · Европа",
		"description": "Изначально рейтинг пустой."
	}
}
```

English text stays in the top-level fields. A missing Russian field falls back to the English one.

## Entry fields

```json
{
  "id": "denmark",
  "order": 1,
  "country": "Denmark",
  "flag": "🇩🇰",
  "code": "dk",
  "artist": "Søren Torpegaard Lund",
  "song": "Før Vi Går Hjem"
}
```

Required:

- `id`, unique inside the contest. It is what the API stores, so renaming an id drops that entry from every saved ranking.
- `order`, the running order number, unique inside the contest. `tests/contestData.test.ts` also requires the lowest number to be 1. The app sorts entries by `order` when it loads them, so the file does not have to be in order.
- `country`, shown in the card and matched during ranking import.
- `flag`, the emoji flag. The server rejects a file that omits it, although the UI now draws flags from `code` through flagcdn.com and never reads this field.
- `code`, a lowercase two-letter country code matching `/^[a-z]{2}$/`. It builds the flag image URL.
- `artist` and `song`.

Optional:

- `wikiTitles`, an array of English Wikipedia page titles. The first one is the artist link, and the first title containing the song name is the song link.
- `songWikiTitle`, an explicit song page title that overrides that guess.
- `officialPhotoUrl`, used as the photo with no lookup at all.
- `fallbackPhotoUrl`, used when every lookup fails.
- `forceFlag`, `true` to show the flag placeholder and skip photo lookup entirely.
- `exactImageOnly`, `true` to stop after `wikiTitles` instead of falling back to a Wikipedia search. Use it when the search returns the wrong person.
- `resultRank` and `resultPoints`, the official placement and points.

## Add official results

Results power the results view and the comparison view. Add `resultRank` and `resultPoints` to every entry or to none of them. Within one contest, both fields must appear together on an entry, and `resultRank` must be unique. `tests/contestData.test.ts` also requires the ranks to run from 1 to the number of entries with no gaps.

A contest with no results renders the ranking view only.

## Get the photo right

`fetchWikiImage` in `src/lib/wikiFetch.ts` resolves the photo in this order:

1. `officialPhotoUrl`, if set.
2. Nothing, if `forceFlag` is set. The card shows the flag.
3. The page image of each title in `wikiTitles`, in order.
4. `fallbackPhotoUrl`, if `exactImageOnly` is set and no title matched.
5. Wikipedia searches for `<artist> singer`, `<artist> Eurovision`, and `<country> Eurovision <artist>`.
6. `fallbackPhotoUrl`.

Results are cached in `localStorage` per entry. A found image is kept 30 days, a missing one 3 days, and the cache key covers `wikiTitles`, `songWikiTitle`, `fallbackPhotoUrl`, and `exactImageOnly`, so editing any of those invalidates the old entry.

## What rejects your file

Validation runs twice, and neither pass is a lint step you can skip.

`validateContests` in `src/lib/contestValidation.ts` runs in the browser when `src/lib/contestModel.ts` is first imported. A bad file throws before the app renders, and the message names the contest, the entry, and the field.

`loadContestCatalog` in `server/contestCatalog.ts` runs at server startup over every `.json` file in the directory. A bad file stops `npm start`.

Both passes reject:

- a missing or empty `id`, `country`, `code`, `artist`, or `song`;
- an `order` that is not a number;
- a duplicate contest id, entry id, running order, or result rank;
- an entry with `resultRank` but no `resultPoints`, or the reverse;
- results on some entries but not all of them.

The two passes then differ, and the union of them is what your file has to satisfy. The browser pass alone checks the contest metadata (`year`, `family`, `region`, `label`, `title`, `badge`, `description`, `sourceUrl`), the `status` enum, the `i18n` locale keys, the two-lowercase-letter `code` pattern, the types of the optional entry fields, and that results are non-negative integers. The server pass alone requires `flag`.

`npm test` covers the browser pass over your real file, because `tests/contestData.test.ts` imports the registry through `src/lib/contestModel.ts`. It does not cover the server pass over real data, because `tests/contestCatalog.test.ts` builds temporary fixtures instead. A file that omits `flag` passes `npm test` and then stops `npm start`, so start the server once before you deploy.

`tests/contestData.test.ts` also pins the entry counts of the six contests listed in `expectedHistoricalCounts`. Changing the lineup of one of those years fails the test until you update the count there.
