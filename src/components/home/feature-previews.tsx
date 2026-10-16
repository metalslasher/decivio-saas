import type { ReactNode } from "react";
import type { FeatureShowcase } from "./home-data";

export function FeaturePreviewShell({ children }: { children: ReactNode }) {
  return (
    <div className="feature-preview-shell h-full rounded-[1.75rem] p-4 md:p-5">
      <div className="relative">{children}</div>
    </div>
  );
}

export function ScenarioPreview() {
  const statCards = [
    { value: "+12%", active: false },
    { value: "+68%", active: true },
    { value: "+44%", active: false }
  ];

  return (
    <FeaturePreviewShell>
      <div className="feature-chart-panel rounded-[1.45rem] p-3">
        <div className="relative h-32 overflow-hidden rounded-[1.15rem] border border-[rgba(255,255,255,0.72)] bg-[rgba(255,255,255,0.64)]">
          <div className="feature-chart-grid absolute inset-0" />
          <svg viewBox="0 0 320 128" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M12 98 C 54 92, 72 86, 110 80 S 178 72, 214 64 S 276 54, 308 46"
              className="feature-chart-line feature-chart-line--muted feature-line-draw"
              style={{ animationDelay: "40ms" }}
            />
            <path
              d="M12 104 C 48 100, 74 96, 108 90 S 174 78, 210 70 S 270 60, 308 56"
              className="feature-chart-line feature-chart-line--soft feature-line-draw"
              style={{ animationDelay: "160ms" }}
            />
            <path
              d="M12 108 C 52 108, 78 102, 112 86 S 176 52, 212 40 S 272 28, 308 20"
              className="feature-chart-line feature-chart-line--accent feature-line-draw"
              style={{ animationDelay: "280ms" }}
            />
          </svg>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {statCards.map((card) => (
          <div
            key={card.value}
            className={`rounded-[1.1rem] border px-3 py-3 ${
              card.active
                ? "border-[rgba(63,94,255,0.22)] bg-[rgba(238,242,255,0.9)]"
                : "border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.74)]"
            }`}
          >
            <div className="flex gap-1.5">
              <span className={`h-1.5 flex-1 rounded-full ${card.active ? "bg-[var(--accent)]/90" : "bg-[rgba(160,170,188,0.65)]"}`} />
              <span className={`h-1.5 w-5 rounded-full ${card.active ? "bg-[var(--accent)]/45" : "bg-[rgba(196,204,220,0.86)]"}`} />
            </div>
            <p className={`mt-4 text-[1rem] font-semibold ${card.active ? "text-[var(--accent-strong)]" : "text-[var(--text-strong)]"}`}>{card.value}</p>
          </div>
        ))}
      </div>
    </FeaturePreviewShell>
  );
}

export function ResumePreview() {
  return (
    <FeaturePreviewShell>
      <div className="grid grid-cols-[1.06fr,0.94fr] gap-3">
        <div className="feature-doc-panel rounded-[1.35rem] p-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]/75" />
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]/35" />
            <span className="h-2 w-2 rounded-full bg-[rgba(195,203,219,0.92)]" />
          </div>

          <div className="mt-3 space-y-2">
            <div className="feature-skeleton-line w-[82%]" />
            <div className="feature-skeleton-line w-[68%]" />
          </div>

          <div className="mt-4 grid gap-2">
            <div className="rounded-[1rem] border border-[rgba(63,94,255,0.18)] bg-[rgba(238,242,255,0.9)] p-3">
              <div className="feature-skeleton-line w-[72%]" />
            </div>
            <div className="rounded-[1rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.74)] p-3">
              <div className="feature-skeleton-line w-[64%]" />
            </div>
            <div className="rounded-[1rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.74)] p-3">
              <div className="feature-skeleton-line w-[76%]" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex justify-center rounded-[1.3rem] border border-[rgba(63,94,255,0.16)] bg-[rgba(255,255,255,0.74)] p-3">
            <div
              className="feature-score-ring"
              style={{
                background: "conic-gradient(var(--accent) 0deg 310deg, rgba(227,232,244,0.9) 310deg 360deg)"
              }}
            >
              <div className="feature-score-ring-inner">
                <span className="text-[1.08rem] font-semibold text-[var(--accent-strong)]">86</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className={`flex h-16 items-center justify-center rounded-[1rem] border ${index % 2 === 0 ? "border-[rgba(63,94,255,0.18)] bg-[rgba(238,242,255,0.88)]" : "border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.74)]"}`}
              >
                <svg viewBox="0 0 24 24" className={`h-5 w-5 ${index % 2 === 0 ? "text-[var(--accent-strong)]" : "text-[var(--text-soft)]"}`} fill="none" stroke="currentColor" strokeWidth="1.9">
                  <path d="M6 12.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FeaturePreviewShell>
  );
}

