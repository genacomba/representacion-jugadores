import { Link } from "react-router-dom";
import Avatar from "../common/Avatar";
import Badge from "../common/Badge";
import FavoriteButton from "../common/FavoriteButton";
import { categoryMeta } from "../../constants/categories";

export default function PersonCard({ person, onToggleFavorite }) {
  const meta = categoryMeta(person.category);
  const subtitleParts = [
    person.primary_position,
    person.current_club_detail?.name,
  ].filter(Boolean);

  return (
    <Link
      to={`/contactos/${person.id}`}
      className="flex items-center gap-3 rounded-2xl border border-pitch-600/70 bg-pitch-850 p-3 transition-colors hover:border-gold-500/40 active:bg-pitch-800"
    >
      <Avatar src={person.photo} name={person.full_name} size={52} ringColor={`${meta.color}55`} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink-100">
          {person.full_name}
          {person.nickname && <span className="text-ink-400"> "{person.nickname}"</span>}
        </p>
        <p className="truncate text-sm text-ink-400">
          {subtitleParts.length ? subtitleParts.join(" · ") : meta.label}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge color={meta.color}>{meta.short}</Badge>
          {person.status && <Badge color="#8a938a">{person.status}</Badge>}
        </div>
      </div>
      <FavoriteButton
        active={person.is_favorite}
        onToggle={() => onToggleFavorite?.(person)}
      />
    </Link>
  );
}
