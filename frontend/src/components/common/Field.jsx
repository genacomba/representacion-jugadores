export function Field({ label, error, hint, required, children }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-ink-300">
          {label} {required && <span className="text-gold-400">*</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-400">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}

const inputClasses =
  "w-full rounded-xl border border-pitch-600 bg-pitch-800 px-4 py-3 text-[16px] text-ink-100 " +
  "placeholder:text-ink-500 outline-none transition-colors focus:border-gold-400/70 " +
  "focus:ring-1 focus:ring-gold-400/40";

export function Input({ className = "", error, ...props }) {
  return (
    <input
      className={`${inputClasses} ${error ? "border-danger/60" : ""} ${className}`}
      {...props}
    />
  );
}

export function Textarea({ className = "", error, rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      className={`${inputClasses} resize-none ${error ? "border-danger/60" : ""} ${className}`}
      {...props}
    />
  );
}

export function Select({ className = "", error, children, ...props }) {
  return (
    <select
      className={`${inputClasses} ${error ? "border-danger/60" : ""} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
