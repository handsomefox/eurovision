import { Copy, Plus } from "lucide-react";
import { getTheme } from "../lib/themes";
import { songWikiUrl } from "../lib/wiki";
import type { Entry, WikiImage } from "../types";
import Photo from "./Photo";

type AddCardProps = {
  item: Entry;
  image?: WikiImage;
  add: () => void;
  copyLink: (url: string) => void;
};

export default function AddCard({ item, image, add, copyLink }: AddCardProps) {
  const theme = getTheme(item);

  return (
    <article
      style={{ background: `${theme.bg}, rgba(2, 6, 23, 0.43)` }}
      className="relative overflow-hidden rounded-3xl border border-white/10 p-3 backdrop-blur-xl transition hover:border-white/25"
    >
      <div className="pointer-events-none absolute inset-0 bg-slate-950/0" />
      <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${theme.stripe}`} />
      <div className="flex items-center gap-3">
        <Photo item={item} image={image} compact hideFlagOverlay />

        <div className="min-w-0 flex-1 py-0.5">
          <h3 className="truncate text-base font-extrabold tracking-[-0.004em] text-white drop-shadow-sm">{item.artist}</h3>
          <p className="mt-0.5 truncate text-sm font-semibold text-white/70">{item.song}</p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-black text-white/65">
              #{String(item.order).padStart(2, "0")}
            </span>
            <span className="inline-flex h-6 items-center rounded-full bg-white/10 px-2 ring-1 ring-white/10" title={item.country}>
              <img src={`https://flagcdn.com/w40/${item.code}.png`} alt={item.country} className="h-3.5 w-5 rounded-[2px] object-cover" />
            </span>
            <button
              type="button"
              onClick={() => copyLink(songWikiUrl(item))}
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold text-cyan-100/80 hover:bg-white/15"
            >
              <Copy className="h-3 w-3" /> copy wiki
            </button>
          </div>
        </div>

        <button
          onClick={add}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950 transition hover:bg-cyan-200"
          aria-label={`Add ${item.country}`}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </article>
  );
}
