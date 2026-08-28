import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PageHeader({ title, subtitle, back, actions }) {
  const navigate = useNavigate();
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="flex items-start gap-2">
        {back && (
          <button
            onClick={() => navigate(-1)}
            aria-label="Volver"
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-300 hover:bg-pitch-800"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        <div>
          <h1 className="text-xl font-semibold text-ink-100">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-ink-400">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
