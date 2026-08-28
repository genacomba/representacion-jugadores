import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-pitch-950 px-6 text-center">
      <Compass size={40} className="text-gold-400/70" strokeWidth={1.25} />
      <p className="text-lg font-medium text-ink-100">Página no encontrada</p>
      <Link to="/" className="text-sm font-medium text-gold-400">Volver al inicio</Link>
    </div>
  );
}
