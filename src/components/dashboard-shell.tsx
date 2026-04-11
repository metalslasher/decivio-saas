"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuthDialog } from "@/components/auth-dialog-provider";
import { formatUah, pricingPlans } from "@/lib/pricing";
import { getSupabaseBrowserClient } from "@/lib/db/supabase-browser";

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
        createdAt: string | null;
      };
      profile: {
        locale: string | null;
        timezone: string | null;
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
  locale?: string | null;
  timezone?: string | null;
  created_at?: string | null;
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

type ModuleCard = {
  title: string;
  description: string;
  statusLabel: string;
  tone: "live" | "future";
  href?: string;
  cta?: string;
};

const dateFormatter = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "long",
  year: "numeric"
});

const dateTimeFormatter = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit"
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : dateFormatter.format(parsed);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : dateTimeFormatter.format(parsed);
}

function formatDisplayName(fullName: string | null | undefined, email: string) {
  const normalizedName = fullName?.trim();
  if (normalizedName) {
    return normalizedName;
  }

  const localPart = email.split("@")[0]?.trim() ?? "";
  if (!localPart) {
    return "У вашому кабінеті";
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
    return "Оплата потребує уваги";
  }

  if (plan === "pro" && status === "canceled") {
    return "Pro зупинено";
  }

  return "Безкоштовний доступ";
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

function probabilityLabel(value: number | null) {
  if (value === null) {
    return null;
  }

  const normalized = value <= 1 ? value * 100 : value;
  return `${Math.round(normalized)}% шанс входу`;
}

function ModuleCard({ title, description, statusLabel, tone, href, cta }: ModuleCard) {
  const badgeClasses =
    tone === "live"
      ? "border-[rgba(63,94,255,0.18)] bg-[rgba(238,242,255,0.88)] text-[var(--accent-strong)]"
      : "border-[var(--line-soft)] bg-[rgba(255,255,255,0.76)] text-[var(--text-muted)]";

  return (
    <article className="surface-panel flex h-full flex-col rounded-[1.9rem] p-5 md:p-6">
      <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${badgeClasses}`}>
        {statusLabel}
      </span>
      <h3 className="panel-title mt-4">{title}</h3>
      <p className="mt-3 text-[0.95rem] leading-[1.72] text-[var(--text-muted)]">{description}</p>

      <div className="mt-auto pt-5">
        {href && cta ? (
          <Link href={href} className={tone === "live" ? "btn-primary" : "btn-secondary"}>
            {cta}
          </Link>
        ) : (
          <span className="inline-flex rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.72)] px-4 py-2 text-sm font-semibold text-[var(--text-soft)]">
            Скоро тут
          </span>
        )}
      </div>
    </article>
  );
}

function DashboardSkeleton() {
  return (
    <section className="space-y-6 py-4 md:space-y-8 md:py-8">
      <div className="surface-panel rounded-[2.2rem] p-6 md:p-8">
        <div className="h-4 w-32 rounded-full bg-[rgba(223,229,241,0.9)]" />
        <div className="mt-4 h-12 max-w-xl rounded-[1.2rem] bg-[rgba(223,229,241,0.9)]" />
        <div className="mt-4 h-5 max-w-2xl rounded-full bg-[rgba(223,229,241,0.8)]" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="surface-panel rounded-[1.8rem] p-5 md:p-6">
            <div className="h-4 w-24 rounded-full bg-[rgba(223,229,241,0.9)]" />
            <div className="mt-4 h-10 w-32 rounded-[1rem] bg-[rgba(223,229,241,0.8)]" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function DashboardShell() {
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
        supabase.from("profiles").select("email, full_name, locale, timezone, created_at").eq("id", userId).maybeSingle(),
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
          displayName: formatDisplayName(profile?.full_name, email),
          createdAt: profile?.created_at ?? session.user.created_at ?? null
        },
        profile: {
          locale: profile?.locale ?? null,
          timezone: profile?.timezone ?? null
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
    return (
      <section className="space-y-6 py-4 md:space-y-8 md:py-8">
        <div className="surface-panel rounded-[2.2rem] p-6 md:p-8">
          <span className="eyebrow-pill">Особистий кабінет</span>
          <h1 className="page-title mt-4 max-w-[14ch]">Кабінет відкривається після входу.</h1>
          <p className="lead-copy mt-4 max-w-3xl">
            Тут будуть ваш доступ, історія симуляцій, статус оплати і робоча панель з інструментами Decivio.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => openAuthDialog("login", { nextPath: "/dashboard" })} className="btn-secondary">
              Увійти
            </button>
            <button type="button" onClick={() => openAuthDialog("signup", { nextPath: "/dashboard" })} className="btn-primary">
              Створити акаунт
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="space-y-6 py-4 md:space-y-8 md:py-8">
        <div className="surface-panel rounded-[2.2rem] p-6 md:p-8">
          <span className="eyebrow-pill">Особистий кабінет</span>
          <h1 className="page-title mt-4 max-w-[14ch]">Кабінет тимчасово недоступний.</h1>
          <p className="lead-copy mt-4 max-w-3xl">{state.message}</p>
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

  const { user, profile, subscription, totalSimulations, recentSimulations } = state;
  const accessLabel = mapAccessLabel(subscription.plan, subscription.status);
  const accessPeriod = formatDate(subscription.currentPeriodEnd);
  const memberSince = formatDate(user.createdAt);
  const lastSimulation = recentSimulations[0] ?? null;
  const lastActivity = lastSimulation ? formatDateTime(lastSimulation.createdAt) : memberSince;
  const monthlyPlan = pricingPlans[0];

  const workspaceModules: ModuleCard[] = [
    {
      title: "Симуляція переходу",
      description: "Запускаєте новий сценарій і швидко перевіряєте, чи варто рухатись у новий напрям саме зараз.",
      statusLabel: "Доступно зараз",
      tone: "live",
      href: "/simulate",
      cta: "Запустити симуляцію"
    },
    {
      title: "Доступ і тарифи",
      description: "Перевіряєте свій статус доступу і вирішуєте, коли відкривати повний набір інструментів.",
      statusLabel: subscription.plan === "pro" ? "Pro активний" : "Готово до підключення",
      tone: "live",
      href: "/pricing",
      cta: subscription.plan === "pro" ? "Подивитися доступ" : "Перейти до тарифів"
    },
    {
      title: "Історія переходів",
      description: "Тут зберігатимуться ваші останні сценарії, щоб повертатися до них і порівнювати рішення.",
      statusLabel: totalSimulations > 0 ? "Є збереження" : "Чекає на першу симуляцію",
      tone: "live",
      href: "/simulate",
      cta: totalSimulations > 0 ? "Порахувати новий сценарій" : "Створити перший сценарій"
    },
    {
      title: "Резюме під цільову роль",
      description: "Модуль для пакування досвіду під нову позицію з’явиться тут окремим блоком кабінету.",
      statusLabel: "Готуємо",
      tone: "future"
    },
    {
      title: "Перевірка вакансій",
      description: "Після запуску тут можна буде швидко звіряти вакансії з вашим профілем і бачити прогалини.",
      statusLabel: "Готуємо",
      tone: "future"
    },
    {
      title: "Підготовка до співбесід",
      description: "Окремий модуль з питаннями, тренуванням відповідей і підказками також з’явиться в кабінеті.",
      statusLabel: "Готуємо",
      tone: "future"
    }
  ];

  return (
    <section className="space-y-6 py-4 md:space-y-8 md:py-8">
      <div className="surface-panel rounded-[2.2rem] p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr] lg:items-start">
          <div>
            <span className="eyebrow-pill">Особистий кабінет</span>
            <h1 className="page-title mt-4 max-w-[15ch]">{user.displayName}, тут зібраний ваш робочий простір.</h1>
            <p className="lead-copy mt-4 max-w-3xl">
              Керуйте доступом, повертайтесь до своїх сценаріїв і запускайте нові переходи з одного місця, без зайвого шуму.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/simulate" className="btn-primary">
                Нова симуляція
              </Link>
              <Link href="/pricing" className="btn-secondary">
                Тарифи і доступ
              </Link>
            </div>
          </div>

          <article className="surface-soft rounded-[1.9rem] p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="label-muted">Акаунт</p>
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${accessBadgeClasses(subscription.plan, subscription.status)}`}>
                {accessLabel}
              </span>
            </div>

            <div className="mt-4 space-y-3 text-[0.95rem] leading-[1.72] text-[var(--text-muted)]">
              <p>
                <span className="font-semibold text-[var(--text-strong)]">Email:</span> {user.email}
              </p>
              <p>
                <span className="font-semibold text-[var(--text-strong)]">У системі:</span> {memberSince ?? "щойно"}
              </p>
              <p>
                <span className="font-semibold text-[var(--text-strong)]">Мова:</span> {profile.locale ?? "uk"}
              </p>
              <p>
                <span className="font-semibold text-[var(--text-strong)]">Часовий пояс:</span> {profile.timezone ?? "Europe/Kiev"}
              </p>
            </div>
          </article>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="surface-panel rounded-[1.8rem] p-5 md:p-6">
          <p className="label-muted">Доступ</p>
          <p className="mt-3 font-display text-[1.9rem] font-bold leading-[0.96] tracking-[-0.05em] text-[var(--text-strong)]">
            {accessLabel}
          </p>
          <p className="mt-2 text-[0.93rem] leading-[1.68] text-[var(--text-muted)]">
            {accessPeriod
              ? `Поточний період активний до ${accessPeriod}.`
              : `Зараз у вас базовий рівень доступу. Повний набір відкривається від ${formatUah(monthlyPlan.billedNowUah)}.`}
          </p>
        </article>

        <article className="surface-panel rounded-[1.8rem] p-5 md:p-6">
          <p className="label-muted">Збережені сценарії</p>
          <p className="mt-3 font-display text-[1.9rem] font-bold leading-[0.96] tracking-[-0.05em] text-[var(--text-strong)]">
            {totalSimulations}
          </p>
          <p className="mt-2 text-[0.93rem] leading-[1.68] text-[var(--text-muted)]">
            {totalSimulations > 0
              ? "Усі нові симуляції поступово збираються в кабінеті, щоб ви могли повертатися до контексту."
              : "Після першої симуляції тут з’явиться історія ваших переходів і статус кожного сценарію."}
          </p>
        </article>

        <article className="surface-panel rounded-[1.8rem] p-5 md:p-6">
          <p className="label-muted">Остання активність</p>
          <p className="mt-3 font-display text-[1.55rem] font-bold leading-[1.02] tracking-[-0.05em] text-[var(--text-strong)]">
            {lastActivity ?? "Ще немає дій"}
          </p>
          <p className="mt-2 text-[0.93rem] leading-[1.68] text-[var(--text-muted)]">
            {lastSimulation
              ? "Останній сценарій можна використати як відправну точку для нового рішення."
              : "Кабінет готовий. Далі все починається з першої симуляції переходу."}
          </p>
        </article>
      </div>

      <section className="space-y-4">
        <div className="max-w-3xl">
          <h2 className="section-title">Що у вас під рукою</h2>
          <p className="lead-copy mt-3">
            Тут зібрані всі ключові елементи сервісу: те, чим уже можна користуватися зараз, і модулі, які з’являться в кабінеті далі.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workspaceModules.map((item) => (
            <ModuleCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
        <section className="surface-panel rounded-[2rem] p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="label-muted">Історія симуляцій</p>
              <h2 className="mt-3 section-title">Останні сценарії у кабінеті</h2>
            </div>
            <Link href="/simulate" className="btn-secondary">
              Нова симуляція
            </Link>
          </div>

          {recentSimulations.length > 0 ? (
            <div className="mt-5 space-y-3">
              {recentSimulations.map((simulation) => {
                const roleLabel =
                  simulation.currentRole && simulation.targetRole
                    ? `${simulation.currentRole} → ${simulation.targetRole}`
                    : simulation.targetRole ?? simulation.currentRole ?? "Карʼєрний сценарій";
                const verdict = verdictLabel(simulation.verdictLabel);
                const probability = probabilityLabel(simulation.probabilityOfGettingJob);
                const createdAt = formatDateTime(simulation.createdAt);
                const targetMarket = mapTargetMarketLabel(simulation.targetMarket);
                const priority = mapPriorityLabel(simulation.transitionPriority);

                return (
                  <article key={simulation.id} className="surface-soft rounded-[1.6rem] p-4 md:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="panel-title text-[1.12rem]">{roleLabel}</h3>
                        <p className="mt-2 text-sm leading-[1.68] text-[var(--text-muted)]">
                          {createdAt ? `Створено ${createdAt}.` : "Сценарій збережено в кабінеті."}
                        </p>
                      </div>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${simulationStatusClasses(simulation.status)}`}>
                        {simulationStatusLabel(simulation.status)}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-[0.8rem] font-semibold text-[var(--text-muted)]">
                      {verdict ? <span className="rounded-full border border-[var(--line-soft)] bg-white/70 px-3 py-1.5">{verdict}</span> : null}
                      {probability ? <span className="rounded-full border border-[var(--line-soft)] bg-white/70 px-3 py-1.5">{probability}</span> : null}
                      {targetMarket ? <span className="rounded-full border border-[var(--line-soft)] bg-white/70 px-3 py-1.5">{targetMarket}</span> : null}
                      {priority ? <span className="rounded-full border border-[var(--line-soft)] bg-white/70 px-3 py-1.5">Фокус: {priority}</span> : null}
                      {simulation.ceilingGapMedian !== null ? (
                        <span className="rounded-full border border-[var(--line-soft)] bg-white/70 px-3 py-1.5">
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
            <div className="mt-5 rounded-[1.7rem] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.62)] p-5 md:p-6">
              <h3 className="panel-title text-[1.12rem]">Історія ще порожня</h3>
              <p className="mt-3 text-[0.95rem] leading-[1.72] text-[var(--text-muted)]">
                Коли ви почнете рахувати сценарії переходу вже з акаунта, вони з’являться тут як окремі записи з датою і статусом.
              </p>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <article className="surface-panel rounded-[2rem] p-5 md:p-6">
            <p className="label-muted">Доступ і оплата</p>
            <h2 className="mt-3 section-title">Статус вашого доступу</h2>
            <p className="body-copy mt-3">
              {subscription.plan === "pro"
                ? "Платний доступ уже закріплений за вашим акаунтом. Усі майбутні модулі відкриватимуться тут без додаткового входу."
                : "Зараз у вас базовий доступ. Коли будете готові рухатися глибше, тут же можна буде контролювати платний рівень і пов’язані інструменти."}
            </p>

            <div className="mt-5 space-y-3">
              <div className="surface-soft rounded-[1.45rem] px-4 py-4">
                <p className="text-sm font-semibold text-[var(--text-strong)]">Поточний статус</p>
                <p className="mt-2 text-[0.95rem] leading-[1.72] text-[var(--text-muted)]">{accessLabel}</p>
              </div>
              <div className="surface-soft rounded-[1.45rem] px-4 py-4">
                <p className="text-sm font-semibold text-[var(--text-strong)]">Історія платежів</p>
                <p className="mt-2 text-[0.95rem] leading-[1.72] text-[var(--text-muted)]">
                  Після першої оплати в цьому блоці з’являться записи по білінгу і змінах статусу доступу.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <Link href="/pricing" className="btn-primary">
                Переглянути тарифи
              </Link>
            </div>
          </article>

          <article className="surface-panel rounded-[2rem] p-5 md:p-6">
            <p className="label-muted">Наступний крок</p>
            <h2 className="mt-3 section-title">
              {totalSimulations > 0 ? "Пора рухати наступний сценарій" : "Почніть із першої симуляції"}
            </h2>
            <p className="body-copy mt-3">
              {totalSimulations > 0
                ? "У вас уже є база в кабінеті. Найкращий наступний крок зараз — порахувати ще один маршрут переходу або перейти до повного доступу."
                : "Перший результат дасть точку опори для всього іншого: історії, доступу і майбутніх модулів, які з’являться в кабінеті."}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/simulate" className="btn-primary">
                {totalSimulations > 0 ? "Запустити ще одну симуляцію" : "Запустити першу симуляцію"}
              </Link>
              <Link href="/pricing" className="btn-secondary">
                Подивитися Pro
              </Link>
            </div>
          </article>
        </section>
      </div>
    </section>
  );
}
