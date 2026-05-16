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
    setImages(Object.fromEntries(items.map((item) => [item.id, { status: "loading", src: null } satisfies WikiImage])));

    async function load() {
      const entries = await Promise.all(
        items.map(async (item) => {
          try {
            const image = await fetchWikiImage(item);
            return [item.id, { status: image ? "found" : "missing", src: image } satisfies WikiImage];
          } catch {
            return [item.id, { status: "missing", src: null } satisfies WikiImage];
          }
        })
      );

      if (!cancelled) setImages(Object.fromEntries(entries));
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [items]);

  return images;
}
