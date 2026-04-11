"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuthDialog } from "@/components/auth-dialog-provider";
import { getSupabaseBrowserClient } from "@/lib/db/supabase-browser";
import { formatUah, paidFeatureSections, pricingPlans } from "@/lib/pricing";

type DashboardView = "overview" | "scenarios" | "access" | "tools";

type DashboardState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      user: {
        id: string;
        email: string;
        displayName: string;
      };
      subscription: {
        plan: "free" | "pro";
        status: "free" | "trial" | "active" | "canceled" | "past_due";
        currentPeriodEnd: string | null;
      };
      totalSimulations: number;
      recentSimulations: DashboardSimulation[];
    };

type DashboardSimulation = {
  id: string;
  createdAt: string;
  status: string;
  currentRole: string | null;
  targetRole: string | null;
  targetMarket: string | null;
  transitionPriority: string | null;
  verdictLabel: string | null;
  probabilityOfGettingJob: number | null;
  ceilingGapMedian: number | null;
};

type ProfileRow = {
  email?: string | null;
  full_name?: string | null;
};

type SubscriptionRow = {
  status?: "free" | "trial" | "active" | "canceled" | "past_due" | null;
  plan?: "free" | "pro" | null;
  current_period_end?: string | null;
};

type SimulationRow = {
  id: string;
  created_at: string;
  status?: string | null;
  inputs?: unknown;
};

type SimulationResultRow = {
  simulation_id: string;
  summary_metrics?: unknown;
};

type DashboardNavItem = {
  view: DashboardView;
  label: string;
  helper: string;
};

type DashboardAccessState = {
  plan: "free" | "pro";
  status: "free" | "trial" | "active" | "canceled" | "past_due";
  currentPeriodEnd: string | null;
};

const dateFormatter = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit"
});

const dashboardNavItems: DashboardNavItem[] = [
  { view: "overview", label: "Огляд", helper: "Швидкі дії та ключові блоки" },
  { view: "scenarios", label: "Сценарії", helper: "Історія переходів і нові розрахунки" },
  { view: "access", label: "Доступ", helper: "План, оплата й активний статус" },
  { view: "tools", label: "Інструменти", helper: "Модулі, які підключатимуться далі" }
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : dateFormatter.format(parsed);
}

function formatDisplayName(fullName: string | null | undefined, email: string) {
  const normalizedName = fullName?.trim();
  if (normalizedName) {
    return normalizedName;
  }

  const localPart = email.split("@")[0]?.trim() ?? "";
  if (!localPart) {
    return "Ваш кабінет";
  }

  return localPart.charAt(0).toUpperCase() + localPart.slice(1);
}

function mapTargetMarketLabel(value: string | null) {
  switch (value) {
    case "ukraine":
      return "Україна";
    case "remote":
      return "Remote";
    case "abroad":
      return "За кордоном";
    default:
      return null;
  }
}

function mapPriorityLabel(value: string | null) {
  switch (value) {
    case "speed":
      return "Швидкість";
    case "income":
      return "Дохід";
    default:
      return null;
  }
}

function mapAccessLabel(plan: "free" | "pro", status: "free" | "trial" | "active" | "canceled" | "past_due") {
  if (plan === "pro" && status === "active") {
    return "Pro активний";
  }

  if (plan === "pro" && status === "trial") {
    return "Пробний Pro";
  }

  if (plan === "pro" && status === "past_due") {
    return "Потрібна увага до оплати";
  }

  if (plan === "pro" && status === "canceled") {
    return "Pro призупинено";
  }

  return "Базовий доступ";
}

function accessBadgeClasses(plan: "free" | "pro", status: "free" | "trial" | "active" | "canceled" | "past_due") {
  if (plan === "pro" && (status === "active" || status === "trial")) {
    return "border-emerald-200/80 bg-emerald-50 text-emerald-700";
  }

  if (status === "past_due") {
    return "border-[rgba(201,155,134,0.5)] bg-[var(--danger-soft)] text-[var(--danger-strong)]";
  }

  return "border-[rgba(63,94,255,0.18)] bg-[rgba(238,242,255,0.9)] text-[var(--accent-strong)]";
}

