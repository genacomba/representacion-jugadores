import { Link } from "react-router-dom";
import Avatar from "../common/Avatar";
import FavoriteButton from "../common/FavoriteButton";
import { CLUB_CATEGORY } from "../../constants/categories";

export default function ClubCard({ club, onToggleFavorite }) {
  return (
    <Link
      to={`/clubes/${club.id}`}
      className="flex items-center gap-3 rounded-2xl border border-pitch-600/70 bg-pitch-850 p-3 transition-colors hover:border-gold-500/40 active:bg-pitch-800"
    >
      <Avatar src={club.crest} name={club.name} size={52} ringColor={`${CLUB_CATEGORY.color}40`} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink-100">{club.name}</p>
        <p className="truncate text-sm text-ink-400">Club</p>
      </div>
      <FavoriteButton active={club.is_favorite} onToggle={() => onToggleFavorite?.(club)} />
    </Link>
  );
}
