import type Database from "better-sqlite3";
import { Router } from "express";
import { createHash } from "node:crypto";
import type { ContestCatalog } from "./contestCatalog.js";

const MAX_RANKING_LENGTH = 100;

type RankingRow = {
  ranking_json: string;
  updated_at: string;
};

type RankingResponse = {
  rankingIds: string[];
  updatedAt: string | null;
};

type SaveRankingResponse = {
  ok: true;
  updatedAt: string;
};

function hashUserKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

function cleanKey(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateContestId(value: unknown, contestCatalog: ContestCatalog): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return "contestId is required";
  }
  if (!contestCatalog.has(value)) {
    return "contestId is unknown";
  }
  return null;
}

export function validateRankingIds(value: unknown, contestId: string, contestCatalog: ContestCatalog): string | null {
  if (!Array.isArray(value)) return "rankingIds must be an array";
  if (value.length > MAX_RANKING_LENGTH) return `rankingIds cannot contain more than ${MAX_RANKING_LENGTH} items`;
  if (!value.every((id) => typeof id === "string" && id.trim())) return "rankingIds must contain non-empty strings";
  if (new Set(value).size !== value.length) return "rankingIds cannot contain duplicates";
  const contestEntryIds = contestCatalog.get(contestId);
  if (!contestEntryIds || !value.every((id) => contestEntryIds.has(id))) return "rankingIds must belong to contestId";
  return null;
}

export function createRankingService(db: Database.Database, contestCatalog: ContestCatalog) {
  const selectRanking = db.prepare<[string, string], RankingRow>(`
    SELECT ranking_json, updated_at
    FROM rankings
    WHERE user_key_hash = ? AND contest_id = ?
  `);

  const upsertRanking = db.prepare<[string, string, string, string, string]>(`
    INSERT INTO rankings (user_key_hash, contest_id, ranking_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_key_hash, contest_id)
    DO UPDATE SET ranking_json = excluded.ranking_json, updated_at = excluded.updated_at
  `);

  return {
    load(key: string, contestId: string): RankingResponse {
      if (!key) throw new Error("key is required");
      const contestError = validateContestId(contestId, contestCatalog);
      if (contestError) throw new Error(contestError);

      const row = selectRanking.get(hashUserKey(key), contestId);
      if (!row) {
        return { rankingIds: [], updatedAt: null };
      }

      try {
        const rankingIds = JSON.parse(row.ranking_json) as unknown;
        const contestEntryIds = contestCatalog.get(contestId) || new Set<string>();
        const knownRankingIds = Array.isArray(rankingIds)
          ? rankingIds.filter((id): id is string => typeof id === "string" && contestEntryIds.has(id))
          : [];
        return {
          rankingIds: [...new Set(knownRankingIds)],
          updatedAt: row.updated_at
        };
      } catch {
        throw new Error("stored ranking is invalid");
      }
    },

    save(key: string, contestId: string, rankingIds: unknown): SaveRankingResponse {
      if (!key) throw new Error("key is required");
      const contestError = validateContestId(contestId, contestCatalog);
      if (contestError) throw new Error(contestError);
      const rankingError = validateRankingIds(rankingIds, contestId, contestCatalog);
      if (rankingError) throw new Error(rankingError);

      const updatedAt = new Date().toISOString();
      upsertRanking.run(hashUserKey(key), contestId, JSON.stringify(rankingIds), updatedAt, updatedAt);

      return { ok: true, updatedAt };
    }
  };
}

export function createRankingRouter(db: Database.Database, contestCatalog: ContestCatalog): Router {
  const router = Router();
  const rankingService = createRankingService(db, contestCatalog);

  router.get("/ranking", (req, res) => {
    const key = cleanKey(req.query.key);
    const contestId = cleanKey(req.query.contestId);

    try {
      return res.json(rankingService.load(key, contestId));
    } catch (error) {
      const message = error instanceof Error ? error.message : "stored ranking is invalid";
      const status = message === "stored ranking is invalid" ? 500 : 400;
      return res.status(status).json({ error: message });
    }
  });

  router.put("/ranking", (req, res) => {
    const key = cleanKey(req.body?.key);
    const contestId = cleanKey(req.body?.contestId);
    const rankingIds = req.body?.rankingIds;

    try {
      return res.json(rankingService.save(key, contestId, rankingIds));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Request failed";
      return res.status(400).json({ error: message });
    }
  });

  return router;
}