function simulationStatusLabel(status: string) {
  switch (status) {
    case "completed":
      return "Готово";
    case "processing":
      return "Обробка";
    case "failed":
      return "Помилка";
    case "pending":
      return "Черга";
    default:
      return "Чернетка";
  }
}

function simulationStatusClasses(status: string) {
  switch (status) {
    case "completed":
      return "border-emerald-200/80 bg-emerald-50 text-emerald-700";
    case "failed":
      return "border-[rgba(201,155,134,0.5)] bg-[var(--danger-soft)] text-[var(--danger-strong)]";
    default:
      return "border-[rgba(63,94,255,0.18)] bg-[rgba(238,242,255,0.88)] text-[var(--accent-strong)]";
  }
}

function verdictLabel(value: string | null) {
  switch (value) {
    case "switch":
      return "Перехід має сенс";
    case "depends":
      return "Потрібен обережний сценарій";
    case "stay":
      return "Поточний шлях поки сильніший";
    default:
      return null;
  }
}

function probabilityLabel(value: number | null) {
  if (value === null) {
    return null;
  }

  const normalized = value <= 1 ? value * 100 : value;
  return `${Math.round(normalized)}% шанс входу`;
}

function extractSimulationSnapshot(simulation: SimulationRow, result: SimulationResultRow | null): DashboardSimulation {
  const inputs = isRecord(simulation.inputs) ? simulation.inputs : null;
  const metrics = result?.summary_metrics && isRecord(result.summary_metrics) ? result.summary_metrics : null;

  return {
    id: simulation.id,
    createdAt: simulation.created_at,
    status: toNonEmptyString(simulation.status) ?? "pending",
    currentRole: toNonEmptyString(inputs?.current_role),
    targetRole: toNonEmptyString(inputs?.target_role),
    targetMarket: toNonEmptyString(inputs?.target_market),
    transitionPriority: toNonEmptyString(inputs?.transition_priority),
    verdictLabel: toNonEmptyString(metrics?.verdict_label),
    probabilityOfGettingJob: toNumber(metrics?.probability_of_getting_job_within_12_months),
    ceilingGapMedian: toNumber(metrics?.ceiling_gap_median)
  };
}

function getDashboardView(value: string | null): DashboardView {
  return value === "scenarios" || value === "access" || value === "tools" ? value : "overview";
}

function getDashboardHref(view: DashboardView) {
  return view === "overview" ? "/dashboard" : `/dashboard?view=${view}`;
}

