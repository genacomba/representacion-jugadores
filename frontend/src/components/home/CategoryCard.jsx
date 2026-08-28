import { ArrowUpRight } from "lucide-react";

export default function CategoryCard({ category, count, onClick }) {
  const Icon = category.icon;

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-gold-500/25 bg-pitch-850 p-4 text-left transition-colors active:bg-pitch-800 md:hover:border-gold-400/60"
    >
      <span
        className="flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${category.color}1f`, color: category.color }}
      >
        <Icon size={26} strokeWidth={1.6} />
      </span>

      <span className="flex w-full items-end justify-between gap-2">
        <span>
          <span className="block text-sm font-semibold leading-snug text-ink-100">
            {category.label}
          </span>
          <span className="mt-1 block text-2xl font-semibold text-gold-300">{count}</span>
        </span>
        <ArrowUpRight
          size={16}
          className="mb-1 shrink-0 text-ink-500 transition-transform group-active:translate-x-0.5 group-active:-translate-y-0.5"
        />
      </span>
    </button>
  );
}
