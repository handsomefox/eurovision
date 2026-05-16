import type { Entry } from "../types";

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

export async function fetchWikiImage(item: Entry): Promise<string | null> {
  if (item.officialPhotoUrl) return item.officialPhotoUrl;
  if (item.forceFlag) return null;

  for (const title of item.wikiTitles || []) {
    const image = await fetchPageImageByTitle(title);
    if (image) return image;
  }

  if (item.exactImageOnly) return item.fallbackPhotoUrl || null;

  const searchQueries = [`${item.artist} singer`, `${item.artist} Eurovision`, `${item.country} Eurovision ${item.artist}`];

  for (const query of searchQueries) {
    const image = await fetchPageImageBySearch(query);
    if (image) return image;
  }

  return item.fallbackPhotoUrl || null;
}
