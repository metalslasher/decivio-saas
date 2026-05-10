import { BrandMark } from "@/components/brand-mark";

type WordmarkLogoProps = {
  className?: string;
  tone?: "light" | "dark";
  showMark?: boolean;
};

function AccentDot() {
  return (
    <span
      className="brand-wordmark-dot pointer-events-none absolute left-1/2 top-[-0.07em] h-[0.15em] w-[0.15em] -translate-x-1/2 rounded-[0.04em] bg-[var(--accent)]"
    />
  );
}

export function WordmarkLogo({ className = "", tone = "dark", showMark = true }: WordmarkLogoProps) {
  const baseTone = tone === "light" ? "text-white" : "text-[var(--text-strong)]";

  return (
    <span
      data-tone={tone}
      className={`brand-wordmark inline-flex items-center whitespace-nowrap py-[0.08em] text-[2rem] font-[950] leading-none tracking-normal [font-variation-settings:'wght'_920] ${baseTone} ${className}`}
      aria-hidden="true"
    >
      {showMark ? <BrandMark tone={tone} className="brand-wordmark-mark h-[1.17em] w-[1.08em] shrink-0 -mr-[0.095em] translate-y-[0.036em]" /> : null}

      <span className="brand-wordmark-text inline-flex origin-left items-end leading-[0.82]">
        <span>ec</span>

        <span className="relative inline-flex w-[0.285em] justify-center">
          <span>ı</span>
          <AccentDot />
        </span>

        <span>v</span>

        <span className="relative inline-flex w-[0.285em] justify-center">
          <span>ı</span>
          <AccentDot />
        </span>

        <span>o</span>
      </span>
    </span>
  );
}
