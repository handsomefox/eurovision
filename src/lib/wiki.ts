import { useEffect, useState } from "react";
import type { Entry, WikiImage } from "../types";

type WikiPage = {
  thumbnail?: {
    source?: string;
  };
};

type WikiImageResponse = {
  query?: {
    pages?: Record<string, WikiPage>;
  };
};

type ResolvedWikiImage = Exclude<WikiImage, { status: "loading" }>;

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

function readCachedImage(item: Entry): ResolvedWikiImage | null {
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

function writeCachedImage(item: Entry, image: ResolvedWikiImage): void {
  try {
    localStorage.setItem(imageCacheKey(item), JSON.stringify({ ...image, cachedAt: Date.now() } satisfies CachedWikiImage));
  } catch {
    // Ignore private-mode or quota errors; image lookup still works without cache.
  }
}

function getImmediateImage(item: Entry): WikiImage {
  if (item.officialPhotoUrl) return { status: "found", src: item.officialPhotoUrl };
  if (item.forceFlag) return { status: "missing", src: null };
  return readCachedImage(item) || { status: "loading", src: null };
}

export function makeWikiUrl(title: string): string {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(" ", "_"))}`;
}

export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function wikiUrl(item: Entry): string {
  const title = item.wikiTitles?.[0] || item.artist;
  return makeWikiUrl(title);
}

export function songWikiUrl(item: Entry): string {
  const matchedSongPage = (item.wikiTitles || []).find((title) => normalize(title).includes(normalize(item.song)));
  const title = item.songWikiTitle || matchedSongPage || `${item.country} in the Eurovision Song Contest 2026`;
  return makeWikiUrl(title);
}

async function fetchPageImageByTitle(title: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: "query",
    origin: "*",
    format: "json",
    redirects: "1",
    prop: "pageimages",
    piprop: "thumbnail",
    pithumbsize: "900",
    titles: title
  });

  const response = await fetch(`https://en.wikipedia.org/w/api.php?${params.toString()}`);
  if (!response.ok) return null;

  const data = (await response.json()) as WikiImageResponse;
  const pages = Object.values(data?.query?.pages || {});
  return pages.find((page) => page?.thumbnail?.source)?.thumbnail?.source || null;
}

async function fetchPageImageBySearch(query: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: "query",
    origin: "*",
    format: "json",
    generator: "search",
    gsrsearch: query,
    gsrlimit: "5",
    prop: "pageimages",
    piprop: "thumbnail",
    pithumbsize: "900"
  });

  const response = await fetch(`https://en.wikipedia.org/w/api.php?${params.toString()}`);
  if (!response.ok) return null;

  const data = (await response.json()) as WikiImageResponse;
  const pages = Object.values(data?.query?.pages || {});
  return pages.find((page) => page?.thumbnail?.source)?.thumbnail?.source || null;
}

async function fetchWikiImage(item: Entry): Promise<string | null> {
  if (item.officialPhotoUrl) return item.officialPhotoUrl;
  if (item.forceFlag) return null;

  for (const title of item.wikiTitles || []) {
    const image = await fetchPageImageByTitle(title);
    if (image) return image;
  }

  if (item.exactImageOnly) return item.fallbackPhotoUrl || null;

  const searchQueries = [`${item.artist} singer`, `${item.artist} Eurovision`, `${item.country} Eurovision 2026 ${item.artist}`];

  for (const query of searchQueries) {
    const image = await fetchPageImageBySearch(query);
    if (image) return image;
  }

  return item.fallbackPhotoUrl || null;
}

export function useWikiImages(items: Entry[]): Record<string, WikiImage> {
  const [images, setImages] = useState<Record<string, WikiImage>>({});

  useEffect(() => {
    let cancelled = false;
    const immediateImages = Object.fromEntries(items.map((item) => [item.id, getImmediateImage(item)]));
    setImages(immediateImages);

    async function load() {
      const itemsToFetch = items.filter((item) => immediateImages[item.id]?.status === "loading");
      if (!itemsToFetch.length) return;

      const entries = await Promise.all(
        itemsToFetch.map(async (item) => {
          try {
            const image = await fetchWikiImage(item);
            const resolved = { status: image ? "found" : "missing", src: image } satisfies ResolvedWikiImage;
            writeCachedImage(item, resolved);
            return [item.id, resolved] as const;
          } catch {
            const resolved = { status: "missing", src: null } satisfies ResolvedWikiImage;
            writeCachedImage(item, resolved);
            return [item.id, resolved] as const;
          }
        })
      );

      if (!cancelled) {
        setImages((current) => ({ ...current, ...Object.fromEntries(entries) }));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [items]);

  return images;
}
