import Link from "next/link";
import { formatUah, getPricingPurchaseHref, pricingPlans } from "@/lib/pricing";
import { DashboardChip, DashboardMetricCard } from "./dashboard-primitives";
import type { DashboardAccessState } from "./types";
import { accessTone, formatShortDate } from "./dashboard-utils";

export function DashboardAccess({
  accessLabel,
  subscription,
  email,
  onSignOut,
  isSigningOut,
}: {
  accessLabel: string;
  subscription: DashboardAccessState;
  email: string;
  onSignOut: () => void;
  isSigningOut: boolean;
}) {
  const monthlyPlan = pricingPlans[0];
  const mainPlan = pricingPlans[1];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr),22rem]">
        <article className="dashboard-spotlight-card rounded-[2.3rem] p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <DashboardChip
              tone={accessTone(subscription.plan, subscription.status)}
            >
              Доступ
            </DashboardChip>
            <DashboardChip
              tone={accessTone(subscription.plan, subscription.status)}
            >
              {accessLabel}
            </DashboardChip>
          </div>

          <h1 className="mt-5 max-w-[14ch] text-[2.2rem] font-semibold leading-[0.94] tracking-[-0.055em] text-[var(--text-strong)] md:text-[3.05rem]">
            План, оплата і керування акаунтом в одному місці
          </h1>
          <p className="mt-5 max-w-3xl text-[1rem] leading-[1.78] text-[var(--text-muted)]">
            Це окремий сервісний екран для всього, що стосується доступу:
            поточний план, електронна пошта акаунта, орієнтир по цінах і
            доступ до paid workspace.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <DashboardMetricCard
              label="Акаунт"
              value={email}
              description="Саме за цим профілем закріплений paid workspace."
            />
            <DashboardMetricCard
              label="Поточний план"
              value={subscription.plan === "pro" ? "План Pro" : "Базовий план"}
              description={
                subscription.currentPeriodEnd
                  ? `Активний до ${formatShortDate(subscription.currentPeriodEnd) ?? "поточної дати"}.`
                  : "Базовий доступ без оплати."
              }
            />
            <DashboardMetricCard
              label="Що далі"
              value={
                subscription.plan === "pro"
                  ? "Керувати підпискою"
                  : "Оновити план"
              }
              description={
                subscription.plan === "pro"
                  ? "Оплата і ліміти плану логічно живуть саме тут."
                  : "Після оновлення цей екран стане центром керування доступом."
              }
            />
          </div>
        </article>

        <article className="surface-panel rounded-[2rem] p-5 md:p-6">
          <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">
            Дії по акаунту
          </h2>
          <div className="mt-5 space-y-3">
            <Link href="/pricing" className="btn-secondary w-full">
              Переглянути тарифи
            </Link>
            <Link href={getPricingPurchaseHref("monthly")} className="btn-primary w-full">
              Відкрити оплату
            </Link>
            <button
              type="button"
              onClick={onSignOut}
              disabled={isSigningOut}
              className="btn-dark w-full disabled:opacity-60"
            >
              {isSigningOut ? "Виходимо..." : "Вийти з акаунта"}
            </button>
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="surface-panel rounded-[1.9rem] p-5 md:p-6">
          <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">
            Орієнтир по планах
          </h2>

          <div className="mt-5 space-y-4">
            <div className="surface-soft rounded-[1.35rem] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[1.02rem] font-semibold text-[var(--text-strong)]">
                  {monthlyPlan.name}
                </p>
                <DashboardChip tone="accent">
                  {formatUah(monthlyPlan.billedNowUah)}
                </DashboardChip>
              </div>
              <p className="mt-3 text-[0.92rem] leading-[1.68] text-[var(--text-muted)]">
                {monthlyPlan.billingLabel}
              </p>
            </div>

            <div className="surface-soft rounded-[1.35rem] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[1.02rem] font-semibold text-[var(--text-strong)]">
                  {mainPlan.name}
                </p>
                <DashboardChip tone="success">
                  {formatUah(mainPlan.billedNowUah)}
                </DashboardChip>
              </div>
              <p className="mt-3 text-[0.92rem] leading-[1.68] text-[var(--text-muted)]">
                {mainPlan.billingLabel}. Економія{" "}
                {formatUah(mainPlan.savingsUah)} проти трьох окремих місяців.
              </p>
            </div>
          </div>
        </article>

        <article className="surface-panel rounded-[1.9rem] p-5 md:p-6">
          <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">
            Що відкриває paid workspace
          </h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              [
                "Ринкова позиція",
                "Останній результат зберігається як база для подальших дій.",
              ],
              [
                "Vacancy Fit",
                "Вставляєте вакансію і отримуєте apply/maybe/skip, fit score та ризики.",
              ],
              [
                "Resume-правки",
                "Результат показує, що змінити в резюме під конкретну роль.",
              ],
              [
                "Salary talking points",
                "Отримуєте аргументи для рекрутера, hiring manager і зарплатної розмови.",
              ],
            ].map(([title, description]) => (
              <div
                key={title}
                className="rounded-[1.25rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.72)] p-4"
              >
                <div className="flex items-center gap-3">
                  <p className="text-[0.98rem] font-semibold text-[var(--text-strong)]">
                    {title}
                  </p>
                </div>
                <p className="mt-3 text-[0.88rem] leading-[1.62] text-[var(--text-muted)]">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
