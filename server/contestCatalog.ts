import fs from "node:fs";
import path from "node:path";

type Contest = {
  id: string;
  entries: Array<{
    id: string;
    order: number;
    country: string;
    flag: string;
    code: string;
    artist: string;
    song: string;
    resultRank?: number;
    resultPoints?: number;
  }>;
};

export type ContestCatalog = Map<string, Set<string>>;

function assertString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} must be a non-empty string`);
}

function assertNumber(value: unknown, label: string): asserts value is number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be a number`);
}

function readContestFile(filePath: string): Contest {
  const rawContest = JSON.parse(fs.readFileSync(filePath, "utf8")) as Partial<Contest>;
  assertString(rawContest.id, `${filePath}.id`);
  if (!Array.isArray(rawContest.entries)) throw new Error(`${rawContest.id}.entries must be an array`);

  const entryIds = new Set<string>();
  const orders = new Set<number>();
  const resultRanks = new Set<number>();
  let resultCount = 0;

  for (const rawEntry of rawContest.entries) {
    const entry = rawEntry as Partial<Contest["entries"][number]>;
    for (const field of ["id", "country", "flag", "code", "artist", "song"] as const) {
      assertString(entry[field], `${rawContest.id}.${field}`);
    }
    assertString(entry.id, `${rawContest.id}.id`);
    const entryId = entry.id;
    assertNumber(entry.order, `${rawContest.id}.${entryId}.order`);
    if (entryIds.has(entryId)) throw new Error(`${rawContest.id} has duplicate entry id: ${entryId}`);
    if (orders.has(entry.order)) throw new Error(`${rawContest.id} has duplicate running order: ${entry.order}`);
    if ((entry.resultRank === undefined) !== (entry.resultPoints === undefined)) {
      throw new Error(`${rawContest.id}.${entryId} must include both resultRank and resultPoints`);
    }
    if (entry.resultRank !== undefined) {
      assertNumber(entry.resultRank, `${rawContest.id}.${entryId}.resultRank`);
      assertNumber(entry.resultPoints, `${rawContest.id}.${entryId}.resultPoints`);
      if (resultRanks.has(entry.resultRank)) throw new Error(`${rawContest.id} has duplicate result rank: ${entry.resultRank}`);
      resultRanks.add(entry.resultRank);
      resultCount += 1;
    }
    entryIds.add(entryId);
    orders.add(entry.order);
  }

  if (resultCount > 0 && resultCount !== rawContest.entries.length) {
    throw new Error(`${rawContest.id} must include result fields for every entry or none`);
  }

  return rawContest as Contest;
}

export function loadContestCatalog(contestsDir = path.join(process.cwd(), "src", "data", "contests")): ContestCatalog {
  const catalog: ContestCatalog = new Map();

  for (const fileName of fs.readdirSync(contestsDir)) {
    if (!fileName.endsWith(".json")) continue;

    const contest = readContestFile(path.join(contestsDir, fileName));

    const entryIds = new Set<string>();
    for (const entry of contest.entries) {
      entryIds.add(entry.id);
    }

    if (catalog.has(contest.id)) throw new Error(`Duplicate contest id: ${contest.id}`);
    catalog.set(contest.id, entryIds);
  }

  return catalog;
}
