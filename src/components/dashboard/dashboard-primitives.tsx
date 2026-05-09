import type { ReactNode } from "react";
import Link from "next/link";
import type { ChipTone, DashboardModule, DashboardProgressStep } from "./types";
import { getDashboardHref, getInitials } from "./dashboard-utils";

export function chipClasses(tone: ChipTone) {
  switch (tone) {
    case "accent":
      return "border-[rgba(63,94,255,0.18)] bg-[rgba(238,242,255,0.92)] text-[var(--accent-strong)]";
    case "success":
      return "border-emerald-200/80 bg-emerald-50 text-emerald-700";
    case "gold":
      return "border-[rgba(201,155,134,0.45)] bg-[var(--danger-soft)] text-[var(--danger-strong)]";
    default:
      return "border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.8)] text-[var(--text-muted)]";
  }
}

export function DashboardChip({
  tone = "default",
  children,
}: {
  tone?: ChipTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] ${chipClasses(tone)}`}
    >
      {children}
    </span>
  );
}

export function DashboardSkeleton() {
  return (
    <section className="dashboard-shell-screen dashboard-shell">
      <div className="grid min-h-[calc(100vh-2rem)] lg:grid-cols-[17.5rem,minmax(0,1fr)]">
        <div className="hidden border-r border-[rgba(24,26,32,0.08)] bg-[rgba(248,250,255,0.9)] lg:block" />
        <div>
          <div className="dashboard-topbar h-[5.3rem] lg:hidden" />
          <div className="space-y-6 px-4 py-6 md:px-6 xl:px-8">
            <div className="surface-panel h-52 rounded-[2rem]" />
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),22rem]">
              <div className="surface-panel h-72 rounded-[2rem]" />
              <div className="space-y-6">
                <div className="surface-panel h-64 rounded-[2rem]" />
                <div className="surface-panel h-48 rounded-[2rem]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function DashboardMetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <article className="surface-soft rounded-[1.45rem] p-4 md:p-5">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">
        {label}
      </p>
      <p className="mt-3 break-words text-[1.18rem] font-semibold leading-[1.15] tracking-[-0.03em] text-[var(--text-strong)] [overflow-wrap:anywhere]">
        {value}
      </p>
      <p className="mt-2 break-words text-[0.9rem] leading-[1.68] text-[var(--text-muted)] [overflow-wrap:anywhere]">
        {description}
      </p>
    </article>
  );
}

export function DashboardAvatar({
  label,
  avatarUrl,
  sizeClassName,
  textClassName,
}: {
  label: string;
  avatarUrl: string | null;
  sizeClassName: string;
  textClassName?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[rgba(238,242,255,0.92)] text-[var(--accent-strong)] ${sizeClassName}`}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={label}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className={textClassName ?? "text-sm font-semibold"}>
          {getInitials(label)}
        </span>
      )}
    </span>
  );
}

export function DashboardProgressRow({
  label,
  progress,
  href,
}: DashboardProgressStep) {
  const content = (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.95rem] leading-[1.55] text-[var(--text-strong)]">
          {label}
        </p>
        <span
          className={`text-sm font-semibold ${href ? "text-[var(--accent-strong)]" : "text-[var(--text-muted)]"}`}
        >
          {progress}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[rgba(223,229,241,0.85)]">
        <div
          className={`h-full rounded-full ${
            progress >= 100
              ? "bg-[linear-gradient(90deg,#34d399_0%,#10b981_100%)]"
              : "bg-[linear-gradient(90deg,var(--accent-strong),var(--accent))]"
          }`}
          style={{ width: `${Math.max(progress, 4)}%` }}
        />
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link
      href={href}
      className="-mx-2 block rounded-[1.2rem] p-2 transition hover:bg-[rgba(255,255,255,0.56)]"
    >
      {content}
    </Link>
  );
}

export function DashboardModuleCard({ module }: { module: DashboardModule }) {
  return (
    <article className="surface-panel group rounded-[1.85rem] p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_28px_58px_-40px_rgba(22,29,43,0.18)] md:p-6">
      <span className="surface-soft inline-flex h-12 w-12 items-center justify-center rounded-[1rem] text-[var(--accent-strong)]">
        {module.icon}
      </span>

      <h3 className="mt-5 text-[1.28rem] font-semibold leading-[1.1] tracking-[-0.04em] text-[var(--text-strong)]">
        {module.title}
      </h3>
      <p className="mt-3 text-[0.95rem] leading-[1.72] text-[var(--text-muted)]">
        {module.description}
      </p>
      <p className="mt-2 text-[0.88rem] leading-[1.65] text-[var(--text-soft)]">
        {module.helper}
      </p>

      <Link
        href={getDashboardHref(module.view)}
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-strong)] transition hover:text-[var(--accent)]"
      >
        Відкрити
        <span aria-hidden="true">›</span>
      </Link>
    </article>
  );
}
