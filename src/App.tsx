import { useEffect, useMemo, useState } from "react";
import KeyGate from "./components/KeyGate";
import Ranker from "./components/Ranker";
import { contests, getContestById, getDefaultContestId } from "./lib/contestModel";
import { reloadForServiceWorkerUpdate, subscribeToServiceWorkerUpdates } from "./lib/serviceWorker";

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
  const [updateReady, setUpdateReady] = useState(false);
  const activeContest = useMemo(() => getContestById(activeContestId) || contests[0], [activeContestId]);

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

  if (!userKey) {
    return (
      <>
        <KeyGate onSubmit={submitKey} />
        {updateReady && <UpdatePrompt />}
      </>
    );
  }

  return (
    <>
      <Ranker
        contest={activeContest}
        contests={contests}
        activeContestId={activeContest.id}
        userKey={userKey}
        onContestChange={changeContest}
        onForgetKey={forgetKey}
      />
      {updateReady && <UpdatePrompt />}
    </>
  );
}

function UpdatePrompt() {
  return (
    <div className="fixed bottom-3 left-3 right-3 z-50 rounded-3xl border border-white/10 bg-slate-950/95 p-3 text-white shadow-2xl shadow-black/40 backdrop-blur sm:left-auto sm:w-80">
      <div className="text-sm font-extrabold">Новая версия готова</div>
      <div className="mt-1 text-xs leading-5 text-white/60">Обнови приложение, чтобы получить последние изменения.</div>
      <button
        type="button"
        onClick={() => void reloadForServiceWorkerUpdate()}
        className="mt-3 h-10 w-full rounded-2xl bg-cyan-300 px-4 text-sm font-extrabold text-slate-950 transition hover:bg-cyan-200"
      >
        Обновить
      </button>
    </div>
  );
}
