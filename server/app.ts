import type Database from "better-sqlite3";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadContestCatalog, type ContestCatalog } from "./contestCatalog.js";
import { createRankingRouter } from "./rankings.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

export function createApp(db: Database.Database, contestCatalog: ContestCatalog = loadContestCatalog()): express.Express {
  const app = express();

  app.use(express.json({ limit: "64kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api", createRankingRouter(db, contestCatalog));

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(distDir));
    app.use((req, res, next): void => {
      if (req.method !== "GET" || req.path.startsWith("/api")) {
        next();
        return;
      }

      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  return app;
}
