export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pitch-800 text-gold-400/80">
          <Icon size={26} strokeWidth={1.5} />
        </div>
      )}
      <p className="text-base font-medium text-ink-200">{title}</p>
      {description && <p className="max-w-xs text-sm text-ink-400">{description}</p>}
      {action}
    </div>
  );
}
