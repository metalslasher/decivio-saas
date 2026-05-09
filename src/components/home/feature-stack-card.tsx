import type { CSSProperties } from "react";
import type { FeatureShowcase } from "./home-data";
import { FeaturePreview } from "./feature-previews";

export function FeatureStackCard({ item, index }: { item: FeatureShowcase; index: number }) {
  const cardStyle = {
    "--feature-card-top": `${6.25 + index * 0.62}rem`,
    "--feature-card-z": index + 1
  } as CSSProperties;

  return (
    <article className="feature-stack-card" style={cardStyle}>
      <div className="feature-stack-card-grid">
        <div className="min-w-0">
          <h3 className="break-words font-display text-[1.52rem] font-bold leading-[1.08] tracking-normal text-[var(--text-strong)] [overflow-wrap:anywhere] md:text-[1.86rem]">
            {item.title}
          </h3>

          <div className="mt-5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {item.bullets.map((bullet) => (
              <p key={bullet} className="feature-stack-bullet">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                <span>{bullet}</span>
              </p>
            ))}
          </div>

        </div>

        <div className="feature-stack-preview">
          <FeaturePreview item={item} />
        </div>
      </div>
    </article>
  );
}
