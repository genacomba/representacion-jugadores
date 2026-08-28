function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function Avatar({ src, name, size = 48, ringColor, className = "" }) {
  const dimension = { width: size, height: size };
  const style = ringColor ? { boxShadow: `0 0 0 2px ${ringColor}` } : undefined;

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ ...dimension, ...style }}
        className={`rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      style={{ ...dimension, ...style, fontSize: size * 0.36 }}
      className={`flex items-center justify-center rounded-full bg-pitch-700 font-semibold text-gold-300 ${className}`}
    >
      {initials(name) || "?"}
    </div>
  );
}
