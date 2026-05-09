import Link from "next/link";
import { formatUah } from "@/lib/pricing";
import { dashboardModules } from "./dashboard-config";
import { ActivityIcon, CreditCardIcon, SparkIcon } from "./icons";
import { DashboardChip, DashboardMetricCard, DashboardModuleCard, DashboardProgressRow } from "./dashboard-primitives";
import type { DashboardAccessState, DashboardSimulation, DashboardUserProfile } from "./types";
import {
  buildActivityItems,
  buildInsights,
  buildLongTermDirectionInsight,
  buildProgressSteps,
  formatDateTime,
  formatShortDate,
  formatSignedMoney,
  getDashboardHref,
  mapAccessLabel,
  mapPriorityLabel,
  mapTargetMarketLabel,
  probabilityLabel,
  riskLevelLabel,
  verdictLabel,
} from "./dashboard-utils";

export function DashboardOverview({
  totalSimulations,
  profile,
  subscription,
  recentSimulations,
  lastSimulation,
}: {
  totalSimulations: number;
  profile: DashboardUserProfile;
  subscription: DashboardAccessState;
  recentSimulations: DashboardSimulation[];
  lastSimulation: DashboardSimulation | null;
}) {
  const progressSteps = buildProgressSteps(
    totalSimulations,
    subscription,
    profile.completion,
  );
  const insights = buildInsights(
    subscription,
    totalSimulations,
    lastSimulation,
    profile.completion,
  );
  const activityItems = buildActivityItems(recentSimulations, subscription);

  const targetMarket = mapTargetMarketLabel(
    lastSimulation?.targetMarket ?? null,
  );
  const priority = mapPriorityLabel(lastSimulation?.transitionPriority ?? null);
  const lastVerdict = verdictLabel(lastSimulation?.verdictLabel ?? null);
  const probability = probabilityLabel(
    lastSimulation?.probabilityOfGettingJob ?? null,
  );
  const riskLevel = riskLevelLabel(lastSimulation?.riskLevel ?? null);
  const moneyDelta = formatSignedMoney(
    lastSimulation?.ceilingGapMedian ?? null,
  );
  const currentCeiling =
    lastSimulation?.currentBestCaseMedian !== null &&
    lastSimulation?.currentBestCaseMedian !== undefined
      ? formatUah(Math.round(lastSimulation.currentBestCaseMedian))
      : null;
  const targetCeiling =
    lastSimulation?.targetBestCaseMedian !== null &&
    lastSimulation?.targetBestCaseMedian !== undefined
      ? formatUah(Math.round(lastSimulation.targetBestCaseMedian))
      : null;
  const lastUpdatedLabel = formatShortDate(lastSimulation?.createdAt ?? null);
  const longTermDirectionInsight = buildLongTermDirectionInsight(
    lastSimulation?.betterLongTermDirection ?? null,
    lastSimulation,
  );
  const focusTitle =
    lastSimulation?.currentRole && lastSimulation.targetRole
      ? `${lastSimulation.currentRole} -> ${lastSimulation.targetRole}`
      : lastSimulation?.targetRole
        ? `Фокус на переході в ${lastSimulation.targetRole}`
        : "Почнімо зі стартового сценарію переходу";
  const heroSummary = lastSimulation
    ? longTermDirectionInsight ??
      (lastVerdict
        ? `${lastVerdict}.`
        : "Останній розрахунок уже можна тримати як базовий фокус для наступних модулів.")
    : "Після першої симуляції тут з'явиться коротке зведення з вердиктом, шансом входу, доходом і ризиком переходу.";

  return (
    <div className="space-y-6">
      <article className="dashboard-spotlight-card rounded-[2.3rem] p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <DashboardChip tone={lastSimulation ? "default" : "accent"}>
            {lastUpdatedLabel ? `Оновлено ${lastUpdatedLabel}` : "Готово до старту"}
          </DashboardChip>
          {targetMarket ? (
            <DashboardChip tone="default">{targetMarket}</DashboardChip>
          ) : null}
          {priority ? (
            <DashboardChip tone="accent">{priority}</DashboardChip>
          ) : null}
        </div>

        <h1 className="mt-5 text-[2.35rem] font-semibold leading-[0.92] tracking-[-0.055em] text-[var(--text-strong)] md:text-[3.45rem] xl:text-[4.35rem]">
          {focusTitle}
        </h1>
        <p className="mt-5 max-w-4xl text-[1rem] leading-[1.78] text-[var(--text-muted)]">
          {heroSummary}
        </p>

        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard
            label="Поточна стеля"
            value={currentCeiling ?? "Ще не пораховано"}
            description={
              currentCeiling
                ? "Орієнтир по верхній межі доходу в поточній ролі."
                : "Після першого результату тут з'явиться базовий орієнтир для порівняння."
            }
          />
          <DashboardMetricCard
            label="Цільова стеля"
            value={targetCeiling ?? "Ще не пораховано"}
            description={
              targetCeiling
                ? "Орієнтир по верхній межі доходу після переходу."
                : "Цільова роль покаже свою стелю після першого розрахунку."
            }
          />
          <DashboardMetricCard
            label="Різниця в стелі"
            value={moneyDelta ?? "Ще не пораховано"}
            description={
              moneyDelta
                ? "Орієнтовний розрив між поточною та цільовою стелею доходу."
                : "Після першого результату тут з'явиться різниця між двома напрямами."
            }
          />
          <DashboardMetricCard
            label="Шанс входу"
            value={probability ?? "Ще не пораховано"}
            description={
              riskLevel
                ? `Рівень ризику переходу: ${riskLevel}.`
                : lastVerdict ??
                  "Після першого результату тут з'явиться орієнтир по шансах входу."
            }
          />
        </div>
      </article>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-12">
        <article className="surface-panel rounded-[2rem] p-5 md:col-span-2 md:p-6 xl:col-span-7">
          <h2 className="text-[1.5rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">
            План прогресу
          </h2>
          <p className="mt-3 text-[0.95rem] leading-[1.72] text-[var(--text-muted)]">
            Це зона, яка тримає людину не в хаосі модулів, а в послідовному
            маршруті переходу.
          </p>

          <div className="mt-6 space-y-5">
            {progressSteps.map((step) => (
              <DashboardProgressRow key={step.label} {...step} />
            ))}
          </div>
        </article>

        <article className="surface-panel rounded-[2rem] p-5 md:p-6 xl:col-span-5">
          <div className="flex items-center gap-3">
            <span className="surface-soft inline-flex h-11 w-11 items-center justify-center rounded-[1rem] text-[var(--accent-strong)]">
              <SparkIcon />
            </span>
            <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">
              Поради
            </h2>
          </div>

          <div className="mt-5 space-y-3">
            {insights.map((insight) => (
              <div key={insight} className="surface-soft rounded-[1.25rem] p-4">
                <p className="text-[0.94rem] leading-[1.72] text-[var(--text-muted)]">
                  {insight}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-panel rounded-[2rem] p-5 md:p-6 xl:col-span-5">
          <div className="flex items-center gap-3">
            <span className="surface-soft inline-flex h-11 w-11 items-center justify-center rounded-[1rem] text-[var(--accent-strong)]">
              <CreditCardIcon />
            </span>
            <div>
              <p className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-soft)]">
                Тариф і доступ
              </p>
              <h2 className="mt-1 text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">
                {subscription.plan === "pro" ? "План Pro" : "Базовий план"}
              </h2>
            </div>
          </div>

          <p className="mt-5 text-[0.95rem] leading-[1.74] text-[var(--text-muted)]">
            {subscription.currentPeriodEnd
              ? `Активний до ${formatDateTime(subscription.currentPeriodEnd) ?? "поточної дати"}. Тут же мають жити оплата, рахунки й межі плану.`
              : "Тариф і керування доступом винесені в окремий сервісний екран, а не змішані з головним екраном кабінету."}
          </p>

          <div className="mt-5 space-y-3">
            <div className="surface-soft rounded-[1.25rem] p-4">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">
                Статус
              </p>
              <p className="mt-2 text-[1rem] font-semibold text-[var(--text-strong)]">
                {mapAccessLabel(subscription.plan, subscription.status)}
              </p>
            </div>
            <div className="surface-soft rounded-[1.25rem] p-4">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">
                Що відкрито
              </p>
              <p className="mt-2 text-[0.92rem] leading-[1.68] text-[var(--text-muted)]">
                {subscription.plan === "pro"
                  ? "Сценарії, модулі підготовки та сервісні екрани вже прив'язані до цього акаунта."
                  : "Базовий сценарний контур активний. Платні модулі вже мають місце в навігації та готові до підключення."}
              </p>
            </div>
          </div>

          <Link
            href={getDashboardHref("access")}
            className="btn-secondary mt-6 w-full"
          >
            Відкрити доступ
          </Link>
        </article>

        <article
          id="activity"
          className="surface-panel rounded-[2rem] p-5 md:col-span-2 md:p-6 xl:col-span-7"
        >
          <div className="flex items-center gap-3">
            <span className="surface-soft inline-flex h-11 w-11 items-center justify-center rounded-[1rem] text-[var(--accent-strong)]">
              <ActivityIcon />
            </span>
            <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">
              Остання активність
            </h2>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {activityItems.map((item) => (
              <div
                key={`${item.title}-${item.description}`}
                className="rounded-[1.2rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.74)] p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-1.5 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--accent)]/75" />
                  <div>
                    <p className="text-[0.94rem] leading-[1.62] text-[var(--text-strong)]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-[0.82rem] text-[var(--text-soft)]">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <section id="dashboard-modules" className="space-y-4 scroll-mt-28">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[1.85rem] font-semibold leading-[1.02] tracking-[-0.045em] text-[var(--text-strong)]">
              Модулі
            </h2>
            <p className="mt-2 text-[0.96rem] leading-[1.72] text-[var(--text-muted)]">
              Усі інструменти видно одразу, але головний екран не перевантажений
              і тримає акцент на наступних діях.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dashboardModules.map((module) => (
            <DashboardModuleCard key={module.view} module={module} />
          ))}
        </div>
      </section>
    </div>
  );
}
