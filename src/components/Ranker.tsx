import { Copy, RotateCcw, Search, SkipForward, Trophy, Upload, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { copyToClipboard } from "../lib/clipboard";
import { parseRankingImport } from "../lib/importRanking";
import { t } from "../lib/i18n";
import {
  filterAvailableEntries,
  formatRankingForClipboard,
  getRankComparison,
  moveItem,
  sortByOfficialResult
} from "../lib/rankingHelpers";
import { useSavedRanking } from "../lib/useSavedRanking";
import { useWikiImages } from "../lib/wiki";
import type { Contest, Entry, Locale } from "../types";
import AddCard from "./AddCard";
import ContestSelector from "./ContestSelector";
import Flag from "./Flag";
import LocaleSwitcher from "./LocaleSwitcher";
import RankingCard from "./RankingCard";

type ViewMode = "compare" | "ranking" | "results";

type RankerProps = {
  contest: Contest;
  contests: Contest[];
  activeContestId: string;
  locale: Locale;
  userKey: string;
  onContestChange: (contestId: string) => void;
  onLocaleChange: (locale: Locale) => void;
  onForgetKey: () => void;
};

export default function Ranker({
  contest,
  contests,
  activeContestId,
  locale,
  userKey,
  onContestChange,
  onLocaleChange,
  onForgetKey
}: RankerProps) {
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("ranking");

  const entries = contest.entries;
  const byId = useMemo(() => new Map(entries.map((item) => [item.id, item])), [entries]);
  const images = useWikiImages(entries);
  const { rankingIds, setRankingIds, loadStatus, saveStatus } = useSavedRanking({ byId, contestId: contest.id, userKey });
  const hasOfficialResults = entries.every((entry) => entry.resultRank !== undefined && entry.resultPoints !== undefined);
  const isEditableMode = viewMode === "ranking";

  useEffect(() => {
    setQuery("");
    setCopied(false);
    setIsImportOpen(false);
    setImportText("");
    setViewMode("ranking");
  }, [contest.id, hasOfficialResults]);

  const rankedItems = useMemo(
    () => rankingIds.map((id) => byId.get(id)).filter((item): item is Entry => Boolean(item)),
    [byId, rankingIds]
  );
  const rankedIdSet = useMemo(() => new Set(rankingIds), [rankingIds]);
  const resultItems = useMemo(() => sortByOfficialResult(entries), [entries]);
  const personalIndexById = useMemo(() => new Map(rankingIds.map((id, index) => [id, index])), [rankingIds]);

  const availableItems = useMemo(() => {
    return filterAvailableEntries(entries, rankedIdSet, query);
  }, [entries, rankedIdSet, query]);

  const nextByRunningOrder = useMemo(() => entries.find((item) => !rankedIdSet.has(item.id)), [entries, rankedIdSet]);
  const currentTop = rankedItems[0];
  const importPreview = useMemo(() => parseRankingImport(importText, entries), [entries, importText]);

  function add(id: string) {
    setRankingIds((current) => (current.includes(id) ? current : [...current, id]));
  }

  function addNext() {
    if (nextByRunningOrder) add(nextByRunningOrder.id);
  }

  function move(index: number, direction: number) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= rankingIds.length) return;
    setRankingIds((current) => moveItem(current, index, nextIndex));
  }

  function moveTo(index: number, targetIndex: number) {
    const clampedIndex = Math.min(Math.max(targetIndex, 0), rankingIds.length - 1);
    if (index === clampedIndex) return;
    setRankingIds((current) => moveItem(current, index, clampedIndex));
  }

  function reset() {
    if (rankingIds.length && !window.confirm(t(locale, "confirm.clear"))) return;
    setRankingIds([]);
    setQuery("");
    setCopied(false);
  }

  function applyImport() {
    if (!importPreview.ids.length) return;

    setRankingIds(importPreview.ids);
    setQuery("");
    setIsImportOpen(false);
  }

  async function copyRanking() {
    await copyToClipboard(formatRankingForClipboard(rankedItems, locale));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const foundPhotos = entries.filter((item) => images[item.id]?.status === "found").length;
  const checkedPhotos = entries.filter((item) => images[item.id]?.status && images[item.id]?.status !== "loading").length;
  const progressPercent = entries.length ? Math.round((rankingIds.length / entries.length) * 100) : 0;
  const saveLabel =
    loadStatus === "loading"
      ? t(locale, "save.loading")
      : loadStatus === "error"
        ? t(locale, "save.loadError")
        : saveStatus === "saving"
          ? t(locale, "save.saving")
          : saveStatus === "error"
            ? t(locale, "save.saveError")
            : saveStatus === "saved"
              ? t(locale, "save.saved")
              : t(locale, "save.ready");

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-slate-950 bg-[linear-gradient(135deg,#020617_0%,#111827_52%,#042f2e_100%)] text-white">
      <section className="relative mx-auto max-w-7xl px-3 py-3 sm:px-6 sm:py-6 lg:px-8">
        <header className="mb-4 rounded-3xl border border-white/10 bg-white/8 p-3 shadow-2xl shadow-black/20 backdrop-blur-xl sm:mb-5 sm:rounded-[2rem] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-full bg-fuchsia-400/15 px-3 py-1.5 text-sm font-bold text-fuchsia-100 ring-1 ring-fuchsia-300/20">
                <Trophy className="h-4 w-4" />
                <span className="truncate">{contest.title}</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-[-0.012em] sm:text-5xl">{t(locale, "header.headline")}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">{contest.description}</p>
            </div>

            <div className="min-w-0 rounded-3xl bg-black/25 p-3 ring-1 ring-white/10 sm:p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-white/45">{t(locale, "summary.heading")}</div>
              <div className="mt-1 flex items-center gap-3">
                <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                  {currentTop ? <Flag item={currentTop} size="md" /> : <Trophy className="h-5 w-5 text-white/55" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-black leading-tight">{currentTop ? currentTop.artist : t(locale, "summary.empty")}</div>
                  <div className="text-sm text-white/60">
                    {rankingIds.length}/{entries.length} {t(locale, "progress.added")} · {t(locale, "progress.photos")} {foundPhotos}/
                    {checkedPhotos || entries.length}
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-fuchsia-300 to-cyan-300 transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:mt-5 sm:gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
            <ContestSelector contests={contests} activeContestId={activeContestId} locale={locale} onChange={onContestChange} />
            <div className="flex h-12 items-center justify-center rounded-2xl bg-black/25 px-4 text-sm font-bold text-white/65 ring-1 ring-white/10">
              {contest.badge} · {saveLabel}
            </div>
            <LocaleSwitcher locale={locale} onChange={onLocaleChange} />
            <button
              onClick={onForgetKey}
              className="h-12 rounded-2xl bg-white/10 px-4 text-sm font-extrabold text-white ring-1 ring-white/10 transition hover:bg-white/15"
            >
              {t(locale, "actions.changeKey")}
            </button>
          </div>

          {contest.status === "placeholder" && (
            <div className="mt-5 rounded-2xl border border-amber-200/25 bg-amber-300/10 px-4 py-3 text-sm font-semibold leading-6 text-amber-50">
              {t(locale, "placeholder.notice")}
            </div>
          )}

          {hasOfficialResults && (
            <div className="mt-5 grid grid-cols-3 rounded-2xl bg-black/25 p-1 ring-1 ring-white/10 sm:max-w-xl">
              <button
                type="button"
                onClick={() => setViewMode("ranking")}
                className={`h-10 rounded-xl text-sm font-extrabold transition ${
                  viewMode === "ranking" ? "bg-cyan-300 text-slate-950" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {t(locale, "mode.ranking")}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("compare")}
                className={`h-10 rounded-xl text-sm font-extrabold transition ${
                  viewMode === "compare" ? "bg-emerald-300 text-slate-950" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {t(locale, "mode.compare")}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("results")}
                className={`h-10 rounded-xl text-sm font-extrabold transition ${
                  viewMode === "results" ? "bg-amber-300 text-slate-950" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {t(locale, "mode.results")}
              </button>
            </div>
          )}

          {isEditableMode && nextByRunningOrder && (
            <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
              <span className="font-black text-white/45">{t(locale, "next.label")}</span>
              <span className="font-black text-white">
                #{String(nextByRunningOrder.order).padStart(2, "0")} {nextByRunningOrder.country}
              </span>
              <span className="text-white/45">·</span>
              <span className="font-semibold text-fuchsia-100">
                {nextByRunningOrder.artist} - {nextByRunningOrder.song}
              </span>
            </div>
          )}

          {isEditableMode && (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3 md:grid-cols-[1fr_auto_auto_auto_auto]">
              <label className="relative col-span-2 block md:col-span-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={
                    locale === "ru" ? "Найти страну, артиста или песню в списке для добавления" : "Find a country, artist, or song to add"
                  }
                  className="h-12 w-full rounded-2xl border border-white/10 bg-black/25 pl-11 pr-11 text-sm font-semibold text-white outline-none placeholder:text-white/35 focus:border-cyan-200/60"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/55 hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </label>

              <button
                onClick={addNext}
                disabled={!nextByRunningOrder || loadStatus === "loading"}
                className="col-span-2 flex h-12 items-center justify-center gap-2 rounded-2xl bg-fuchsia-300 px-4 text-sm font-extrabold leading-none text-slate-950 transition hover:bg-fuchsia-200 disabled:cursor-not-allowed disabled:opacity-40 md:col-span-1"
              >
                <SkipForward className="h-4 w-4 shrink-0" />
                <span className="translate-y-[0.5px]">{t(locale, "actions.addNext")}</span>
              </button>

              <button
                onClick={copyRanking}
                className="col-span-2 flex h-12 min-w-0 items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-3 text-sm font-extrabold leading-none text-slate-950 transition hover:bg-cyan-200 sm:px-4 md:col-span-1"
              >
                <Copy className="h-4 w-4 shrink-0" />
                <span className="translate-y-[0.5px]">{copied ? t(locale, "actions.topCopied") : t(locale, "actions.copyTop")}</span>
              </button>

              <button
                onClick={() => setIsImportOpen(true)}
                className="flex h-12 min-w-0 items-center justify-center gap-2 rounded-2xl bg-white/10 px-3 text-sm font-extrabold leading-none text-white ring-1 ring-white/10 transition hover:bg-white/15 sm:px-4"
              >
                <Upload className="h-4 w-4 shrink-0" />
                <span className="translate-y-[0.5px]">{t(locale, "actions.import")}</span>
              </button>

              <button
                onClick={reset}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 text-sm font-extrabold leading-none text-white ring-1 ring-white/10 transition hover:bg-white/15"
              >
                <RotateCcw className="h-4 w-4 shrink-0" />
                <span className="translate-y-[0.5px]">{t(locale, "actions.clear")}</span>
              </button>
            </div>
          )}
        </header>

        {viewMode === "compare" && hasOfficialResults ? (
          <section className="grid gap-5 lg:grid-cols-2">
            <div>
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-xl font-extrabold tracking-[-0.006em]">{t(locale, "ranking.heading")}</h2>
                <span className="text-sm font-bold text-white/45">
                  {rankedItems.length ? `${rankedItems.length} ${t(locale, "ranking.count")}` : t(locale, "ranking.pending")}
                </span>
              </div>

              {loadStatus === "loading" ? (
                <div className="rounded-[2rem] border border-white/10 bg-white/6 p-8 text-center text-sm font-semibold text-white/60 backdrop-blur-xl">
                  {t(locale, "save.loading")}...
                </div>
              ) : rankedItems.length ? (
                <div className="space-y-3">
                  {rankedItems.map((item, index) => (
                    <RankingCard
                      key={item.id}
                      item={item}
                      rank={index + 1}
                      image={images[item.id]}
                      locale={locale}
                      comparison={getRankComparison(item, index)}
                      total={rankedItems.length}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/6 p-8 text-center backdrop-blur-xl">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-3xl">🏆</div>
                  <h3 className="text-2xl font-extrabold tracking-[-0.006em]">{t(locale, "empty.title")}</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/60">{t(locale, "empty.body")}</p>
                </div>
              )}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-xl font-extrabold tracking-[-0.006em]">{t(locale, "results.heading")}</h2>
                <span className="text-sm font-bold text-white/45">
                  {resultItems.length} {t(locale, "results.finalists")}
                </span>
              </div>

              <div className="space-y-3">
                {resultItems.map((item, index) => (
                  <RankingCard
                    key={item.id}
                    item={item}
                    rank={item.resultRank ?? index + 1}
                    image={images[item.id]}
                    locale={locale}
                    comparison={getRankComparison(item, personalIndexById.get(item.id))}
                    mode="official"
                    total={entries.length}
                  />
                ))}
              </div>
            </div>
          </section>
        ) : viewMode === "results" && hasOfficialResults ? (
          <section>
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-xl font-extrabold tracking-[-0.006em]">{t(locale, "results.heading")}</h2>
              <span className="text-sm font-bold text-white/45">
                {resultItems.length} {t(locale, "results.finalists")}
              </span>
            </div>

            <div className="space-y-3">
              {resultItems.map((item, index) => (
                <RankingCard
                  key={item.id}
                  item={item}
                  rank={item.resultRank ?? index + 1}
                  image={images[item.id]}
                  locale={locale}
                  comparison={getRankComparison(item, personalIndexById.get(item.id))}
                  mode="official"
                  total={entries.length}
                />
              ))}
            </div>
          </section>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.85fr)]">
            <section>
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-xl font-extrabold tracking-[-0.006em]">{t(locale, "ranking.heading")}</h2>
                <span className="text-sm font-bold text-white/45">
                  {rankedItems.length ? `${rankedItems.length} ${t(locale, "ranking.count")}` : t(locale, "ranking.pending")}
                </span>
              </div>

              {loadStatus === "loading" ? (
                <div className="rounded-[2rem] border border-white/10 bg-white/6 p-8 text-center text-sm font-semibold text-white/60 backdrop-blur-xl">
                  {t(locale, "save.loading")}...
                </div>
              ) : rankedItems.length ? (
                <div className="space-y-3">
                  {rankedItems.map((item, index) => (
                    <RankingCard
                      key={item.id}
                      item={item}
                      rank={index + 1}
                      image={images[item.id]}
                      locale={locale}
                      comparison={hasOfficialResults ? getRankComparison(item, index) : undefined}
                      moveUp={() => move(index, -1)}
                      moveDown={() => move(index, 1)}
                      moveTo={(targetIndex) => moveTo(index, targetIndex)}
                      isFirst={index === 0}
                      isLast={index === rankedItems.length - 1}
                      total={rankedItems.length}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/6 p-8 text-center backdrop-blur-xl">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-3xl">🏆</div>
                  <h3 className="text-2xl font-extrabold tracking-[-0.006em]">{t(locale, "empty.title")}</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/60">{t(locale, "empty.body")}</p>
                </div>
              )}
            </section>

            <aside>
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-xl font-extrabold tracking-[-0.006em]">{t(locale, "add.heading")}</h2>
                <span className="text-sm font-bold text-white/45">
                  {availableItems.length} {t(locale, "add.remaining")}
                </span>
              </div>

              <div className="space-y-3 lg:max-h-[72vh] lg:overflow-y-auto lg:pr-1">
                {availableItems.map((item) => (
                  <AddCard key={item.id} item={item} image={images[item.id]} locale={locale} add={() => add(item.id)} />
                ))}
                {!availableItems.length && (
                  <div className="rounded-3xl border border-white/10 bg-white/8 p-6 text-center text-sm font-semibold text-white/55 backdrop-blur-xl">
                    {t(locale, "add.empty")}
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}

        {isImportOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/75 px-2 py-2 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6">
            <section className="max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] border border-white/10 bg-slate-950 p-4 shadow-2xl shadow-black/40 sm:rounded-[2rem] sm:p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold tracking-[-0.006em]">{t(locale, "import.heading")}</h2>
                  <p className="mt-1 text-sm leading-6 text-white/60">{t(locale, "import.description")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/15"
                  aria-label={t(locale, "actions.closeImport")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <textarea
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
                className="h-[42dvh] min-h-56 w-full resize-y rounded-2xl border border-white/10 bg-black/30 p-3 text-sm font-semibold leading-6 text-white outline-none placeholder:text-white/35 focus:border-cyan-200/60 sm:min-h-72"
                placeholder={t(locale, "import.example")}
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-white/60">
                <span>
                  {t(locale, "import.found")}: {importPreview.ids.length}/{entries.length}
                  {importPreview.unmatchedLines.length ? ` · ${t(locale, "import.unmatched")}: ${importPreview.unmatchedLines.length}` : ""}
                </span>
                {importPreview.unmatchedLines.length > 0 && (
                  <span className="max-w-full truncate text-amber-100">
                    {t(locale, "import.warning")}: {importPreview.unmatchedLines.slice(0, 2).join(" · ")}
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="h-11 rounded-2xl bg-white/10 px-4 text-sm font-extrabold text-white ring-1 ring-white/10 transition hover:bg-white/15"
                >
                  {t(locale, "actions.cancel")}
                </button>
                <button
                  type="button"
                  onClick={applyImport}
                  disabled={!importPreview.ids.length}
                  className="h-11 rounded-2xl bg-cyan-300 px-4 text-sm font-extrabold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t(locale, "actions.replaceRanking")}
                </button>
              </div>
            </section>
          </div>
        )}

        <footer className="mt-5 rounded-3xl border border-white/10 bg-white/8 p-4 text-sm leading-6 text-white/60 backdrop-blur-xl">
          {t(locale, "footer")}
        </footer>
      </section>
    </main>
  );
}