export function InterviewPreview() {
  return (
    <FeaturePreviewShell>
      <div className="rounded-[1.35rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.74)] p-4">
        <div className="grid gap-2.5 rounded-[1.2rem] border border-[rgba(63,94,255,0.12)] bg-[rgba(238,242,255,0.42)] p-3">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`flex items-center gap-3 rounded-[0.95rem] border px-3 py-2.5 ${
                index === 1
                  ? "border-[rgba(63,94,255,0.18)] bg-white text-[var(--accent-strong)]"
                  : "border-[rgba(24,26,32,0.06)] bg-white/70 text-[var(--text-muted)]"
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${index === 1 ? "bg-[var(--accent)]" : "bg-[rgba(196,204,220,0.9)]"}`} />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className={`h-1.5 rounded-full ${index === 1 ? "w-[76%] bg-[var(--accent)]/70" : "w-[64%] bg-[rgba(190,200,218,0.74)]"}`} />
                <div className={`h-1.5 rounded-full ${index === 1 ? "w-[52%] bg-[var(--accent)]/30" : "w-[44%] bg-[rgba(218,224,236,0.86)]"}`} />
              </div>
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={index === 1 ? "M6 12.5l4 4 8-9" : "M8 12h8"} />
              </svg>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {[
          "M12 4v16M5 12h14",
          "M12 6v12M8.5 9.5l3.5-3.5 3.5 3.5M8.5 14.5l3.5 3.5 3.5-3.5",
          "M6 12.5l4 4 8-9"
        ].map((path, index) => (
          <div
            key={index}
            className={`flex h-16 items-center justify-center rounded-[1.1rem] border ${index === 1 ? "border-[rgba(63,94,255,0.2)] bg-[rgba(238,242,255,0.88)]" : "border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.74)]"}`}
          >
            <svg viewBox="0 0 24 24" className={`h-6 w-6 ${index === 1 ? "text-[var(--accent-strong)]" : "text-[var(--text-soft)]"}`} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d={path} />
            </svg>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {[82, 74, 68].map((width, index) => (
          <div key={width} className="rounded-[1rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.7)] px-3 py-3">
            <div className="h-2 overflow-hidden rounded-full bg-[rgba(223,229,241,0.8)]">
              <div
                className="feature-meter-fill h-full rounded-full bg-[linear-gradient(90deg,var(--accent-strong),var(--accent))]"
                style={{ width: `${width}%`, animationDelay: `${index * 120}ms` }}
              />
            </div>
          </div>
        ))}
      </div>
    </FeaturePreviewShell>
  );
}

export function PlanPreview() {
  return (
    <FeaturePreviewShell>
      <div className="rounded-[1.3rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.72)] p-4">
        <div className="relative flex items-start justify-between px-2">
          <div className="absolute left-8 right-8 top-[1rem] h-[2px] overflow-hidden rounded-full bg-[rgba(223,229,241,0.9)]">
            <div className="feature-progress-line h-full w-full rounded-full bg-[linear-gradient(90deg,var(--accent-strong),var(--accent))]" />
          </div>

          {["30", "60", "90"].map((value, index) => (
            <div key={value} className="relative z-10 flex flex-col items-center gap-2">
              <span className={`timeline-marker flex h-8 w-8 items-center justify-center rounded-full border text-[0.8rem] font-semibold ${index !== 1 ? "border-[rgba(63,94,255,0.22)] bg-[rgba(238,242,255,0.95)] text-[var(--accent-strong)]" : "border-[rgba(24,26,32,0.08)] bg-white text-[var(--text-muted)]"}`}>
                {value}
              </span>
              <div className="h-6 w-[2px] rounded-full bg-[rgba(223,229,241,0.9)]" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {[72, 56, 84].map((width, index) => (
          <div
            key={width}
            className={`rounded-[1.1rem] border px-3 py-3 ${index !== 1 ? "border-[rgba(63,94,255,0.2)] bg-[rgba(238,242,255,0.88)]" : "border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.74)]"}`}
          >
            <div className="mx-auto mb-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-[0.72rem] font-semibold text-[var(--text-muted)]">
              {index + 1}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[rgba(223,229,241,0.8)]">
              <div
                className="feature-meter-fill h-full rounded-full bg-[linear-gradient(90deg,var(--accent-strong),var(--accent))]"
                style={{ width: `${width}%`, animationDelay: `${index * 120}ms` }}
              />
            </div>
          </div>
        ))}
      </div>
    </FeaturePreviewShell>
  );
}

export function MatchPreview() {
  return (
    <FeaturePreviewShell>
      <div className="grid grid-cols-[auto,1fr] items-center gap-4">
        <div
          className="feature-score-ring"
          style={{
            width: "7rem",
            height: "7rem",
            background: "conic-gradient(var(--accent) 0deg 252deg, rgba(227,232,244,0.9) 252deg 360deg)"
          }}
        >
          <div className="feature-score-ring-inner">
            <span className="text-[1.1rem] font-semibold text-[var(--accent-strong)]">70%</span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2.5">
          {Array.from({ length: 10 }).map((_, index) => (
            <span
              key={index}
              className={`h-5 rounded-[0.7rem] border ${index < 7 ? "border-[rgba(63,94,255,0.18)] bg-[rgba(238,242,255,0.9)]" : "border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.72)]"}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2.5">
        {[76, 38, 64, 52].map((width, index) => (
          <div key={width} className="rounded-[1rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.72)] p-3">
            <div className="h-12 rounded-[0.85rem] bg-[rgba(242,245,251,0.9)] p-2">
              <div className="h-full overflow-hidden rounded-full bg-[rgba(223,229,241,0.8)]">
                <div
                  className="feature-meter-fill h-full rounded-full bg-[linear-gradient(90deg,var(--accent-strong),var(--accent))]"
                  style={{ width: `${width}%`, animationDelay: `${index * 120}ms` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </FeaturePreviewShell>
  );
}

export function OfferPreview() {
  return (
    <FeaturePreviewShell>
      <div className="grid grid-cols-[0.9fr,0.2fr,0.9fr] items-end gap-3">
        <div className="rounded-[1.25rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.74)] p-3">
          <div className="flex h-24 items-end">
            <div className="feature-meter-fill w-full rounded-[1rem_1rem_0.65rem_0.65rem] bg-[rgba(148,160,183,0.86)]" style={{ height: "56%" }} />
          </div>
        </div>

        <div className="flex justify-center pb-4">
          <svg viewBox="0 0 24 24" className="h-7 w-7 text-[var(--accent-strong)]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 16l6-6 3 3 5-5" />
            <path d="M14 8h5v5" />
          </svg>
        </div>

        <div className="rounded-[1.25rem] border border-[rgba(63,94,255,0.22)] bg-[rgba(238,242,255,0.9)] p-3">
          <div className="flex h-24 items-end">
            <div
              className="feature-meter-fill w-full rounded-[1rem_1rem_0.65rem_0.65rem] bg-[linear-gradient(180deg,var(--accent),var(--accent-strong))]"
              style={{ height: "82%", animationDelay: "120ms" }}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {["+18%", "+540"].map((value, index) => (
          <div
            key={value}
            className={`rounded-[1.1rem] border px-3 py-4 text-center ${index === 1 ? "border-[rgba(63,94,255,0.22)] bg-[rgba(238,242,255,0.88)]" : "border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.74)]"}`}
          >
            <span className={`text-[1.06rem] font-semibold ${index === 1 ? "text-[var(--accent-strong)]" : "text-[var(--text-strong)]"}`}>{value}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-[1.2rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.74)] p-3">
        <div className="h-2 overflow-hidden rounded-full bg-[rgba(223,229,241,0.8)]">
          <div className="feature-meter-fill h-full w-[76%] rounded-full bg-[linear-gradient(90deg,var(--accent-strong),var(--accent))]" style={{ animationDelay: "180ms" }} />
        </div>
      </div>
    </FeaturePreviewShell>
  );
}

export function FeaturePreview({ item }: { item: FeatureShowcase }) {
  switch (item.visual) {
    case "scenarios":
      return <ScenarioPreview />;
    case "resume":
      return <ResumePreview />;
    case "interview":
      return <InterviewPreview />;
    case "plan":
      return <PlanPreview />;
    case "match":
      return <MatchPreview />;
    case "offer":
      return <OfferPreview />;
    default:
      return null;
  }
}
