import { describe, expect, it } from "vitest";
import { contests } from "../src/lib/contestModel";

const expectedHistoricalCounts = new Map([
  ["esc-2021-eu", 26],
  ["esc-2022-eu", 25],
  ["esc-2023-eu", 26],
  ["esc-2024-eu", 25],
  ["esc-2025-eu", 26],
  ["esc-2026-eu", 25]
]);

describe("contest data", () => {
  it("has unique contest and entry ids with required fields", () => {
    expect(new Set(contests.map((contest) => contest.id)).size).toBe(contests.length);

    for (const contest of contests) {
      const entryIds = new Set(contest.entries.map((entry) => entry.id));
      expect(entryIds.size, contest.id).toBe(contest.entries.length);

      for (const entry of contest.entries) {
        expect(entry.id, `${contest.id} entry id`).toBeTruthy();
        expect(entry.country, `${contest.id}.${entry.id} country`).toBeTruthy();
        expect(entry.code, `${contest.id}.${entry.id} code`).toMatch(/^[a-z]{2}$/);
        expect(entry.artist, `${contest.id}.${entry.id} artist`).toBeTruthy();
        expect(entry.song, `${contest.id}.${entry.id} song`).toBeTruthy();
      }
    }
  });

  it("has unique running order numbers", () => {
    for (const contest of contests) {
      const orders = contest.entries.map((entry) => entry.order);
      expect(new Set(orders).size, contest.id).toBe(orders.length);
      expect(Math.min(...orders), contest.id).toBe(1);
    }
  });

  it("has complete official result fields and unique result ranks when results exist", () => {
    for (const contest of contests) {
      const entriesWithResults = contest.entries.filter((entry) => entry.resultRank !== undefined || entry.resultPoints !== undefined);
      if (!entriesWithResults.length) continue;

      expect(entriesWithResults.length, contest.id).toBe(contest.entries.length);
      expect(
        entriesWithResults.every((entry) => entry.resultRank !== undefined && entry.resultPoints !== undefined),
        contest.id
      ).toBe(true);

      const ranks = entriesWithResults.map((entry) => entry.resultRank);
      expect(new Set(ranks).size, contest.id).toBe(ranks.length);
      expect(Math.min(...(ranks as number[])), contest.id).toBe(1);
      expect(Math.max(...(ranks as number[])), contest.id).toBe(contest.entries.length);
    }
  });

  it("registers the expected historical Grand Final entry counts", () => {
    for (const [contestId, count] of expectedHistoricalCounts) {
      expect(contests.find((contest) => contest.id === contestId)?.entries.length).toBe(count);
    }
  });
});
