import { BrandMark } from "@/components/brand-mark";

type WordmarkLogoProps = {
  className?: string;
  tone?: "light" | "dark";
  showMark?: boolean;
};

function AccentDot() {
  return (
    <span
      className="pointer-events-none absolute left-1/2 top-[-0.06em] h-[0.15em] w-[0.15em] -translate-x-1/2 rounded-[0.035em] bg-[var(--accent)]"
    />
  );
}

export function WordmarkLogo({ className = "", tone = "dark", showMark = true }: WordmarkLogoProps) {
  const baseTone = tone === "light" ? "text-white" : "text-[var(--text-strong)]";

  return (
    <span
      className={`font-display inline-flex items-center whitespace-nowrap py-[0.08em] text-[2rem] font-[900] leading-none tracking-normal [font-variation-settings:'wght'_860] ${baseTone} ${className}`}
      aria-hidden="true"
    >
      {showMark ? <BrandMark tone={tone} className="h-[1.12em] w-[1.08em] shrink-0 translate-y-[0.035em]" /> : null}

      <span className={`${showMark ? "ml-[0.04em]" : ""} inline-flex items-end leading-[0.86]`}>
        <span>ec</span>

        <span className="relative inline-flex w-[0.31em] justify-center">
          <span>ı</span>
          <AccentDot />
        </span>

        <span>v</span>

        <span className="relative inline-flex w-[0.31em] justify-center">
          <span>ı</span>
          <AccentDot />
        </span>

        <span>o</span>
      </span>
    </span>
  );
}
