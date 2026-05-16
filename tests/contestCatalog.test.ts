import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadContestCatalog } from "../server/contestCatalog";

describe("loadContestCatalog", () => {
  it("builds a contest-to-entry-id catalog from contest JSON files", () => {
    const contestsDir = fs.mkdtempSync(path.join(os.tmpdir(), "eurovision-contests-"));
    fs.writeFileSync(
      path.join(contestsDir, "contest.json"),
      JSON.stringify({
        id: "esc-test",
        entries: [{ id: "denmark" }, { id: "germany" }]
      })
    );

    const catalog = loadContestCatalog(contestsDir);

    expect(catalog.get("esc-test")).toEqual(new Set(["denmark", "germany"]));
  });
});
