export function PrincipleCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="border hairline rounded-lg p-5 flex flex-col gap-3 bg-white">
      <span style={{ color: "var(--accent)" }}>{icon}</span>
      <h3 className="font-medium text-sm" style={{ color: "var(--ink)" }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
        {body}
      </p>
    </div>
  );
}
