import { Copy, RotateCcw, Search, SkipForward, Trophy, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadRanking, saveRanking } from "../lib/api";
import { copyToClipboard } from "../lib/clipboard";
import { normalize, useWikiImages } from "../lib/wiki";
import type { Contest, Entry } from "../types";
import AddCard from "./AddCard";
import ContestSelector from "./ContestSelector";
import RankingCard from "./RankingCard";

type LoadStatus = "loading" | "ready" | "error";
type SaveStatus = "idle" | "saving" | "saved" | "error";

type RankerProps = {
  contest: Contest;
  contests: Contest[];
  activeContestId: string;
  userKey: string;
  onContestChange: (contestId: string) => void;
  onForgetKey: () => void;
};

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  const copy = [...items];
  const [item] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, item);
  return copy;
}

function uniqueKnownIds(ids: string[], byId: Map<string, Entry>): string[] {
  const seen = new Set();
  return ids.filter((id) => {
    if (!byId.has(id) || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export default function Ranker({ contest, contests, activeContestId, userKey, onContestChange, onForgetKey }: RankerProps) {
  const [rankingIds, setRankingIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const lastSavedJson = useRef("[]");
  const saveTimer = useRef<number | null>(null);

  const entries = contest.entries;
  const byId = useMemo(() => new Map(entries.map((item) => [item.id, item])), [entries]);
  const images = useWikiImages(entries);

  useEffect(() => {
    setQuery("");
    setCopied(false);
    setCopiedLink(false);
    setRankingIds([]);
    setLoadStatus("loading");
    setSaveStatus("idle");

    let cancelled = false;

    async function run() {
      try {
        const result = await loadRanking({ key: userKey, contestId: contest.id });
        if (cancelled) return;

        const nextRankingIds = uniqueKnownIds(Array.isArray(result.rankingIds) ? result.rankingIds : [], byId);
        setRankingIds(nextRankingIds);
        lastSavedJson.current = JSON.stringify(nextRankingIds);
        setLoadStatus("ready");
      } catch {
        if (cancelled) return;
        setRankingIds([]);
        lastSavedJson.current = "[]";
        setLoadStatus("error");
      }
    }

    run();
    return () => {
      cancelled = true;
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [byId, contest.id, userKey]);

  useEffect(() => {
    if (loadStatus !== "ready") return;

    const nextJson = JSON.stringify(rankingIds);
    if (nextJson === lastSavedJson.current) return;

    setSaveStatus("saving");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);

    saveTimer.current = window.setTimeout(async () => {
      try {
        const result = await saveRanking({ key: userKey, contestId: contest.id, rankingIds });
        lastSavedJson.current = nextJson;
        setSaveStatus(result.updatedAt ? "saved" : "saved");
      } catch {
        setSaveStatus("error");
      }
    }, 450);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [contest.id, loadStatus, rankingIds, userKey]);

  const rankedItems = useMemo(
    () => rankingIds.map((id) => byId.get(id)).filter((item): item is Entry => Boolean(item)),
    [byId, rankingIds]
  );
  const rankedIdSet = useMemo(() => new Set(rankingIds), [rankingIds]);

  const availableItems = useMemo(() => {
    const q = normalize(query.trim());
    return entries
      .filter((item) => !rankedIdSet.has(item.id))
      .filter((item) => !q || normalize(`${item.country} ${item.artist} ${item.song}`).includes(q));
  }, [entries, rankedIdSet, query]);

  const nextByRunningOrder = useMemo(() => entries.find((item) => !rankedIdSet.has(item.id)), [entries, rankedIdSet]);
  const currentTop = rankedItems[0];

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
    if (rankingIds.length && !window.confirm("Очистить весь рейтинг?")) return;
    setRankingIds([]);
    setQuery("");
    setCopied(false);
    setCopiedLink(false);
  }

  async function copyLink(url: string) {
    await copyToClipboard(url);
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 1600);
  }

  async function copyRanking() {
    const lines = rankedItems.map((item, index) => `${index + 1}. ${item.flag} ${item.country}: ${item.artist} - ${item.song}`);
    const text = lines.length ? lines.join(String.fromCharCode(10)) : "Пока никого нет в рейтинге.";

    await copyToClipboard(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const foundPhotos = entries.filter((item) => images[item.id]?.status === "found").length;
  const checkedPhotos = entries.filter((item) => images[item.id]?.status && images[item.id]?.status !== "loading").length;
  const progressPercent = entries.length ? Math.round((rankingIds.length / entries.length) * 100) : 0;
  const saveLabel =
    loadStatus === "loading"
      ? "loading"
      : loadStatus === "error"
        ? "load error"
        : saveStatus === "saving"
          ? "saving"
          : saveStatus === "error"
            ? "save error"
            : saveStatus === "saved"
              ? "saved"
              : "ready";

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 bg-[linear-gradient(135deg,#020617_0%,#111827_52%,#042f2e_100%)] text-white">
      <section className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-5 rounded-[2rem] border border-white/10 bg-white/8 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-fuchsia-400/15 px-3 py-1.5 text-sm font-bold text-fuchsia-100 ring-1 ring-fuchsia-300/20">
                <Trophy className="h-4 w-4" />
                {contest.title}
              </div>
              <h1 className="text-3xl font-extrabold tracking-[-0.012em] sm:text-5xl">Собирай рейтинг по ходу шоу</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">{contest.description}</p>
            </div>

            <div className="rounded-3xl bg-black/25 p-4 ring-1 ring-white/10">
              <div className="text-xs font-bold uppercase tracking-widest text-white/45">Сейчас в рейтинге</div>
              <div className="mt-1 flex items-center gap-3">
                <span className="text-3xl">{currentTop ? currentTop.flag : "🎤"}</span>
                <div>
                  <div className="font-black leading-tight">{currentTop ? currentTop.artist : "Пока пусто"}</div>
                  <div className="text-sm text-white/60">
                    {rankingIds.length}/{entries.length} добавлено · фото {foundPhotos}/{checkedPhotos || entries.length}
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

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
            <ContestSelector contests={contests} activeContestId={activeContestId} onChange={onContestChange} />
            <div className="flex h-12 items-center justify-center rounded-2xl bg-black/25 px-4 text-sm font-bold text-white/65 ring-1 ring-white/10">
              {contest.badge} · {saveLabel}
            </div>
            <button
              onClick={onForgetKey}
              className="h-12 rounded-2xl bg-white/10 px-4 text-sm font-extrabold text-white ring-1 ring-white/10 transition hover:bg-white/15"
            >
              Change key
            </button>
          </div>

          {contest.status === "placeholder" && (
            <div className="mt-5 rounded-2xl border border-amber-200/25 bg-amber-300/10 px-4 py-3 text-sm font-semibold leading-6 text-amber-50">
              Это placeholder-конкурс: данные участников будут обновляться в JSON по мере появления.
            </div>
          )}

          {nextByRunningOrder && (
            <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
              <span className="font-black text-white/45">Следующий по running order:</span>
              <span className="font-black text-white">
                #{String(nextByRunningOrder.order).padStart(2, "0")} {nextByRunningOrder.country}
              </span>
              <span className="text-white/45">·</span>
              <span className="font-semibold text-fuchsia-100">
                {nextByRunningOrder.artist} - {nextByRunningOrder.song}
              </span>
            </div>
          )}

          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Найти страну, артиста или песню в списке для добавления"
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
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-fuchsia-300 px-4 text-sm font-extrabold leading-none text-slate-950 transition hover:bg-fuchsia-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <SkipForward className="h-4 w-4 shrink-0" />
              <span className="translate-y-[0.5px]">Добавить следующего</span>
            </button>

            <button
              onClick={copyRanking}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 text-sm font-extrabold leading-none text-slate-950 transition hover:bg-cyan-200"
            >
              <Copy className="h-4 w-4 shrink-0" />
              <span className="translate-y-[0.5px]">
                {copied ? "Топ скопирован" : copiedLink ? "Ссылка скопирована" : "Скопировать топ"}
              </span>
            </button>

            <button
              onClick={reset}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 text-sm font-extrabold leading-none text-white ring-1 ring-white/10 transition hover:bg-white/15"
            >
              <RotateCcw className="h-4 w-4 shrink-0" />
              <span className="translate-y-[0.5px]">Очистить</span>
            </button>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.85fr)]">
          <section>
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-xl font-extrabold tracking-[-0.006em]">Твой рейтинг</h2>
              <span className="text-sm font-bold text-white/45">
                {rankedItems.length ? `${rankedItems.length} в топе` : "ждёт первых оценок"}
              </span>
            </div>

            {loadStatus === "loading" ? (
              <div className="rounded-[2rem] border border-white/10 bg-white/6 p-8 text-center text-sm font-semibold text-white/60 backdrop-blur-xl">
                Загружаю рейтинг...
              </div>
            ) : rankedItems.length ? (
              <div className="space-y-3">
                {rankedItems.map((item, index) => (
                  <RankingCard
                    key={item.id}
                    item={item}
                    rank={index + 1}
                    image={images[item.id]}
                    moveUp={() => move(index, -1)}
                    moveDown={() => move(index, 1)}
                    moveTo={(targetIndex) => moveTo(index, targetIndex)}
                    isFirst={index === 0}
                    isLast={index === rankedItems.length - 1}
                    total={rankedItems.length}
                    copyLink={copyLink}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/6 p-8 text-center backdrop-blur-xl">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-3xl">🏆</div>
                <h3 className="text-2xl font-extrabold tracking-[-0.006em]">Рейтинг пустой</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/60">
                  Добавляй участников плюсиком справа или кнопкой “Добавить следующего”, когда они выступают.
                </p>
              </div>
            )}
          </section>

          <aside>
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-xl font-extrabold tracking-[-0.006em]">Добавить участника</h2>
              <span className="text-sm font-bold text-white/45">{availableItems.length} осталось</span>
            </div>

            <div className="max-h-[72vh] space-y-3 overflow-y-auto pr-1">
              {availableItems.map((item) => (
                <AddCard key={item.id} item={item} image={images[item.id]} add={() => add(item.id)} copyLink={copyLink} />
              ))}
              {!availableItems.length && (
                <div className="rounded-3xl border border-white/10 bg-white/8 p-6 text-center text-sm font-semibold text-white/55 backdrop-blur-xl">
                  Все подходящие участники уже в рейтинге.
                </div>
              )}
            </div>
          </aside>
        </div>

        <footer className="mt-5 rounded-3xl border border-white/10 bg-white/8 p-4 text-sm leading-6 text-white/60 backdrop-blur-xl">
          Рейтинг сохраняется на сервере для выбранного ключа и конкурса. Для wiki есть copy-кнопки: можно скопировать ссылку и открыть
          вручную. Если фото не нашлось или оно сомнительное, показывается флаг-заглушка.
        </footer>
      </section>
    </main>
  );
}
