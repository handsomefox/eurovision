import { Languages } from "lucide-react";
import { t } from "../lib/i18n";
import type { Locale } from "../types";

type LocaleSwitcherProps = {
  locale: Locale;
  onChange: (locale: Locale) => void;
};

export default function LocaleSwitcher({ locale, onChange }: LocaleSwitcherProps) {
  return (
    <div className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-black/25 p-1 text-sm font-extrabold ring-1 ring-white/10 sm:w-auto">
      <Languages className="ml-2 h-4 w-4 shrink-0 text-white/55" />
      {(["en", "ru"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`h-10 rounded-xl px-3 transition ${
            locale === option ? "bg-cyan-300 text-slate-950" : "text-white/65 hover:bg-white/10 hover:text-white"
          }`}
          aria-label={option === "en" ? t(locale, "locale.english") : t(locale, "locale.russian")}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
