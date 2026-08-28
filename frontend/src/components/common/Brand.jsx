import { Goal } from "lucide-react";

const EMBLEM_SIZES = { sm: 28, md: 36, lg: 52 };
const ICON_SIZES = { sm: 15, md: 19, lg: 26 };
const WORDMARK_SIZES = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
};

/**
 * Shared SCgroup wordmark + emblem, used in the login screen, the desktop
 * sidebar and the Home header so the branding never drifts between them.
 */
export default function Brand({ size = "md", tagline = false, align = "left", className = "" }) {
  const emblem = EMBLEM_SIZES[size];
  const icon = ICON_SIZES[size];

  return (
    <div className={`flex items-center gap-2.5 ${align === "center" ? "flex-col text-center" : ""} ${className}`}>
      <span
        className="flex shrink-0 items-center justify-center rounded-full border border-gold-400/70 bg-pitch-800 text-gold-400"
        style={{ width: emblem, height: emblem }}
      >
        <Goal size={icon} strokeWidth={1.75} />
      </span>
      <div className={align === "center" ? "" : "leading-tight"}>
        <p className={`font-serif font-semibold tracking-wide text-gold-400 ${WORDMARK_SIZES[size]}`}>
          SCgroup
        </p>
        {tagline && (
          <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
            Fútbol profesional
          </p>
        )}
      </div>
    </div>
  );
}
