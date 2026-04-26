type PrincipleCardProps = {
  icon: React.ReactNode;
  title: string;
  body: string;
};

export const PrincipleCard = ({ icon, title, body }: PrincipleCardProps) => {
  return (
    <div className="hairline flex flex-col gap-3 rounded-lg border bg-white p-5">
      <span className="text-accent">{icon}</span>
      <h3 className="font-medium text-ink text-sm">{title}</h3>
      <p className="text-ink-soft text-sm leading-relaxed">{body}</p>
    </div>
  );
};
