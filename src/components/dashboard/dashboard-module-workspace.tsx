import Link from "next/link";
import { moduleWorkspaceConfigs } from "./dashboard-config";
import { DashboardChip, DashboardMetricCard } from "./dashboard-primitives";
import type { DashboardModule } from "./types";
import { moduleSummaryDescription } from "./dashboard-utils";

export function DashboardModuleWorkspace({
  moduleView,
}: {
  moduleView: DashboardModule["view"];
}) {
  const config = moduleWorkspaceConfigs[moduleView];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr),22rem]">
        <article className="dashboard-spotlight-card rounded-[2.3rem] p-6 md:p-8">
          <DashboardChip tone="accent">{config.eyebrow}</DashboardChip>
          <h1 className="mt-5 max-w-[15ch] text-[2.2rem] font-semibold leading-[0.94] tracking-[-0.055em] text-[var(--text-strong)] md:text-[3.05rem]">
            {config.title}
          </h1>
          <p className="mt-5 max-w-3xl text-[1rem] leading-[1.78] text-[var(--text-muted)]">
            {config.description}
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {config.summary.map((item) => (
              <DashboardMetricCard
                key={item.label}
                label={item.label}
                value={item.value}
                description={moduleSummaryDescription(item.label)}
              />
            ))}
          </div>
        </article>

        <article className="surface-panel rounded-[2rem] p-5 md:p-6">
          <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">
            Що важливо для зручності
          </h2>
          <div className="mt-5 space-y-3">
            {[
              "Модуль живе у власному просторі й не змішується з головним екраном.",
              "Його можна підключати окремо без перебудови всього кабінету.",
              "Користувач бачить логіку маршруту: сценарії -> модуль -> наступний крок.",
            ].map((item) => (
              <div key={item} className="surface-soft rounded-[1.2rem] p-4">
                <p className="text-[0.93rem] leading-[1.68] text-[var(--text-muted)]">
                  {item}
                </p>
              </div>
            ))}
          </div>

          <Link href="/dashboard" className="btn-secondary mt-6 w-full">
            Повернутися на головну
          </Link>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {config.columns.map((column) => (
          <article
            key={column.title}
            className="surface-panel rounded-[1.9rem] p-5 md:p-6"
          >
            <h2 className="text-[1.3rem] font-semibold leading-[1.08] tracking-[-0.035em] text-[var(--text-strong)]">
              {column.title}
            </h2>
            <p className="mt-3 text-[0.94rem] leading-[1.72] text-[var(--text-muted)]">
              {column.description}
            </p>
            <div className="mt-5 space-y-3">
              {column.items.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-[1.2rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.72)] px-4 py-3"
                >
                  <span className="mt-2 inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                  <p className="text-[0.93rem] leading-[1.65] text-[var(--text-muted)]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
