import { ArrowDown, ArrowUp, ExternalLink, Music2 } from "lucide-react";
import type { FocusEvent } from "react";
import { t } from "../lib/i18n";
import type { RankComparison } from "../lib/rankingHelpers";
import { getTheme } from "../lib/themes";
import { songWikiUrl, wikiUrl } from "../lib/wiki";
import type { Entry, Locale, WikiImage } from "../types";
import Flag from "./Flag";
import Photo from "./Photo";

type RankingCardProps = {
  item: Entry;
  rank: number;
  image?: WikiImage;
  locale: Locale;
  comparison?: RankComparison;
  mode?: "personal" | "official";
  moveUp?: () => void;
  moveDown?: () => void;
  moveTo?: (targetIndex: number) => void;
  isFirst?: boolean;
  isLast?: boolean;
  total: number;
};

export default function RankingCard({
  item,
  rank,
  image,
  locale,
  comparison,
  mode = "personal",
  moveUp,
  moveDown,
  moveTo,
  isFirst = false,
  isLast = false,
  total
}: RankingCardProps) {
  const theme = getTheme(item);
  const isEditable = mode === "personal" && Boolean(moveUp && moveDown && moveTo);
  const comparisonTone =
    comparison?.status === "better"
      ? "bg-emerald-300/15 text-emerald-100 ring-emerald-200/20"
      : comparison?.status === "worse"
        ? "bg-rose-300/15 text-rose-100 ring-rose-200/20"
        : comparison?.status === "same"
          ? "bg-cyan-300/15 text-cyan-100 ring-cyan-200/20"
          : "bg-white/10 text-white/70 ring-white/10";
  const comparisonText = mode === "personal" && comparison ? formatComparison(comparison, locale) : null;

  function applyManualRank(event: FocusEvent<HTMLInputElement>) {
    if (!moveTo) return;
    const rawValue = event.currentTarget.value.trim();
    const parsedValue = Number.parseInt(rawValue, 10);

    if (!Number.isFinite(parsedValue)) {
      event.currentTarget.value = String(rank);
      return;
    }

    const clampedValue = Math.min(Math.max(parsedValue, 1), total);
    event.currentTarget.value = String(clampedValue);
    moveTo(clampedValue - 1);
  }

  return (
    <article
      style={{ background: `${theme.bg}, rgba(2, 6, 23, 0.44)` }}
      className={`group relative overflow-hidden rounded-3xl border shadow-2xl backdrop-blur-xl transition hover:border-white/25 ${
        rank === 1
          ? "border-amber-200/45 shadow-amber-300/10"
          : rank === 2
            ? "border-slate-100/35 shadow-slate-200/10"
            : rank === 3
              ? "border-orange-200/40 shadow-orange-300/10"
              : "border-white/10 shadow-black/20"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-slate-950/0" />
      <div
        className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${
          rank === 1
            ? "from-yellow-200 via-amber-300 to-yellow-600"
            : rank === 2
              ? "from-white via-slate-300 to-slate-500"
              : rank === 3
                ? "from-orange-200 via-orange-400 to-amber-700"
                : theme.stripe
        }`}
      />

      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 p-3 sm:flex sm:gap-4 sm:p-4">
        <Photo item={item} image={image} locale={locale} rank={rank} total={total} onRankInput={isEditable ? applyManualRank : undefined} />

        <div className="min-w-0 flex-1 py-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-white/75">
              {t(locale, "label.running")} #{String(item.order).padStart(2, "0")}
            </span>
            {item.resultRank !== undefined && item.resultPoints !== undefined && (
              <span className="rounded-full bg-amber-300/15 px-2.5 py-1 text-xs font-bold text-amber-100 ring-1 ring-amber-200/20">
                #{item.resultRank} - {item.resultPoints} pts
              </span>
            )}
            {comparisonText && (
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${comparisonTone}`}>{comparisonText}</span>
            )}
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-white/75 ring-1 ring-white/10">
              <Flag item={item} size="sm" />
              {item.country}
            </span>
          </div>

          <h2 className="truncate text-lg font-extrabold tracking-[-0.006em] text-white drop-shadow-sm sm:text-2xl">{item.artist}</h2>
          <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-white/78 sm:text-base">
            <Music2 className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.song}</span>
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href={songWikiUrl(item)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-cyan-300/10 px-2.5 py-1 text-xs font-semibold text-cyan-100 hover:bg-cyan-300/20"
            >
              <ExternalLink className="h-3 w-3" /> {t(locale, "actions.openSongWiki")}
            </a>
            <a
              href={wikiUrl(item)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/70 hover:bg-white/15 hover:text-white"
            >
              <ExternalLink className="h-3 w-3" /> {t(locale, "actions.openArtistWiki")}
            </a>
          </div>
        </div>

        {isEditable && (
          <div className="col-span-2 grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:flex-col sm:justify-center">
            <button
              onClick={moveUp}
              disabled={isFirst}
              className="flex h-10 w-full items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30 sm:w-10"
              aria-label="Move up"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              onClick={moveDown}
              disabled={isLast}
              className="flex h-10 w-full items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30 sm:w-10"
              aria-label="Move down"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function formatComparison(comparison: RankComparison, locale: Locale): string {
  if (comparison.status === "missing-official") return "";
  if (comparison.status === "unranked") return t(locale, "comparison.unranked");
  if (comparison.status === "same") return `${t(locale, "comparison.same")} (#${comparison.officialRank})`;

  const amount = Math.abs(comparison.delta);
  return `${amount} ${comparison.status === "better" ? t(locale, "comparison.better") : t(locale, "comparison.worse")}`;
}
