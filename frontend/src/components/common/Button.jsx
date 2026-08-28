import LoadingSpinner from "./LoadingSpinner";

const VARIANTS = {
  primary: "bg-gold-400 text-pitch-950 hover:bg-gold-300 active:bg-gold-500",
  secondary: "bg-pitch-800 text-ink-100 border border-pitch-600 hover:border-gold-500/60",
  ghost: "bg-transparent text-ink-200 hover:bg-pitch-800",
  danger: "bg-transparent text-danger border border-danger/50 hover:bg-danger/10",
};

export default function Button({
  variant = "primary",
  loading = false,
  disabled = false,
  className = "",
  children,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold
        tracking-wide transition-colors disabled:opacity-50 disabled:pointer-events-none
        ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading && <LoadingSpinner size={16} />}
      {children}
    </button>
  );
}
