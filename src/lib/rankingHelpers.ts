import type { Entry } from "../types";
import type { Locale } from "../types";
import { normalize } from "./wiki";

export function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  const copy = [...items];
  const [item] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, item);
  return copy;
}

export function uniqueKnownIds(ids: string[], byId: Map<string, Entry>): string[] {
  const seen = new Set<string>();
  return ids.filter((id) => {
    if (!byId.has(id) || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function filterAvailableEntries(entries: Entry[], rankedIds: Set<string>, query: string): Entry[] {
  const normalizedQuery = normalize(query.trim());
  return entries
    .filter((item) => !rankedIds.has(item.id))
    .filter((item) => !normalizedQuery || normalize(`${item.country} ${item.artist} ${item.song}`).includes(normalizedQuery));
}

export function sortByOfficialResult(entries: Entry[]): Entry[] {
  return [...entries].sort(
    (first, second) => (first.resultRank ?? Number.MAX_SAFE_INTEGER) - (second.resultRank ?? Number.MAX_SAFE_INTEGER)
  );
}

export type RankComparison =
  | { status: "missing-official"; personalRank: number | null; officialRank: null; delta: null }
  | { status: "unranked"; personalRank: null; officialRank: number; delta: null }
  | { status: "same"; personalRank: number; officialRank: number; delta: 0 }
  | { status: "better"; personalRank: number; officialRank: number; delta: number }
  | { status: "worse"; personalRank: number; officialRank: number; delta: number };

export function getRankComparison(entry: Entry, personalIndex: number | null | undefined): RankComparison {
  const personalRank = typeof personalIndex === "number" && personalIndex >= 0 ? personalIndex + 1 : null;
  if (entry.resultRank === undefined) {
    return { status: "missing-official", personalRank, officialRank: null, delta: null };
  }
  if (personalRank === null) {
    return { status: "unranked", personalRank: null, officialRank: entry.resultRank, delta: null };
  }

  const delta = entry.resultRank - personalRank;
  if (delta === 0) return { status: "same", personalRank, officialRank: entry.resultRank, delta };
  return delta > 0
    ? { status: "better", personalRank, officialRank: entry.resultRank, delta }
    : { status: "worse", personalRank, officialRank: entry.resultRank, delta };
}

export function formatRankingForClipboard(items: Entry[], locale: Locale): string {
  if (!items.length) return locale === "ru" ? "Пока никого нет в рейтинге." : "Nobody is in the ranking yet.";

  return items.map((item, index) => `${index + 1}. ${item.country} (${item.code.toUpperCase()}): ${item.artist} - ${item.song}`).join("\n");
}
