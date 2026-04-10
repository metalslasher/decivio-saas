type WordmarkLogoProps = {
  className?: string;
  tone?: "light" | "dark";
};

function AccentDot({ tone }: { tone: "light" | "dark" }) {
  const accentTone = tone === "light" ? "bg-[var(--accent)]" : "bg-[var(--accent-strong)]";

  return (
    <span
      className={`pointer-events-none absolute left-[56%] top-[-0.08em] h-[0.14em] w-[0.14em] -translate-x-1/2 rotate-[14deg] rounded-[0.04em] ${accentTone}`}
    />
  );
}

export function WordmarkLogo({ className = "", tone = "dark" }: WordmarkLogoProps) {
  const baseTone = tone === "light" ? "text-white" : "text-[var(--text-strong)]";

  return (
    <span
      className={`font-display inline-flex items-end whitespace-nowrap py-[0.08em] text-[2rem] font-extrabold leading-[0.84] tracking-[-0.075em] ${baseTone} ${className}`}
      aria-hidden="true"
    >
      <span>Dec</span>

      <span className="relative inline-block">
        <span>ı</span>
        <AccentDot tone={tone} />
      </span>

      <span className="-ml-[0.018em]">v</span>

      <span className="relative -ml-[0.022em] inline-block">
        <span>ı</span>
        <AccentDot tone={tone} />
      </span>

      <span className="-ml-[0.02em]">o</span>
    </span>
  );
}
