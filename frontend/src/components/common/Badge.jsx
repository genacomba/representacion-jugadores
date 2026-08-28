export default function Badge({ color, children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}
      style={color ? {
        borderColor: `${color}55`,
        backgroundColor: `${color}1a`,
        color,
      } : undefined}
    >
      {children}
    </span>
  );
}
