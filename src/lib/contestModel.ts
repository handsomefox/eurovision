import { contests as rawContests } from "../data/contestRegistry";
import type { Contest } from "../types";
import { validateContests } from "./contestValidation";

export const contests = validateContests(rawContests);

export function getContestById(id: string): Contest | null {
  return contests.find((contest) => contest.id === id) || null;
}

export function getDefaultContestId(): string {
  return contests[0]?.id || "";
}
