import { Router } from "express";
import { createHash } from "node:crypto";

const MAX_RANKING_LENGTH = 100;

function hashUserKey(key) {
  return createHash("sha256").update(key).digest("hex");
}

function cleanKey(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validateContestId(value) {
  if (typeof value !== "string" || !value.trim()) {
    return "contestId is required";
  }
  return null;
}

function validateRankingIds(value) {
  if (!Array.isArray(value)) return "rankingIds must be an array";
  if (value.length > MAX_RANKING_LENGTH) return `rankingIds cannot contain more than ${MAX_RANKING_LENGTH} items`;
  if (!value.every((id) => typeof id === "string" && id.trim())) return "rankingIds must contain non-empty strings";
  if (new Set(value).size !== value.length) return "rankingIds cannot contain duplicates";
  return null;
}

export function createRankingRouter(db) {
  const router = Router();

  const selectRanking = db.prepare(`
    SELECT ranking_json, updated_at
    FROM rankings
    WHERE user_key_hash = ? AND contest_id = ?
  `);

  const upsertRanking = db.prepare(`
    INSERT INTO rankings (user_key_hash, contest_id, ranking_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_key_hash, contest_id)
    DO UPDATE SET ranking_json = excluded.ranking_json, updated_at = excluded.updated_at
  `);

  router.get("/ranking", (req, res) => {
    const key = cleanKey(req.query.key);
    const contestId = cleanKey(req.query.contestId);

    if (!key) return res.status(400).json({ error: "key is required" });
    const contestError = validateContestId(contestId);
    if (contestError) return res.status(400).json({ error: contestError });

    const row = selectRanking.get(hashUserKey(key), contestId);
    if (!row) {
      return res.json({ rankingIds: [], updatedAt: null });
    }

    try {
      const rankingIds = JSON.parse(row.ranking_json);
      return res.json({ rankingIds: Array.isArray(rankingIds) ? rankingIds : [], updatedAt: row.updated_at });
    } catch {
      return res.status(500).json({ error: "stored ranking is invalid" });
    }
  });

  router.put("/ranking", (req, res) => {
    const key = cleanKey(req.body?.key);
    const contestId = cleanKey(req.body?.contestId);
    const rankingIds = req.body?.rankingIds;

    if (!key) return res.status(400).json({ error: "key is required" });
    const contestError = validateContestId(contestId);
    if (contestError) return res.status(400).json({ error: contestError });
    const rankingError = validateRankingIds(rankingIds);
    if (rankingError) return res.status(400).json({ error: rankingError });

    const updatedAt = new Date().toISOString();
    upsertRanking.run(hashUserKey(key), contestId, JSON.stringify(rankingIds), updatedAt, updatedAt);

    return res.json({ ok: true, updatedAt });
  });

  return router;
}
