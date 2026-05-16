import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const defaultDatabasePath = path.join(process.cwd(), "data", "eurovision-ranker.sqlite");

export function getDatabasePath() {
  return process.env.DATABASE_PATH || defaultDatabasePath;
}

export function openDatabase() {
  const databasePath = getDatabasePath();
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  const db = new Database(databasePath);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");

  db.exec(`
    CREATE TABLE IF NOT EXISTS rankings (
      user_key_hash TEXT NOT NULL,
      contest_id TEXT NOT NULL,
      ranking_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_key_hash, contest_id)
    );
  `);

  return db;
}
