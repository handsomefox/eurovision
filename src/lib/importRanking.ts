import type { Entry } from "../types";
import { normalize } from "./wiki";

export type RankingImportResult = {
  ids: string[];
  unmatchedLines: string[];
};

function compact(value: string): string {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseLine(line: string): { countryPart: string; detailPart: string } | null {
  const withoutRank = line.replace(/^\s*\d+[.)]\s*/, "").trim();
  if (!withoutRank) return null;

  const colonIndex = withoutRank.indexOf(":");
  if (colonIndex === -1) return { countryPart: withoutRank, detailPart: withoutRank };

  return {
    countryPart: withoutRank.slice(0, colonIndex).trim(),
    detailPart: withoutRank.slice(colonIndex + 1).trim()
  };
}

function findEntry(line: string, entries: Entry[], usedIds: Set<string>): Entry | null {
  const parsed = parseLine(line);
  if (!parsed) return null;

  const countryPart = compact(parsed.countryPart);
  const detailPart = compact(parsed.detailPart);

  return (
    entries.find((item) => !usedIds.has(item.id) && countryPart.includes(compact(item.country))) ||
    entries.find((item) => {
      if (usedIds.has(item.id)) return false;

      const artist = compact(item.artist);
      const song = compact(item.song);
      return detailPart.includes(artist) && detailPart.includes(song);
    }) ||
    null
  );
}

export function parseRankingImport(text: string, entries: Entry[]): RankingImportResult {
  const ids: string[] = [];
  const unmatchedLines: string[] = [];
  const usedIds = new Set<string>();

  for (const line of text.split(/\r?\n/)) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    const entry = findEntry(trimmedLine, entries, usedIds);
    if (!entry) {
      unmatchedLines.push(trimmedLine);
      continue;
    }

    ids.push(entry.id);
    usedIds.add(entry.id);
  }

  return { ids, unmatchedLines };
}
