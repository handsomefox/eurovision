import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import type { ContestCatalog } from "../server/contestCatalog";
import { initializeDatabase } from "../server/db";
import { createRankingService } from "../server/rankings";

function createTestService() {
  const db = new Database(":memory:");
  initializeDatabase(db);

  const catalog: ContestCatalog = new Map([
    ["esc-test", new Set(["denmark", "germany", "israel"])],
    ["other-test", new Set(["france"])]
  ]);

  return { service: createRankingService(db, catalog), db };
}

describe("ranking service", () => {
  let currentDb: Database.Database | null = null;

  afterEach(() => {
    currentDb?.close();
    currentDb = null;
  });

  it("saves and loads a valid contest ranking", () => {
    const { service, db } = createTestService();
    currentDb = db;

    const saveResponse = service.save("viewer", "esc-test", ["denmark", "israel"]);

    expect(saveResponse.ok).toBe(true);

    const loadResponse = service.load("viewer", "esc-test");
    expect(loadResponse.rankingIds).toEqual(["denmark", "israel"]);
    expect(loadResponse.updatedAt).toEqual(saveResponse.updatedAt);
  });

  it("rejects unknown contest IDs", () => {
    const { service, db } = createTestService();
    currentDb = db;

    expect(() => service.save("viewer", "missing", ["denmark"])).toThrow("contestId is unknown");
  });

  it("rejects ranking IDs outside the selected contest", () => {
    const { service, db } = createTestService();
    currentDb = db;

    expect(() => service.save("viewer", "other-test", ["denmark"])).toThrow("rankingIds must belong to contestId");
  });
});
