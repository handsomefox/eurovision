import { contests as rawContests } from "../data/contestRegistry";
import type { Contest, Entry } from "../types";

function assertString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} must be a non-empty string`);
  }
}

function normalizeContest(contest: Contest): Contest {
  assertString(contest.id, "contest.id");
  assertString(contest.label, `${contest.id}.label`);
  assertString(contest.title, `${contest.id}.title`);

  if (!Array.isArray(contest.entries)) {
    throw new Error(`${contest.id}.entries must be an array`);
  }

  const entryIds = new Set<string>();
  const entries = [...contest.entries]
    .map((entry) => {
      for (const field of ["id", "country", "flag", "code", "artist", "song"]) {
        assertString(entry[field as keyof Entry], `${contest.id}.${field}`);
      }

      if (!Number.isFinite(entry.order)) {
        throw new Error(`${contest.id}.${entry.id}.order must be a number`);
      }

      if (entryIds.has(entry.id)) {
        throw new Error(`${contest.id} has duplicate entry id: ${entry.id}`);
      }
      entryIds.add(entry.id);

      return entry;
    })
    .sort((first, second) => first.order - second.order);

  return { ...contest, entries };
}

function normalizeContests(contests: Contest[]): Contest[] {
  const contestIds = new Set<string>();

  return contests.map((contest) => {
    const normalized = normalizeContest(contest);
    if (contestIds.has(normalized.id)) {
      throw new Error(`Duplicate contest id: ${normalized.id}`);
    }
    contestIds.add(normalized.id);
    return normalized;
  });
}

export const contests = normalizeContests(rawContests);

export function getContestById(id: string): Contest | null {
  return contests.find((contest) => contest.id === id) || null;
}

export function getDefaultContestId(): string {
  return contests[0]?.id || "";
}
