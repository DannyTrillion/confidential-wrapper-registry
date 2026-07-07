export function PageHeader({
  title,
  subtitle,
  eyebrow,
  center,
}: {
  title: string;
  subtitle: string;
  /** Small mono kicker above the title (jup.ag-style section label). */
  eyebrow?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "text-center" : undefined}>
      {eyebrow && (
        <p className="font-mono text-2xs uppercase tracking-[0.16em] text-ink-ghost mb-2">
          {eyebrow}
        </p>
      )}
      <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">{title}</h1>
      <p className={`mt-1.5 text-13 text-ink-faint max-w-[75ch] leading-relaxed${center ? " mx-auto" : ""}`}>
        {subtitle}
      </p>
    </div>
  );
}
