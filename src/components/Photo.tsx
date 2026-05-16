import { useEffect, useState, type FocusEvent } from "react";
import type { Entry, WikiImage } from "../types";

type PhotoProps = {
  item: Entry;
  image?: WikiImage;
  compact?: boolean;
  rank?: number;
  total?: number;
  onRankInput?: (event: FocusEvent<HTMLInputElement>) => void;
  hideFlagOverlay?: boolean;
};

export default function Photo({ item, image, compact = false, rank, total, onRankInput, hideFlagOverlay = false }: PhotoProps) {
  const size = compact ? "h-16 w-16" : "h-24 w-24 sm:h-28 sm:w-28";
  const hasRankInput = typeof rank === "number" && typeof onRankInput === "function";
  const [imageBroken, setImageBroken] = useState(false);
  const imageSrc = image?.src ?? null;
  const shouldShowPhoto = Boolean(imageSrc && !imageBroken);

  useEffect(() => {
    setImageBroken(false);
  }, [imageSrc]);

  return (
    <div
      title={`${item.artist} - ${item.song}`}
      className={`relative block ${size} shrink-0 overflow-hidden rounded-2xl bg-white/10 text-left ring-1 ring-white/10`}
    >
      {shouldShowPhoto ? (
        <img
          src={imageSrc ?? undefined}
          alt={item.artist}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setImageBroken(true)}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-white/10 to-white/5 p-2 text-center">
          <img
            src={`https://flagcdn.com/w80/${item.code}.png`}
            alt={item.country}
            className="h-8 w-12 rounded-md object-cover shadow-lg ring-1 ring-white/20"
          />
          {!compact && <span className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-white/45">flag</span>}
        </div>
      )}

      {shouldShowPhoto && !hideFlagOverlay && (
        <div className="absolute bottom-2 left-2 flex items-center overflow-hidden rounded-full bg-black/60 backdrop-blur ring-1 ring-white/15">
          {hasRankInput && (
            <input
              key={`${item.id}-${rank}`}
              defaultValue={rank}
              inputMode="numeric"
              pattern="[0-9]*"
              min="1"
              max={total}
              onBlur={onRankInput}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              className="h-7 w-9 border-0 bg-white/12 text-center text-xs font-black leading-none text-white outline-none focus:bg-cyan-300/25"
              aria-label={`Move ${item.country} to position`}
            />
          )}
          <div className="flex h-7 items-center px-2">
            <img src={`https://flagcdn.com/w40/${item.code}.png`} alt={item.country} className="h-3 w-5 rounded-[2px] object-cover" />
          </div>
        </div>
      )}

      {!shouldShowPhoto && hasRankInput && (
        <input
          key={`${item.id}-${rank}`}
          defaultValue={rank}
          inputMode="numeric"
          pattern="[0-9]*"
          min="1"
          max={total}
          onBlur={onRankInput}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          className="absolute bottom-2 left-2 h-7 w-9 rounded-full border border-white/15 bg-black/60 text-center text-xs font-black leading-none text-white outline-none backdrop-blur focus:bg-cyan-300/25"
          aria-label={`Move ${item.country} to position`}
        />
      )}
    </div>
  );
}
