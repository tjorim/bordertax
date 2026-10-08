interface PageHeroProps {
  title: string;
  subtitle: string;
}

export function PageHero({ title, subtitle }: PageHeroProps) {
  return (
    <div className="tw:text-center tw:mb-12 tw:mt-2">
      <h1 className="tw:mb-2 ref-hero-title">
        <span aria-hidden="true">🇧🇪&thinsp;🇳🇱&nbsp; </span>
        {title}
      </h1>
      <p className="ref-hero-subtitle">{subtitle}</p>
    </div>
  );
}
