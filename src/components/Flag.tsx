import type { Entry } from "../types";

type FlagProps = {
  item: Pick<Entry, "code" | "country">;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-3 w-5 rounded-[2px]",
  md: "h-4 w-6 rounded-[3px]",
  lg: "h-8 w-12 rounded-md"
};

export default function Flag({ item, size = "md", className = "" }: FlagProps) {
  return (
    <img
      src={`https://flagcdn.com/w40/${item.code}.png`}
      srcSet={`https://flagcdn.com/w40/${item.code}.png 1x, https://flagcdn.com/w80/${item.code}.png 2x`}
      alt={item.country}
      loading="lazy"
      className={`${sizeClasses[size]} bg-white/10 object-cover ring-1 ring-white/15 ${className}`}
    />
  );
}
