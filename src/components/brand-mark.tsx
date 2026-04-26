import type { CSSProperties } from "react";

type BrandMarkProps = {
  className?: string;
  tone?: "light" | "dark";
  title?: string;
};

export function BrandMark({ className = "", tone = "dark", title }: BrandMarkProps) {
  const baseColor = tone === "light" ? "#ffffff" : "#171b24";
  const accentColor = "#4361ff";
  const style = {
    "--brand-mark-base": baseColor,
    "--brand-mark-accent": accentColor
  } as CSSProperties;

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      style={style}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M18 14.5H32.5C44 14.5 51.5 21.5 51.5 32C51.5 42.5 44 49.5 32.5 49.5H28.5"
        stroke="var(--brand-mark-base)"
        strokeWidth="8.75"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
      <path
        d="M18 38.75V49.5H32.5"
        stroke="var(--brand-mark-accent)"
        strokeWidth="8.75"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
