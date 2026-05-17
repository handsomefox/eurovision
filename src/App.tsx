import { useEffect, useMemo, useState } from "react";
import KeyGate from "./components/KeyGate";
import Ranker from "./components/Ranker";
import { contests, getContestById, getDefaultContestId } from "./lib/contestModel";
import { getInitialLocale, getLocalizedContest, LOCALE_STORAGE_KEY, t } from "./lib/i18n";
import { reloadForServiceWorkerUpdate, subscribeToServiceWorkerUpdates } from "./lib/serviceWorker";
import type { Locale } from "./types";

const USER_KEY_STORAGE = "eurovision-ranker-user-key";
const CONTEST_STORAGE = "eurovision-ranker-contest-id";

function getInitialContestId(): string {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("contest");
  if (fromUrl && getContestById(fromUrl)) return fromUrl;

  const fromStorage = localStorage.getItem(CONTEST_STORAGE);
  if (fromStorage && getContestById(fromStorage)) return fromStorage;

  return getDefaultContestId();
}

export default function App() {
  const [userKey, setUserKey] = useState(() => localStorage.getItem(USER_KEY_STORAGE) || "");
  const [activeContestId, setActiveContestId] = useState(getInitialContestId);
  const [locale, setLocale] = useState(getInitialLocale);
  const [updateReady, setUpdateReady] = useState(false);
  const activeContest = useMemo(() => getContestById(activeContestId) || contests[0], [activeContestId]);
  const localizedContest = useMemo(() => getLocalizedContest(activeContest, locale), [activeContest, locale]);
  const localizedContests = useMemo(() => contests.map((contest) => getLocalizedContest(contest, locale)), [locale]);

  useEffect(() => subscribeToServiceWorkerUpdates(() => setUpdateReady(true)), []);

  function submitKey(nextKey: string) {
    localStorage.setItem(USER_KEY_STORAGE, nextKey);
    setUserKey(nextKey);
  }

  function changeContest(nextContestId: string) {
    const nextContest = getContestById(nextContestId);
    if (!nextContest) return;

    localStorage.setItem(CONTEST_STORAGE, nextContest.id);
    setActiveContestId(nextContest.id);

    const url = new URL(window.location.href);
    url.searchParams.set("contest", nextContest.id);
    window.history.replaceState({}, "", url);
  }

  function forgetKey() {
    localStorage.removeItem(USER_KEY_STORAGE);
    setUserKey("");
  }

  function changeLocale(nextLocale: Locale) {
    localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    setLocale(nextLocale);
  }

  if (!userKey) {
    return (
      <>
        <KeyGate locale={locale} onLocaleChange={changeLocale} onSubmit={submitKey} />
        {updateReady && <UpdatePrompt locale={locale} />}
      </>
    );
  }

  return (
    <>
      <Ranker
        contest={localizedContest}
        contests={localizedContests}
        activeContestId={activeContest.id}
        locale={locale}
        userKey={userKey}
        onContestChange={changeContest}
        onLocaleChange={changeLocale}
        onForgetKey={forgetKey}
      />
      {updateReady && <UpdatePrompt locale={locale} />}
    </>
  );
}

function UpdatePrompt({ locale }: { locale: Locale }) {
  return (
    <div className="fixed bottom-3 left-3 right-3 z-50 rounded-3xl border border-white/10 bg-slate-950/95 p-3 text-white shadow-2xl shadow-black/40 backdrop-blur sm:left-auto sm:w-80">
      <div className="text-sm font-extrabold">{t(locale, "update.heading")}</div>
      <div className="mt-1 text-xs leading-5 text-white/60">{t(locale, "update.body")}</div>
      <button
        type="button"
        onClick={() => void reloadForServiceWorkerUpdate()}
        className="mt-3 h-10 w-full rounded-2xl bg-cyan-300 px-4 text-sm font-extrabold text-slate-950 transition hover:bg-cyan-200"
      >
        {t(locale, "actions.refresh")}
      </button>
    </div>
  );
}
