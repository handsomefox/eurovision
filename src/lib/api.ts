import type { LoadRankingResponse, SaveRankingResponse } from "../types";

type ErrorBody = {
  error?: string;
};

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as ErrorBody;
  if (!response.ok) {
    throw new Error(body.error || `Request failed with ${response.status}`);
  }
  return body as T;
}

export async function loadRanking({ key, contestId }: { key: string; contestId: string }): Promise<LoadRankingResponse> {
  const params = new URLSearchParams({ key, contestId });
  const response = await fetch(`/api/ranking?${params.toString()}`);
  return parseJsonResponse<LoadRankingResponse>(response);
}

export async function saveRanking({
  key,
  contestId,
  rankingIds
}: {
  key: string;
  contestId: string;
  rankingIds: string[];
}): Promise<SaveRankingResponse> {
  const response = await fetch("/api/ranking", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ key, contestId, rankingIds })
  });

  return parseJsonResponse<SaveRankingResponse>(response);
}
