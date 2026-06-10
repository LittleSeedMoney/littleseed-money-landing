type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  centered?: boolean;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
}: SectionHeadingProps) {
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-earth-700">
        {eyebrow}
      </p>
      <h2 className="font-display text-balance text-3xl font-medium leading-tight text-seed-950 sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 text-lg leading-8 text-seed-800/75">{description}</p>
      ) : null}
    </div>
  );
}
