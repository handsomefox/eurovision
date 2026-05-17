import { describe, expect, it } from "vitest";
import { formatRankingForClipboard, getRankComparison, moveItem, sortByOfficialResult, uniqueKnownIds } from "../src/lib/rankingHelpers";
import type { Entry } from "../src/types";

const entries = [
  { id: "winner", order: 2, country: "Winner", flag: "🏳️", code: "gb", artist: "A", song: "Song A", resultRank: 1, resultPoints: 200 },
  { id: "third", order: 1, country: "Third", flag: "🏳️", code: "gb", artist: "B", song: "Song B", resultRank: 3, resultPoints: 100 },
  { id: "second", order: 3, country: "Second", flag: "🏳️", code: "gb", artist: "C", song: "Song C", resultRank: 2, resultPoints: 150 }
] satisfies Entry[];

describe("ranking helpers", () => {
  it("moves items without mutating the original ranking", () => {
    const original = ["a", "b", "c"];

    expect(moveItem(original, 0, 2)).toEqual(["b", "c", "a"]);
    expect(original).toEqual(["a", "b", "c"]);
  });

  it("keeps personal ranking independent from official result order", () => {
    const personalRanking = ["third", "winner", "second"];
    const byId = new Map(entries.map((entry) => [entry.id, entry]));

    expect(personalRanking.map((id) => byId.get(id)?.country)).toEqual(["Third", "Winner", "Second"]);
    expect(sortByOfficialResult(entries).map((entry) => entry.id)).toEqual(["winner", "second", "third"]);
  });

  it("drops unknown and duplicate ids from loaded rankings", () => {
    const byId = new Map(entries.map((entry) => [entry.id, entry]));

    expect(uniqueKnownIds(["winner", "missing", "winner", "second"], byId)).toEqual(["winner", "second"]);
  });

  it("compares personal ranks to official results", () => {
    expect(getRankComparison(entries[0], 0)).toMatchObject({ status: "same", delta: 0 });
    expect(getRankComparison(entries[2], 0)).toMatchObject({ status: "better", delta: 1 });
    expect(getRankComparison(entries[0], 2)).toMatchObject({ status: "worse", delta: -2 });
    expect(getRankComparison(entries[0], undefined)).toMatchObject({ status: "unranked", personalRank: null });
    expect(getRankComparison({ ...entries[0], resultRank: undefined, resultPoints: undefined }, 0)).toMatchObject({
      status: "missing-official",
      officialRank: null
    });
  });

  it("formats rankings for clipboard without emoji flags", () => {
    expect(formatRankingForClipboard([entries[0]], "en")).toBe("1. Winner (GB): A - Song A");
    expect(formatRankingForClipboard([], "ru")).toBe("Пока никого нет в рейтинге.");
  });
});
