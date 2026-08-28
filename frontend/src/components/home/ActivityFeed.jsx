import { Link } from "react-router-dom";
import { UserPlus, UserCog, Landmark, MessageSquare } from "lucide-react";
import { formatActivityTimestamp } from "../../utils/format";

const KIND_META = {
  person_created: { icon: UserPlus, color: "#d4af37" },
  person_updated: { icon: UserCog, color: "#6f9bb8" },
  club_created: { icon: Landmark, color: "#e8e6df" },
  club_updated: { icon: Landmark, color: "#e8e6df" },
  interaction: { icon: MessageSquare, color: "#4c9a8c" },
};

function targetHref(target) {
  return target.type === "club" ? `/clubes/${target.id}` : `/contactos/${target.id}`;
}

export default function ActivityFeed({ activity }) {
  if (!activity?.length) return null;

  return (
    <div className="divide-y divide-pitch-700 overflow-hidden rounded-2xl border border-pitch-600/70 bg-pitch-850">
      {activity.map((event, index) => {
        const meta = KIND_META[event.kind] || KIND_META.interaction;
        const Icon = meta.icon;
        return (
          <Link
            key={`${event.kind}-${event.target.id}-${index}`}
            to={targetHref(event.target)}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-pitch-800"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
            >
              <Icon size={16} strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink-100">{event.title}</p>
              <p className="truncate text-xs text-ink-400">{event.subtitle}</p>
            </div>
            <span className="shrink-0 text-xs text-ink-500">
              {formatActivityTimestamp(event.timestamp)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
