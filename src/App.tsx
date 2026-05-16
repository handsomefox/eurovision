import { useMemo, useState } from "react";
import KeyGate from "./components/KeyGate";
import Ranker from "./components/Ranker";
import { contests, getContestById, getDefaultContestId } from "./lib/contestModel";

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
  const activeContest = useMemo(() => getContestById(activeContestId) || contests[0], [activeContestId]);

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
    return <KeyGate onSubmit={submitKey} />;
  }

  return (
    <Ranker
      contest={activeContest}
      contests={contests}
      activeContestId={activeContest.id}
      userKey={userKey}
      onContestChange={changeContest}
      onForgetKey={forgetKey}
    />
  );
}
