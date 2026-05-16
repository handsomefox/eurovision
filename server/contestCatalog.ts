import fs from "node:fs";
import path from "node:path";

type ContestEntry = {
  id?: unknown;
};

type ContestFile = {
  id?: unknown;
  entries?: unknown;
};

export type ContestCatalog = Map<string, Set<string>>;

function readContestFile(filePath: string): ContestFile {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as ContestFile;
}

export function loadContestCatalog(contestsDir = path.join(process.cwd(), "src", "data", "contests")): ContestCatalog {
  const catalog: ContestCatalog = new Map();

  for (const fileName of fs.readdirSync(contestsDir)) {
    if (!fileName.endsWith(".json")) continue;

    const contest = readContestFile(path.join(contestsDir, fileName));
    if (typeof contest.id !== "string" || !Array.isArray(contest.entries)) continue;

    const entryIds = new Set<string>();
    for (const entry of contest.entries as ContestEntry[]) {
      if (typeof entry.id === "string" && entry.id.trim()) {
        entryIds.add(entry.id);
      }
    }

    catalog.set(contest.id, entryIds);
  }

  return catalog;
}
