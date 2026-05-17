import type { Contest } from "../types";
import { t } from "../lib/i18n";
import type { Locale } from "../types";

type ContestSelectorProps = {
  contests: Contest[];
  activeContestId: string;
  locale: Locale;
  onChange: (contestId: string) => void;
};

export default function ContestSelector({ contests, activeContestId, locale, onChange }: ContestSelectorProps) {
  return (
    <label className="block">
      <span className="sr-only">{t(locale, "contest.choose")}</span>
      <select
        value={activeContestId}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-white/10 bg-black/35 px-4 text-sm font-extrabold text-white outline-none focus:border-cyan-200/60 md:w-64"
      >
        {contests.map((contest) => (
          <option key={contest.id} value={contest.id} className="bg-slate-950 text-white">
            {contest.label}
          </option>
        ))}
      </select>
    </label>
  );
}
