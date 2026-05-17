export type Entry = {
  id: string;
  order: number;
  country: string;
  flag?: string;
  code: string;
  artist: string;
  song: string;
  wikiTitles?: string[];
  songWikiTitle?: string;
  officialPhotoUrl?: string;
  fallbackPhotoUrl?: string;
  forceFlag?: boolean;
  exactImageOnly?: boolean;
  resultRank?: number;
  resultPoints?: number;
};

export type Locale = "en" | "ru";

export type ContestLocalizedMetadata = Partial<Pick<Contest, "label" | "title" | "badge" | "description">>;
export type ContestTranslationLocale = Exclude<Locale, "en">;

export type Contest = {
  id: string;
  year: number;
  family: string;
  region: string;
  label: string;
  title: string;
  badge: string;
  status: "complete" | "placeholder";
  description: string;
  sourceUrl: string;
  i18n?: Partial<Record<ContestTranslationLocale, ContestLocalizedMetadata>>;
  entries: Entry[];
};

export type WikiImage = {
  status: "loading" | "found" | "missing";
  src: string | null;
};

export type LoadRankingResponse = {
  rankingIds: string[];
  updatedAt: string | null;
};

export type SaveRankingResponse = {
  ok: true;
  updatedAt: string;
};
