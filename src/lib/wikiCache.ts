import type { Entry, WikiImage } from "../types";

export type ResolvedWikiImage = Exclude<WikiImage, { status: "loading" }>;

type CachedWikiImage = ResolvedWikiImage & {
  cachedAt: number;
};

const IMAGE_CACHE_PREFIX = "eurovision-ranker-image-v1";
const FOUND_IMAGE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MISSING_IMAGE_TTL_MS = 3 * 24 * 60 * 60 * 1000;

function hashString(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}

function imageCacheKey(item: Entry): string {
  const signature = JSON.stringify({
    id: item.id,
    artist: item.artist,
    song: item.song,
    wikiTitles: item.wikiTitles,
    songWikiTitle: item.songWikiTitle,
    fallbackPhotoUrl: item.fallbackPhotoUrl,
    exactImageOnly: item.exactImageOnly
  });

  return `${IMAGE_CACHE_PREFIX}:${item.id}:${hashString(signature)}`;
}

export function readCachedImage(item: Entry): ResolvedWikiImage | null {
  try {
    const raw = localStorage.getItem(imageCacheKey(item));
    if (!raw) return null;

    const cached = JSON.parse(raw) as Partial<CachedWikiImage>;
    if ((cached.status !== "found" && cached.status !== "missing") || typeof cached.cachedAt !== "number") return null;
    if (cached.src !== null && typeof cached.src !== "string") return null;

    const ttl = cached.status === "found" ? FOUND_IMAGE_TTL_MS : MISSING_IMAGE_TTL_MS;
    if (Date.now() - cached.cachedAt > ttl) return null;

    return { status: cached.status, src: cached.src ?? null };
  } catch {
    return null;
  }
}

export function writeCachedImage(item: Entry, image: ResolvedWikiImage): void {
  try {
    localStorage.setItem(imageCacheKey(item), JSON.stringify({ ...image, cachedAt: Date.now() } satisfies CachedWikiImage));
  } catch {
    // Ignore private-mode or quota errors; image lookup still works without cache.
  }
}

export function getImmediateImage(item: Entry): WikiImage {
  if (item.officialPhotoUrl) return { status: "found", src: item.officialPhotoUrl };
  if (item.forceFlag) return { status: "missing", src: null };
  return readCachedImage(item) || { status: "loading", src: null };
}
