import type { Entry } from "../types";
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
