import { describe, expect, it } from "vitest";
import { validateContest } from "../src/lib/contestValidation";

const validContest = {
  id: "esc-test",
  year: 2025,
  family: "eurovision",
  region: "eu",
  label: "Eurovision Test",
  title: "Eurovision Test Ranker",
  badge: "Test",
  status: "complete",
  description: "Test contest",
  sourceUrl: "https://example.com",
  entries: [
    { id: "a", order: 1, country: "A", flag: "🏳️", code: "gb", artist: "Artist A", song: "Song A", resultRank: 2, resultPoints: 10 },
    { id: "b", order: 2, country: "B", flag: "🏳️", code: "gb", artist: "Artist B", song: "Song B", resultRank: 1, resultPoints: 20 }
  ]
};

describe("contest validation", () => {
  it("sorts entries by running order", () => {
    const contest = validateContest({ ...validContest, entries: [...validContest.entries].reverse() });

    expect(contest.entries.map((entry) => entry.id)).toEqual(["a", "b"]);
  });

  it("rejects partial official result fields", () => {
    expect(() =>
      validateContest({
        ...validContest,
        entries: [{ ...validContest.entries[0], resultPoints: undefined }, validContest.entries[1]]
      })
    ).toThrow("must include both resultRank and resultPoints");
  });

  it("rejects duplicate running orders and result ranks", () => {
    expect(() =>
      validateContest({
        ...validContest,
        entries: [
          { ...validContest.entries[0], order: 1 },
          { ...validContest.entries[1], order: 1 }
        ]
      })
    ).toThrow("duplicate running order");

    expect(() =>
      validateContest({
        ...validContest,
        entries: [
          { ...validContest.entries[0], resultRank: 1 },
          { ...validContest.entries[1], resultRank: 1 }
        ]
      })
    ).toThrow("duplicate result rank");
  });
});
