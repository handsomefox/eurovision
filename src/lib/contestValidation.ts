import type { Contest, Entry } from "../types";

function assertString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} must be a non-empty string`);
  }
}

function assertNumber(value: unknown, label: string): asserts value is number {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a number`);
  }
}

function assertOptionalString(value: unknown, label: string): asserts value is string | undefined {
  if (value !== undefined && typeof value !== "string") {
    throw new Error(`${label} must be a string`);
  }
}

function assertOptionalBoolean(value: unknown, label: string): asserts value is boolean | undefined {
  if (value !== undefined && typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean`);
  }
}

function assertOptionalStringArray(value: unknown, label: string): asserts value is string[] | undefined {
  if (value === undefined) return;
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string" && item.trim())) {
    throw new Error(`${label} must be an array of non-empty strings`);
  }
}

function validateLocalizedMetadata(value: unknown, label: string): void {
  if (value === undefined) return;
  if (!value || typeof value !== "object") {
    throw new Error(`${label} must be an object`);
  }

  const metadata = value as Record<string, unknown>;
  for (const locale of ["en", "ru"]) {
    const localized = metadata[locale];
    if (localized === undefined) continue;
    if (!localized || typeof localized !== "object") {
      throw new Error(`${label}.${locale} must be an object`);
    }

    const fields = localized as Record<string, unknown>;
    for (const field of ["label", "title", "badge", "description"]) {
      assertOptionalString(fields[field], `${label}.${locale}.${field}`);
    }
  }
}

function assertOptionalResult(value: unknown, label: string): asserts value is number | undefined {
  if (value !== undefined && (typeof value !== "number" || !Number.isInteger(value) || value < 0)) {
    throw new Error(`${label} must be a non-negative integer`);
  }
}

function validateEntry(rawEntry: unknown, contestId: string): Entry {
  if (!rawEntry || typeof rawEntry !== "object") {
    throw new Error(`${contestId}.entries must contain objects`);
  }

  const entry = rawEntry as Partial<Entry>;
  for (const field of ["id", "country", "code", "artist", "song"] as const) {
    assertString(entry[field], `${contestId}.${field}`);
  }
  assertOptionalString(entry.flag, `${contestId}.${entry.id}.flag`);
  assertNumber(entry.order, `${contestId}.${entry.id}.order`);
  assertOptionalStringArray(entry.wikiTitles, `${contestId}.${entry.id}.wikiTitles`);
  assertOptionalString(entry.songWikiTitle, `${contestId}.${entry.id}.songWikiTitle`);
  assertOptionalString(entry.officialPhotoUrl, `${contestId}.${entry.id}.officialPhotoUrl`);
  assertOptionalString(entry.fallbackPhotoUrl, `${contestId}.${entry.id}.fallbackPhotoUrl`);
  assertOptionalBoolean(entry.forceFlag, `${contestId}.${entry.id}.forceFlag`);
  assertOptionalBoolean(entry.exactImageOnly, `${contestId}.${entry.id}.exactImageOnly`);
  assertOptionalResult(entry.resultRank, `${contestId}.${entry.id}.resultRank`);
  assertOptionalResult(entry.resultPoints, `${contestId}.${entry.id}.resultPoints`);

  if ((entry.resultRank === undefined) !== (entry.resultPoints === undefined)) {
    throw new Error(`${contestId}.${entry.id} must include both resultRank and resultPoints`);
  }
  if (!/^[a-z]{2}$/.test(entry.code!)) {
    throw new Error(`${contestId}.${entry.id}.code must be a lowercase ISO country code`);
  }

  return entry as Entry;
}

export function validateContest(rawContest: unknown): Contest {
  if (!rawContest || typeof rawContest !== "object") {
    throw new Error("contest must be an object");
  }

  const contest = rawContest as Partial<Contest>;
  assertString(contest.id, "contest.id");
  assertNumber(contest.year, `${contest.id}.year`);
  assertString(contest.family, `${contest.id}.family`);
  assertString(contest.region, `${contest.id}.region`);
  assertString(contest.label, `${contest.id}.label`);
  assertString(contest.title, `${contest.id}.title`);
  assertString(contest.badge, `${contest.id}.badge`);
  assertString(contest.description, `${contest.id}.description`);
  assertString(contest.sourceUrl, `${contest.id}.sourceUrl`);
  validateLocalizedMetadata(contest.i18n, `${contest.id}.i18n`);
  if (contest.status !== "complete" && contest.status !== "placeholder") {
    throw new Error(`${contest.id}.status must be complete or placeholder`);
  }
  if (!Array.isArray(contest.entries)) {
    throw new Error(`${contest.id}.entries must be an array`);
  }

  const entryIds = new Set<string>();
  const orders = new Set<number>();
  const resultRanks = new Set<number>();
  const entries = contest.entries.map((entry) => {
    const validated = validateEntry(entry, contest.id!);
    if (entryIds.has(validated.id)) throw new Error(`${contest.id} has duplicate entry id: ${validated.id}`);
    if (orders.has(validated.order)) throw new Error(`${contest.id} has duplicate running order: ${validated.order}`);
    if (validated.resultRank !== undefined && resultRanks.has(validated.resultRank)) {
      throw new Error(`${contest.id} has duplicate result rank: ${validated.resultRank}`);
    }
    entryIds.add(validated.id);
    orders.add(validated.order);
    if (validated.resultRank !== undefined) resultRanks.add(validated.resultRank);
    return validated;
  });

  const completeResultCount = entries.filter((entry) => entry.resultRank !== undefined).length;
  if (completeResultCount > 0 && completeResultCount !== entries.length) {
    throw new Error(`${contest.id} must include result fields for every entry or none`);
  }

  return { ...(contest as Contest), entries: [...entries].sort((first, second) => first.order - second.order) };
}

export function validateContests(rawContests: unknown[]): Contest[] {
  const contestIds = new Set<string>();
  return rawContests.map((rawContest) => {
    const contest = validateContest(rawContest);
    if (contestIds.has(contest.id)) throw new Error(`Duplicate contest id: ${contest.id}`);
    contestIds.add(contest.id);
    return contest;
  });
}
