export default function LoadingSpinner({ size = 28, className = "" }) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-pitch-600 border-t-gold-400 ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Cargando"
    />
  );
}
