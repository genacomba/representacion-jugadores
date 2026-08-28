export default function Card({ className = "", children, as: Tag = "div", ...props }) {
  return (
    <Tag
      className={`rounded-2xl border border-pitch-600/70 bg-pitch-850 shadow-[0_1px_0_0_rgba(212,175,55,0.06)] ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
