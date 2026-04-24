type PrincipleCardProps = {
  icon: React.ReactNode;
  title: string;
  body: string;
};

export const PrincipleCard = ({ icon, title, body }: PrincipleCardProps) => {
  return (
    <div className="hairline flex flex-col gap-3 rounded-lg border bg-white p-5">
      <span style={{ color: "var(--accent)" }}>{icon}</span>
      <h3 className="font-medium text-sm" style={{ color: "var(--ink)" }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
        {body}
      </p>
    </div>
  );
};
