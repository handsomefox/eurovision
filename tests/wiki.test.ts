import { beforeEach, describe, expect, it, vi } from "vitest";
import { getImmediateImage, readCachedImage, writeCachedImage } from "../src/lib/wikiCache";
import { fetchWikiImage } from "../src/lib/wikiFetch";
import { makeWikiUrl, normalize, songWikiUrl } from "../src/lib/wikiUrls";
import type { Entry } from "../src/types";

const entry = {
  id: "italy",
  order: 1,
  country: "Italy",
  flag: "🇮🇹",
  code: "it",
  artist: "Måneskin",
  song: "Zitti e buoni",
  wikiTitles: ["Måneskin"]
} satisfies Entry;

describe("wiki helpers", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      clear: () => values.clear()
    });
    vi.restoreAllMocks();
  });

  it("normalizes accents and builds urls", () => {
    expect(normalize("Måneskin Voilà")).toBe("maneskin voila");
    expect(makeWikiUrl("Eurovision Song Contest")).toBe("https://en.wikipedia.org/wiki/Eurovision_Song_Contest");
  });

  it("uses an explicit or matched song title for song wiki links", () => {
    expect(songWikiUrl({ ...entry, songWikiTitle: "Italy in the Eurovision Song Contest 2021" })).toContain(
      "Italy_in_the_Eurovision_Song_Contest_2021"
    );
    expect(songWikiUrl({ ...entry, wikiTitles: ["Zitti e buoni"] })).toContain("Zitti_e_buoni");
  });

  it("reads and writes resolved image cache entries", () => {
    writeCachedImage(entry, { status: "found", src: "https://example.com/image.jpg" });

    expect(readCachedImage(entry)).toEqual({ status: "found", src: "https://example.com/image.jpg" });
    expect(getImmediateImage(entry)).toEqual({ status: "found", src: "https://example.com/image.jpg" });
  });

  it("short-circuits forced flags and official photos before fetching", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(fetchWikiImage({ ...entry, forceFlag: true })).resolves.toBeNull();
    await expect(fetchWikiImage({ ...entry, officialPhotoUrl: "https://example.com/official.jpg" })).resolves.toBe(
      "https://example.com/official.jpg"
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