function DashboardSkeleton() {
  return (
    <section className="grid gap-5 py-4 lg:grid-cols-[18rem,minmax(0,1fr)] lg:gap-6 lg:py-8">
      <div className="surface-panel rounded-[2rem] p-5">
        <div className="h-10 w-full rounded-[1rem] bg-[rgba(223,229,241,0.8)]" />
        <div className="mt-3 h-10 w-full rounded-[1rem] bg-[rgba(223,229,241,0.72)]" />
        <div className="mt-3 h-10 w-full rounded-[1rem] bg-[rgba(223,229,241,0.72)]" />
      </div>

      <div className="space-y-4">
        <div className="surface-panel rounded-[2rem] p-6">
          <div className="h-5 w-28 rounded-full bg-[rgba(223,229,241,0.84)]" />
          <div className="mt-4 h-14 max-w-xl rounded-[1.2rem] bg-[rgba(223,229,241,0.9)]" />
          <div className="mt-4 h-5 max-w-2xl rounded-full bg-[rgba(223,229,241,0.8)]" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="surface-panel rounded-[1.6rem] p-5">
              <div className="h-4 w-20 rounded-full bg-[rgba(223,229,241,0.84)]" />
              <div className="mt-4 h-10 w-28 rounded-[1rem] bg-[rgba(223,229,241,0.8)]" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardGuest({ onLogin, onSignup }: { onLogin: () => void; onSignup: () => void }) {
  return (
    <section className="space-y-6 py-4 md:space-y-8 md:py-8">
      <div className="surface-panel rounded-[2.2rem] p-6 md:p-8">
        <span className="eyebrow-pill">Особистий кабінет</span>
        <h1 className="page-title mt-4 max-w-[13ch]">Кабінет відкривається після входу.</h1>
        <p className="lead-copy mt-4 max-w-2xl">
          Після авторизації тут з’явиться робочий простір з навігацією по сценаріях, доступу й інструментах сервісу.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={onLogin} className="btn-secondary">
            Увійти
          </button>
          <button type="button" onClick={onSignup} className="btn-primary">
            Створити акаунт
          </button>
        </div>
      </div>
    </section>
  );
}

function DashboardError({ message }: { message: string }) {
  return (
    <section className="space-y-6 py-4 md:space-y-8 md:py-8">
      <div className="surface-panel rounded-[2.2rem] p-6 md:p-8">
        <span className="eyebrow-pill">Особистий кабінет</span>
        <h1 className="page-title mt-4 max-w-[13ch]">Кабінет тимчасово недоступний.</h1>
        <p className="lead-copy mt-4 max-w-2xl">{message}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/simulate" className="btn-primary">
            Перейти до симуляції
          </Link>
          <Link href="/" className="btn-secondary">
            На головну
          </Link>
        </div>
      </div>
    </section>
  );
}

function DashboardSidebar({
  activeView,
  totalSimulations,
  accessLabel
}: {
  activeView: DashboardView;
  totalSimulations: number;
  accessLabel: string;
}) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <div className="surface-panel rounded-[2rem] p-4 md:p-5">
        <p className="label-muted">Навігація</p>

        <nav className="mt-4 space-y-2" aria-label="Розділи кабінету">
          {dashboardNavItems.map((item) => {
            const isActive = item.view === activeView;

            return (
              <Link
                key={item.view}
                href={getDashboardHref(item.view)}
                className={`flex rounded-[1.35rem] px-4 py-3 transition ${
                  isActive
                    ? "bg-[rgba(67,97,255,0.12)] text-[var(--accent-strong)] shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]"
                    : "bg-[rgba(255,255,255,0.56)] text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.84)] hover:text-[var(--text-strong)]"
                }`}
              >
                <span className="block">
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="mt-1 block text-xs leading-[1.5] opacity-80">{item.helper}</span>
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="surface-panel rounded-[2rem] p-4 md:p-5">
        <p className="label-muted">Швидкий стан</p>

        <div className="mt-4 space-y-3 text-sm leading-[1.65] text-[var(--text-muted)]">
          <div className="rounded-[1.2rem] bg-[rgba(255,255,255,0.7)] px-4 py-3">
            <span className="block text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">Доступ</span>
            <span className="mt-2 block font-semibold text-[var(--text-strong)]">{accessLabel}</span>
          </div>

          <div className="rounded-[1.2rem] bg-[rgba(255,255,255,0.7)] px-4 py-3">
            <span className="block text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">Сценарії</span>
            <span className="mt-2 block font-semibold text-[var(--text-strong)]">{totalSimulations} збережено</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function MetricCard({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <article className="surface-panel rounded-[1.7rem] p-5 md:p-6">
      <p className="label-muted">{label}</p>
      <p className="mt-3 font-display text-[1.8rem] font-bold leading-[0.98] tracking-[-0.05em] text-[var(--text-strong)]">{value}</p>
      <p className="mt-2 text-[0.93rem] leading-[1.68] text-[var(--text-muted)]">{description}</p>
    </article>
  );
}

function DashboardOverview({
  userDisplayName,
  accessLabel,
  subscription,
  totalSimulations,
  lastSimulation
}: {
  userDisplayName: string;
  accessLabel: string;
  subscription: DashboardAccessState;
  totalSimulations: number;
  lastSimulation: DashboardSimulation | null;
}) {
  const monthlyPlan = pricingPlans[0];
  const lastActivity = lastSimulation ? formatDateTime(lastSimulation.createdAt) : null;
  const accessPeriod = subscription.currentPeriodEnd ? formatDateTime(subscription.currentPeriodEnd) : null;
  const statusDescription =
    subscription.plan === "pro"
      ? accessPeriod
        ? `Активний період доступу триває до ${accessPeriod}.`
        : "Платний доступ уже прив’язаний до вашого акаунта."
      : `Базовий рівень активний. Повний доступ відкривається від ${formatUah(monthlyPlan.billedNowUah)}.`;

  return (
    <div className="space-y-5">
      <div className="surface-panel rounded-[2.2rem] p-6 md:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.12fr,0.88fr] xl:items-start">
          <div>
            <span className="eyebrow-pill">Робочий простір</span>
            <h1 className="page-title mt-4 max-w-[14ch]">{userDisplayName}, тут ваш центр керування Decivio.</h1>
            <p className="lead-copy mt-4 max-w-3xl">
              Запускайте нові сценарії, повертайтеся до історії переходів і тримайте під контролем доступ до сервісу без лендингового шуму.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/simulate" className="btn-primary">
                Запустити симуляцію
              </Link>
              <Link href={getDashboardHref("scenarios")} className="btn-secondary">
                Відкрити історію
              </Link>
            </div>
          </div>

          <div className="surface-soft rounded-[1.8rem] p-5 md:p-6">
            <p className="label-muted">Що зараз під рукою</p>
            <div className="mt-4 space-y-3 text-[0.95rem] leading-[1.72] text-[var(--text-muted)]">
              <p className="rounded-[1.2rem] bg-[rgba(255,255,255,0.7)] px-4 py-3">
                Основний сценарний інструмент уже доступний і готовий до нового розрахунку.
              </p>
              <p className="rounded-[1.2rem] bg-[rgba(255,255,255,0.7)] px-4 py-3">
                Історія зберігає останні переходи, щоб порівнювати рішення без повторного заповнення всього з нуля.
              </p>
              <p className="rounded-[1.2rem] bg-[rgba(255,255,255,0.7)] px-4 py-3">
                Доступ і майбутні інструменти винесені в окремі розділи, а не змішані в одному екрані.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Доступ" value={accessLabel} description={statusDescription} />
        <MetricCard
          label="Сценарії"
          value={`${totalSimulations}`}
          description={
            totalSimulations > 0
              ? "У кабінеті вже є база для порівняння наступних рішень."
              : "Після першої симуляції тут з’явиться історія переходів."
          }
        />
        <MetricCard
          label="Остання активність"
          value={lastActivity ?? "Ще не було"}
          description={
            lastSimulation
              ? "Останній збережений сценарій можна використати як відправну точку для нового розрахунку."
              : "Кабінет готовий. Наступний крок — перша симуляція переходу."
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="surface-panel rounded-[1.8rem] p-5 md:p-6">
          <p className="label-muted">Симуляція</p>
          <h2 className="mt-3 panel-title">Старт нового сценарію</h2>
          <p className="mt-3 text-[0.95rem] leading-[1.72] text-[var(--text-muted)]">
            Перейдіть до симуляції, щоб прорахувати новий маршрут переходу з урахуванням доходу, ризику і стелі ролі.
          </p>
          <Link href="/simulate" className="btn-primary mt-5">
            Нова симуляція
          </Link>
        </article>

        <article className="surface-panel rounded-[1.8rem] p-5 md:p-6">
          <p className="label-muted">Історія</p>
          <h2 className="mt-3 panel-title">Повернення до сценаріїв</h2>
          <p className="mt-3 text-[0.95rem] leading-[1.72] text-[var(--text-muted)]">
            В окремому розділі зібрані останні переходи, щоб не тримати весь архів у головному екрані кабінету.
          </p>
          <Link href={getDashboardHref("scenarios")} className="btn-secondary mt-5">
            Відкрити сценарії
          </Link>
        </article>

        <article className="surface-panel rounded-[1.8rem] p-5 md:p-6">
          <p className="label-muted">Інструменти</p>
          <h2 className="mt-3 panel-title">Що підключатиметься далі</h2>
          <p className="mt-3 text-[0.95rem] leading-[1.72] text-[var(--text-muted)]">
            Резюме, вакансії та підготовка до співбесід будуть винесені в окремі секції кабінету, а не змішані з поточним функціоналом.
          </p>
          <Link href={getDashboardHref("tools")} className="btn-secondary mt-5">
            Подивитися структуру
          </Link>
        </article>
      </div>
    </div>
  );
}

function DashboardScenarios({ recentSimulations }: { recentSimulations: DashboardSimulation[] }) {
  return (
    <div className="space-y-5">
      <div className="surface-panel rounded-[2rem] p-6 md:p-8">
        <span className="eyebrow-pill">Сценарії</span>
        <h1 className="page-title mt-4 max-w-[12ch]">Історія переходів і нові розрахунки.</h1>
        <p className="lead-copy mt-4 max-w-3xl">
          Тут зібрані останні сценарії, щоб повертатися до них окремо, а не тримати їх у головному екрані кабінету.
        </p>

        <div className="mt-6">
          <Link href="/simulate" className="btn-primary">
            Запустити нову симуляцію
          </Link>
        </div>
      </div>

      {recentSimulations.length > 0 ? (
        <div className="grid gap-4">
          {recentSimulations.map((simulation) => {
            const roleLabel =
              simulation.currentRole && simulation.targetRole
                ? `${simulation.currentRole} → ${simulation.targetRole}`
                : simulation.targetRole ?? simulation.currentRole ?? "Кар’єрний сценарій";
            const verdict = verdictLabel(simulation.verdictLabel);
            const probability = probabilityLabel(simulation.probabilityOfGettingJob);
            const createdAt = formatDateTime(simulation.createdAt);
            const targetMarket = mapTargetMarketLabel(simulation.targetMarket);
            const priority = mapPriorityLabel(simulation.transitionPriority);

            return (
              <article key={simulation.id} className="surface-panel rounded-[1.8rem] p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="panel-title">{roleLabel}</h2>
                    <p className="mt-2 text-sm leading-[1.68] text-[var(--text-muted)]">
                      {createdAt ? `Збережено ${createdAt}.` : "Сценарій збережено у вашому кабінеті."}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${simulationStatusClasses(simulation.status)}`}>
                    {simulationStatusLabel(simulation.status)}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-[0.8rem] font-semibold text-[var(--text-muted)]">
                  {verdict ? <span className="rounded-full border border-[var(--line-soft)] bg-white/76 px-3 py-1.5">{verdict}</span> : null}
                  {probability ? <span className="rounded-full border border-[var(--line-soft)] bg-white/76 px-3 py-1.5">{probability}</span> : null}
                  {targetMarket ? <span className="rounded-full border border-[var(--line-soft)] bg-white/76 px-3 py-1.5">{targetMarket}</span> : null}
                  {priority ? <span className="rounded-full border border-[var(--line-soft)] bg-white/76 px-3 py-1.5">Фокус: {priority}</span> : null}
                  {simulation.ceilingGapMedian !== null ? (
                    <span className="rounded-full border border-[var(--line-soft)] bg-white/76 px-3 py-1.5">
                      Стеля: {simulation.ceilingGapMedian > 0 ? "+" : ""}
                      {formatUah(Math.abs(Math.round(simulation.ceilingGapMedian))).replace(" грн", "")} грн
                    </span>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="surface-panel rounded-[2rem] p-6 md:p-8">
          <h2 className="panel-title">Історія ще порожня</h2>
          <p className="mt-3 text-[0.96rem] leading-[1.72] text-[var(--text-muted)]">
            Коли ви почнете рахувати сценарії вже з акаунта, вони з’являться тут окремими записами з базовим статусом і коротким контекстом.
          </p>
          <Link href="/simulate" className="btn-primary mt-5">
            Створити перший сценарій
          </Link>
        </div>
      )}
    </div>
  );
}

function DashboardAccess({
  accessLabel,
  subscription,
  email
}: {
  accessLabel: string;
  subscription: DashboardAccessState;
  email: string;
}) {
  const monthlyPlan = pricingPlans[0];
  const annualPlan = pricingPlans[1];

  return (
    <div className="space-y-5">
      <div className="surface-panel rounded-[2rem] p-6 md:p-8">
        <span className="eyebrow-pill">Доступ</span>
        <h1 className="page-title mt-4 max-w-[12ch]">Статус плану й оплати в одному місці.</h1>
        <p className="lead-copy mt-4 max-w-3xl">
          Тут тримається тільки те, що справді стосується доступу: ваш поточний рівень, куди прив’язаний акаунт і який крок логічний далі.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
        <article className="surface-panel rounded-[1.9rem] p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="label-muted">Поточний статус</p>
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${accessBadgeClasses(subscription.plan, subscription.status)}`}>
              {accessLabel}
            </span>
          </div>

          <div className="mt-5 space-y-3 text-[0.96rem] leading-[1.72] text-[var(--text-muted)]">
            <p className="rounded-[1.25rem] bg-[rgba(255,255,255,0.72)] px-4 py-4">
              Акаунт доступу закріплений за <span className="font-semibold text-[var(--text-strong)]">{email}</span>.
            </p>
            <p className="rounded-[1.25rem] bg-[rgba(255,255,255,0.72)] px-4 py-4">
              {subscription.plan === "pro"
                ? "Платний доступ уже закріплений. Тут далі з’являтиметься історія білінгу та зміни статусу."
                : "Зараз у вас базовий рівень. Коли будете готові відкривати повний стек інструментів, це керується звідси."}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/pricing" className="btn-primary">
              Переглянути тарифи
            </Link>
            <Link href="/checkout?plan=monthly" className="btn-secondary">
              Відкрити оплату
            </Link>
          </div>
        </article>

        <article className="surface-panel rounded-[1.9rem] p-5 md:p-6">
          <p className="label-muted">Орієнтир по планах</p>

          <div className="mt-5 space-y-3">
            <div className="surface-soft rounded-[1.45rem] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-[var(--text-strong)]">{monthlyPlan.name}</p>
                <span className="chip-positive">{formatUah(monthlyPlan.billedNowUah)}</span>
              </div>
              <p className="mt-2 text-[0.94rem] leading-[1.68] text-[var(--text-muted)]">{monthlyPlan.billingLabel}</p>
            </div>

            <div className="surface-soft rounded-[1.45rem] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-[var(--text-strong)]">{annualPlan.name}</p>
                <span className="chip-positive">{formatUah(annualPlan.billedNowUah)}</span>
              </div>
              <p className="mt-2 text-[0.94rem] leading-[1.68] text-[var(--text-muted)]">
                {annualPlan.billingLabel}. Економія {formatUah(annualPlan.savingsUah)} за рік.
              </p>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

function DashboardTools() {
  const roadmapItems = paidFeatureSections.flatMap((section) =>
    section.items.map((item) => ({
      section: section.heading,
      title: item.title,
      description: item.description
    }))
  );

  return (
    <div className="space-y-5">
      <div className="surface-panel rounded-[2rem] p-6 md:p-8">
        <span className="eyebrow-pill">Інструменти</span>
        <h1 className="page-title mt-4 max-w-[12ch]">Структура майбутніх модулів кабінету.</h1>
        <p className="lead-copy mt-4 max-w-3xl">
          Поки функції ще не підключені, тут уже видно логіку кабінету: кожен інструмент житиме у своєму окремому розділі, а не в одному перевантаженому екрані.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {roadmapItems.map((item) => (
          <article key={`${item.section}-${item.title}`} className="surface-panel rounded-[1.8rem] p-5 md:p-6">
            <span className="inline-flex rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.72)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {item.section}
            </span>
            <h2 className="panel-title mt-4">{item.title}</h2>
            <p className="mt-3 text-[0.95rem] leading-[1.72] text-[var(--text-muted)]">{item.description}</p>
            <span className="mt-5 inline-flex rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.72)] px-4 py-2 text-sm font-semibold text-[var(--text-soft)]">
              Скоро тут
            </span>
          </article>
        ))}
      </div>
    </div>
  );
}

export function DashboardShell({ requestedView }: { requestedView?: string | null }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { openAuthDialog } = useAuthDialog();
  const [state, setState] = useState<DashboardState>({ status: "loading" });

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      if (!isMounted) {
        return;
      }

      setState({ status: "loading" });

      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (sessionError) {
        setState({ status: "error", message: "Не вдалося перевірити сесію. Спробуйте оновити сторінку." });
        return;
      }

      if (!session?.user) {
        setState({ status: "guest" });
        return;
      }

      const userId = session.user.id;

      const [profileResponse, subscriptionResponse, countResponse, simulationsResponse] = await Promise.all([
        supabase.from("profiles").select("email, full_name").eq("id", userId).maybeSingle(),
        supabase.from("subscriptions").select("status, plan, current_period_end").eq("user_id", userId).maybeSingle(),
        supabase.from("simulations").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("simulations").select("id, created_at, status, inputs").eq("user_id", userId).order("created_at", { ascending: false }).limit(6)
      ]);

      if (!isMounted) {
        return;
      }

      if (countResponse.error || simulationsResponse.error) {
        setState({ status: "error", message: "Не вдалося завантажити дані кабінету. Спробуйте ще раз трохи пізніше." });
        return;
      }

      const simulations = (simulationsResponse.data ?? []) as SimulationRow[];
      const simulationIds = simulations.map((item) => item.id);

      let resultMap = new Map<string, SimulationResultRow>();
      if (simulationIds.length > 0) {
        const { data: results, error: resultsError } = await supabase
          .from("simulation_results")
          .select("simulation_id, summary_metrics")
          .in("simulation_id", simulationIds);

        if (!resultsError) {
          resultMap = new Map((results as SimulationResultRow[]).map((item) => [item.simulation_id, item]));
        }
      }

      const profile = (profileResponse.data ?? null) as ProfileRow | null;
      const subscriptionRow = (subscriptionResponse.data ?? null) as SubscriptionRow | null;
      const email = session.user.email?.trim() || profile?.email?.trim() || "account@decivio.local";
      const recentSimulations = simulations.map((item) => extractSimulationSnapshot(item, resultMap.get(item.id) ?? null));
      const derivedPlan = subscriptionRow?.plan === "pro" ? "pro" : "free";
      const derivedStatus =
        subscriptionRow?.status === "active" ||
        subscriptionRow?.status === "trial" ||
        subscriptionRow?.status === "canceled" ||
        subscriptionRow?.status === "past_due"
          ? subscriptionRow.status
          : "free";

      setState({
        status: "ready",
        user: {
          id: userId,
          email,
          displayName: formatDisplayName(profile?.full_name, email)
        },
        subscription: {
          plan: derivedPlan,
          status: derivedStatus,
          currentPeriodEnd: subscriptionRow?.current_period_end ?? null
        },
        totalSimulations: countResponse.count ?? simulations.length,
        recentSimulations
      });
    };

    void loadDashboard();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      void loadDashboard();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  if (state.status === "loading") {
    return <DashboardSkeleton />;
  }

  if (state.status === "guest") {
    return <DashboardGuest onLogin={() => openAuthDialog("login", { nextPath: "/dashboard" })} onSignup={() => openAuthDialog("signup", { nextPath: "/dashboard" })} />;
  }

  if (state.status === "error") {
    return <DashboardError message={state.message} />;
  }

  const activeView = getDashboardView(requestedView ?? null);
  const accessLabel = mapAccessLabel(state.subscription.plan, state.subscription.status);
  const lastSimulation = state.recentSimulations[0] ?? null;

  return (
    <section className="grid gap-5 py-4 lg:grid-cols-[18rem,minmax(0,1fr)] lg:gap-6 lg:py-8">
      <DashboardSidebar activeView={activeView} totalSimulations={state.totalSimulations} accessLabel={accessLabel} />

      <div className="min-w-0">
        {activeView === "overview" ? (
          <DashboardOverview
            userDisplayName={state.user.displayName}
            accessLabel={accessLabel}
            subscription={state.subscription}
            totalSimulations={state.totalSimulations}
            lastSimulation={lastSimulation}
          />
        ) : null}

        {activeView === "scenarios" ? <DashboardScenarios recentSimulations={state.recentSimulations} /> : null}
        {activeView === "access" ? <DashboardAccess accessLabel={accessLabel} subscription={state.subscription} email={state.user.email} /> : null}
        {activeView === "tools" ? <DashboardTools /> : null}
      </div>
    </section>
  );
}
