import { useEffect, useState } from "react";
import type { Entry, WikiImage } from "../types";
import { fetchWikiImage } from "./wikiFetch";
import { getImmediateImage, type ResolvedWikiImage, writeCachedImage } from "./wikiCache";

export { makeWikiUrl, normalize, songWikiUrl, wikiUrl } from "./wikiUrls";

const IMAGE_FETCH_CONCURRENCY = 4;

export function useWikiImages(items: Entry[]): Record<string, WikiImage> {
  const [images, setImages] = useState<Record<string, WikiImage>>({});

  useEffect(() => {
    let cancelled = false;
    const immediateImages = Object.fromEntries(items.map((item) => [item.id, getImmediateImage(item)]));
    setImages(immediateImages);

    async function load() {
      const itemsToFetch = items.filter((item) => immediateImages[item.id]?.status === "loading");
      if (!itemsToFetch.length) return;

      for (let index = 0; index < itemsToFetch.length; index += IMAGE_FETCH_CONCURRENCY) {
        if (cancelled) return;

        const batch = itemsToFetch.slice(index, index + IMAGE_FETCH_CONCURRENCY);
        const entries = await Promise.all(
          batch.map(async (item) => {
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
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [items]);

  return images;
}
