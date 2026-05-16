import { useEffect, useRef, useState } from "react";
import { loadRanking, saveRanking } from "./api";
import { uniqueKnownIds } from "./rankingHelpers";
import type { Entry } from "../types";

export type LoadStatus = "loading" | "ready" | "error";
export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useSavedRanking({ byId, contestId, userKey }: { byId: Map<string, Entry>; contestId: string; userKey: string }) {
  const [rankingIds, setRankingIds] = useState<string[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const lastSavedJson = useRef("[]");
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    setRankingIds([]);
    setLoadStatus("loading");
    setSaveStatus("idle");

    let cancelled = false;

    async function run() {
      try {
        const result = await loadRanking({ key: userKey, contestId });
        if (cancelled) return;

        const nextRankingIds = uniqueKnownIds(Array.isArray(result.rankingIds) ? result.rankingIds : [], byId);
        setRankingIds(nextRankingIds);
        lastSavedJson.current = JSON.stringify(nextRankingIds);
        setLoadStatus("ready");
      } catch {
        if (cancelled) return;
        setRankingIds([]);
        lastSavedJson.current = "[]";
        setLoadStatus("error");
      }
    }

    run();
    return () => {
      cancelled = true;
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [byId, contestId, userKey]);

  useEffect(() => {
    if (loadStatus !== "ready") return;

    const nextJson = JSON.stringify(rankingIds);
    if (nextJson === lastSavedJson.current) return;

    setSaveStatus("saving");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);

    saveTimer.current = window.setTimeout(async () => {
      try {
        await saveRanking({ key: userKey, contestId, rankingIds });
        lastSavedJson.current = nextJson;
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, 450);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [contestId, loadStatus, rankingIds, userKey]);

  return { rankingIds, setRankingIds, loadStatus, saveStatus };
}
