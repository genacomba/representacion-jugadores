import { Menu, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Brand from "../common/Brand";

export default function HomeHeader() {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between pt-2 md:hidden">
      <button
        onClick={() => navigate("/mas")}
        aria-label="Más opciones"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-pitch-600/70 text-ink-300"
      >
        <Menu size={19} strokeWidth={1.75} />
      </button>

      <Brand size="md" tagline align="center" />

      <button
        onClick={() => navigate("/favoritos")}
        aria-label="Favoritos"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-pitch-600/70 text-gold-400"
      >
        <Star size={18} strokeWidth={1.75} />
      </button>
    </header>
  );
}
