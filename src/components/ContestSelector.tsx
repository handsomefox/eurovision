import type { Contest } from "../types";
import { t } from "../lib/i18n";
import type { Locale } from "../types";
import { ChevronDown } from "lucide-react";

type ContestSelectorProps = {
  contests: Contest[];
  activeContestId: string;
  locale: Locale;
  onChange: (contestId: string) => void;
};

export default function ContestSelector({ contests, activeContestId, locale, onChange }: ContestSelectorProps) {
  return (
    <label className="relative block">
      <span className="sr-only">{t(locale, "contest.choose")}</span>
      <select
        value={activeContestId}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-black/35 py-0 pl-4 pr-12 text-sm font-extrabold text-white outline-none focus:border-cyan-200/60 md:w-64"
      >
        {contests.map((contest) => (
          <option key={contest.id} value={contest.id} className="bg-slate-950 text-white">
            {contest.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
    </label>
  );
}
