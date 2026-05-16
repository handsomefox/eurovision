import type { Entry } from "../types";

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
  const title = item.songWikiTitle || matchedSongPage || `${item.country} in the Eurovision Song Contest`;
  return makeWikiUrl(title);
}
