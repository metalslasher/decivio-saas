import {
  englishLevelOptions,
  experienceLevelOptions,
  parseStoredCareerSwitchInputs,
  type EnglishLevel,
  type ExperienceLevel,
} from "@/lib/career-switch-form";
import {
  jobSearchStageOptions,
  workPreferenceOptions,
  type JobSearchStage,
  type ProfileContext,
  type WorkPreference,
} from "@/lib/profile-context";
import { formatUah } from "@/lib/pricing";
import type {
  ChipTone,
  DashboardAccessState,
  DashboardProgressStep,
  DashboardSimulation,
  DashboardUserProfile,
  DashboardView,
  ProfileDraft,
  SimulationResultRow,
  SimulationRow,
} from "./types";

const dateFormatter = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const shortDateFormatter = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "short",
});

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function toNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const value = (error as { message?: unknown }).message;
    return typeof value === "string" ? value : "Unknown error";
  }

  return "Unknown error";
}

export function isMissingProfileExtensionSchema(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes("profile_context") || message.includes("avatar_url");
}

export function isMissingAvatarStorageSetup(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("avatars") &&
    (message.includes("bucket") ||
      message.includes("storage") ||
      message.includes("not found"))
  );
}

export function formatDisplayName(fullName: string | null | undefined, email: string) {
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

export function getFirstName(displayName: string) {
  return displayName.trim().split(/\s+/)[0] ?? displayName;
}

export function getShortProfileLabel(displayName: string, email: string) {
  const normalized = displayName.trim();
  if (normalized) {
    return normalized;
  }

  return email.split("@")[0]?.trim() ?? email;
}

export function getInitials(value: string) {
  const normalized = value.replace(/[^a-zA-Zа-яА-ЯіїєІЇЄґҐ0-9]+/g, " ").trim();
  const parts = normalized.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return (parts[0] ?? normalized.slice(0, 2) ?? "DC").slice(0, 2).toUpperCase();
}

export function mapTargetMarketLabel(value: string | null) {
  switch (value) {
    case "ukraine":
      return "ринок України";
    case "remote":
      return "віддалений ринок";
    case "abroad":
      return "ринок за кордоном";
    default:
      return null;
  }
}

export function mapPriorityLabel(value: string | null) {
  switch (value) {
    case "speed":
      return "швидкий вхід";
    case "income":
      return "зростання доходу";
    default:
      return null;
  }
}

export function mapExperienceLevelLabel(value: ExperienceLevel | null) {
  return (
    experienceLevelOptions.find((item) => item.value === value)?.label ?? null
  );
}

export function mapEnglishLevelLabel(value: EnglishLevel | null) {
  return (
    englishLevelOptions.find((item) => item.value === value)?.label ?? null
  );
}

export function mapWorkPreferenceLabel(value: WorkPreference | null) {
  return (
    workPreferenceOptions.find((item) => item.value === value)?.label ?? null
  );
}

export function mapJobSearchStageLabel(value: JobSearchStage | null) {
  return (
    jobSearchStageOptions.find((item) => item.value === value)?.label ?? null
  );
}

export function buildProfileCompletion(
  fullName: string | null,
  avatarUrl: string | null,
  context: ProfileContext,
) {
  let completion = 0;

  if (fullName) {
    completion += 10;
  }

  if (avatarUrl) {
    completion += 8;
  }

  if (context.current_role) {
    completion += 10;
  }

  if (context.target_role) {
    completion += 10;
  }

  if (context.current_income !== null) {
    completion += 7;
  }

  if (context.current_experience_years !== null) {
    completion += 7;
  }

  if (context.experience_level) {
    completion += 7;
  }

  if (context.english_level) {
    completion += 7;
  }

  if (context.target_market) {
    completion += 7;
  }

  if (context.transition_priority) {
    completion += 7;
  }

  if (context.city) {
    completion += 6;
  }

  if (context.weekly_learning_hours !== null) {
    completion += 6;
  }

  if (context.work_preference) {
    completion += 6;
  }

  if (context.job_search_stage) {
    completion += 6;
  }

  if (context.linkedin_url || context.portfolio_url) {
    completion += 6;
  }

  return Math.min(completion, 100);
}

export function buildMissingProfileItems(
  context: ProfileContext,
  fullName: string | null,
  avatarUrl: string | null,
) {
  const items: string[] = [];

  if (!fullName) {
    items.push("Додайте ім'я, щоб персоналізувати кабінет.");
  }

  if (!avatarUrl) {
    items.push("Завантажте аватар, щоб профіль був завершеним.");
  }

  if (!context.target_role) {
    items.push("Уточніть цільову роль для аналізу вакансій і подачі.");
  }

  if (!context.target_market) {
    items.push("Вкажіть ринок, на який орієнтуєтесь.");
  }

  if (context.weekly_learning_hours === null) {
    items.push("Додайте свій темп підготовки на тиждень.");
  }

  if (!context.job_search_stage) {
    items.push("Позначте стадію пошуку, щоб поради були точнішими.");
  }

  if (!context.linkedin_url && !context.portfolio_url) {
    items.push(
      "Додайте хоча б одне зовнішнє посилання на профіль або портфоліо.",
    );
  }

  return items.slice(0, 5);
}

export function buildProfileContextSeed(simulation: DashboardSimulation | null) {
  return simulation?.profileContextSeed ?? {};
}

export function getBrowserTimeZone() {
  if (typeof Intl === "undefined") {
    return null;
  }

  const value = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export function toDraftValue(value: string | number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

export function buildProfileDraft(
  profile: DashboardUserProfile,
  fallbackTimeZone: string | null,
): ProfileDraft {
  return {
    full_name: profile.fullName ?? "",
    timezone: profile.timezone ?? fallbackTimeZone ?? "",
    avatar_url: profile.avatarUrl,
    city: profile.context.city ?? "",
    current_income: toDraftValue(profile.context.current_income),
    current_role: profile.context.current_role ?? "",
    current_experience_years: toDraftValue(
      profile.context.current_experience_years,
    ),
    target_role: profile.context.target_role ?? "",
    experience_level: profile.context.experience_level ?? "",
    english_level: profile.context.english_level ?? "",
    target_market: profile.context.target_market ?? "",
    transition_priority: profile.context.transition_priority ?? "",
    weekly_learning_hours: toDraftValue(profile.context.weekly_learning_hours),
    work_preference: profile.context.work_preference ?? "",
    job_search_stage: profile.context.job_search_stage ?? "",
    linkedin_url: profile.context.linkedin_url ?? "",
    portfolio_url: profile.context.portfolio_url ?? "",
    focus_note: profile.context.focus_note ?? "",
  };
}

export function normalizeOptionalInput(value: string) {
  const normalized = value.trim();
  return normalized === "" ? null : normalized;
}

export function parseOptionalNumberInput(
  value: string,
  label: string,
  {
    min = 0,
    max,
    integer = false,
  }: { min?: number; max?: number; integer?: boolean } = {},
) {
  const normalized = value.trim();

  if (!normalized) {
    return { value: null as number | null, error: null as string | null };
  }

  const parsed = Number(normalized.replace(",", "."));
  if (!Number.isFinite(parsed)) {
    return { value: null, error: `${label}: введіть коректне число.` };
  }

  if (parsed < min) {
    return {
      value: null,
      error: `${label}: значення не може бути меншим за ${min}.`,
    };
  }

  if (typeof max === "number" && parsed > max) {
    return {
      value: null,
      error: `${label}: значення має бути не більшим за ${max}.`,
    };
  }

  if (integer && !Number.isInteger(parsed)) {
    return { value: null, error: `${label}: введіть ціле число.` };
  }

  return { value: parsed, error: null };
}

export function normalizeOptionalUrl(value: string, label: string) {
  const normalized = value.trim();

  if (!normalized) {
    return { value: null as string | null, error: null as string | null };
  }

  try {
    const url = new URL(normalized);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return {
        value: null,
        error: `${label}: використовуйте лише http або https.`,
      };
    }

    return { value: url.toString(), error: null };
  } catch {
    return { value: null, error: `${label}: введіть коректне посилання.` };
  }
}

export function mapAccessLabel(
  plan: "free" | "pro",
  status: "free" | "trial" | "active" | "canceled" | "past_due",
) {
  if (plan === "pro" && status === "active") {
    return "План Pro активний";
  }

  if (plan === "pro" && status === "trial") {
    return "Пробний період Pro";
  }

  if (plan === "pro" && status === "past_due") {
    return "Потрібна увага до оплати";
  }

  if (plan === "pro" && status === "canceled") {
    return "План Pro призупинено";
  }

  return "Базовий доступ";
}

export function hasPaidDashboardAccess(subscription: DashboardAccessState) {
  if (subscription.plan !== "pro") {
    return false;
  }

  if (subscription.status !== "active" && subscription.status !== "trial" && subscription.status !== "canceled") {
    return false;
  }

  if (!subscription.currentPeriodEnd) {
    return subscription.status === "active" || subscription.status === "trial";
  }

  return new Date(subscription.currentPeriodEnd).getTime() > Date.now();
}

export function accessTone(
  plan: "free" | "pro",
  status: "free" | "trial" | "active" | "canceled" | "past_due",
): ChipTone {
  if (plan === "pro" && (status === "active" || status === "trial")) {
    return "success";
  }

  if (status === "past_due") {
    return "gold";
  }

  return "accent";
}

export function simulationStatusLabel(status: string) {
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

export function verdictLabel(value: string | null) {
  switch (value) {
    case "switch":
      return "Перехід виглядає сильніше";
    case "depends":
      return "Потрібен обережний маршрут";
    case "stay":
      return "Поточний шлях поки сильніший";
    default:
      return null;
  }
}

export function probabilityLabel(value: number | null) {
  if (value === null) {
    return null;
  }

  const normalized = value <= 1 ? value * 100 : value;
  return `${Math.round(normalized)}% шанс входу`;
}

export function riskLevelLabel(value: string | null) {
  switch (value) {
    case "low":
      return "низький";
    case "medium":
      return "середній";
    case "high":
      return "високий";
    default:
      return null;
  }
}

export function buildLongTermDirectionInsight(
  value: string | null,
  simulation: Pick<DashboardSimulation, "currentRole" | "targetRole"> | null,
) {
  switch (value) {
    case "current_role":
      return simulation?.currentRole
        ? `У довшій перспективі сильнішим виглядає поточний напрям: ${simulation.currentRole}. Нові ролі краще перевіряти через конкретні вакансії.`
        : "У довшій перспективі сильнішим виглядає поточний напрям, тому нові ролі краще перевіряти через конкретні вакансії.";
    case "target_role":
      return simulation?.targetRole
        ? `У довшій перспективі сильнішим виглядає ${simulation.targetRole}. Саме цей напрям варто тримати як базовий для перевірки вакансій.`
        : "У довшій перспективі сильнішим виглядає цільовий напрям. Саме його варто тримати як базовий для перевірки вакансій.";
    case "balanced":
      return "У довшій перспективі обидва напрями виглядають близько, тому рішення краще приймати через конкретні вакансії, а не один абстрактний напрям.";
    default:
      return null;
  }
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : dateFormatter.format(parsed);
}

export function formatShortDate(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? null
    : shortDateFormatter.format(parsed);
}

export function formatSignedMoney(value: number | null) {
  if (value === null) {
    return null;
  }

  const rounded = Math.round(value);
  const sign = rounded > 0 ? "+" : rounded < 0 ? "-" : "";
  return `${sign}${formatUah(Math.abs(rounded))}`;
}

export function extractSimulationSnapshot(
  simulation: SimulationRow,
  result: SimulationResultRow | null,
): DashboardSimulation {
  const inputs = parseStoredCareerSwitchInputs(simulation.inputs);
  const metrics =
    result?.summary_metrics && isRecord(result.summary_metrics)
      ? result.summary_metrics
      : null;

  return {
    id: simulation.id,
    createdAt: simulation.created_at,
    status: toNonEmptyString(simulation.status) ?? "pending",
    currentRole: inputs?.current_role ?? null,
    targetRole: inputs?.target_role ?? null,
    targetMarket: inputs?.target_market ?? null,
    transitionPriority: inputs?.transition_priority ?? null,
    verdictLabel: toNonEmptyString(metrics?.verdict_label),
    betterLongTermDirection: toNonEmptyString(metrics?.better_long_term_direction),
    riskLevel: toNonEmptyString(metrics?.risk_level),
    probabilityOfGettingJob: toNumber(
      metrics?.probability_of_getting_job_within_12_months,
    ),
    ceilingGapMedian: toNumber(metrics?.ceiling_gap_median),
    currentBestCaseMedian: toNumber(metrics?.current_best_case_median),
    targetBestCaseMedian: toNumber(metrics?.target_best_case_median),
    profileContextSeed: inputs
      ? {
          current_income: inputs.current_income,
          current_role: inputs.current_role,
          current_experience_years: inputs.current_experience_years,
          target_role: inputs.target_role,
          experience_level: inputs.experience_level,
          english_level: inputs.english_level,
          target_market: inputs.target_market,
          transition_priority: inputs.transition_priority,
        }
      : {},
  };
}

export function getDashboardView(value: string | null): DashboardView {
  switch (value) {
    case "scenario":
    case "market":
      return "market";
    case "vacancies":
    case "jobs":
    case "assistant":
    case "resume":
    case "interviews":
    case "offers":
      return "vacancies";
    case "profile":
    case "access":
      return value;
    default:
      return "overview";
  }
}

export function getDashboardHref(view: DashboardView) {
  return view === "overview" ? "/dashboard" : `/dashboard?view=${view}`;
}

export function readCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${escapedName}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function isValidGuestSessionId(value: string | null) {
  return typeof value === "string" && uuidPattern.test(value);
}

export function buildProgressSteps(
  totalSimulations: number,
  subscription: DashboardAccessState,
  profileCompletion: number,
): DashboardProgressStep[] {
  return [
    {
      label: "Заповнити профіль",
      progress: profileCompletion,
      href: getDashboardHref("profile"),
    },
    {
      label: "Отримати ринкову позицію",
      progress: totalSimulations > 0 ? 100 : 12,
      href: totalSimulations > 0 ? getDashboardHref("market") : "/simulate",
    },
    {
      label: "Перевірити першу вакансію",
      progress: subscription.plan === "pro" && totalSimulations > 0 ? 35 : 0,
      href: getDashboardHref("vacancies"),
    },
    {
      label: "Адаптувати резюме під вакансію",
      progress: 0,
      href: getDashboardHref("vacancies"),
    },
    {
      label: "Підготувати salary talking points",
      progress: 0,
      href: getDashboardHref("vacancies"),
    },
    {
      label: "Оцінити офер",
      progress: 0,
      href: getDashboardHref("vacancies"),
    },
  ];
}

export function buildInsights(
  subscription: DashboardAccessState,
  totalSimulations: number,
  lastSimulation: DashboardSimulation | null,
  profileCompletion: number,
) {
  const verdict = verdictLabel(lastSimulation?.verdictLabel ?? null);
  const probability = probabilityLabel(
    lastSimulation?.probabilityOfGettingJob ?? null,
  );
  const targetMarket = mapTargetMarketLabel(
    lastSimulation?.targetMarket ?? null,
  );

  if (!lastSimulation) {
    return [
      profileCompletion < 60
        ? "Спершу дозаповніть профіль, щоб аналіз вакансій підлаштовувався під ваш контекст точніше."
        : "Почніть із першої оцінки, щоб головний екран перестав бути загальним і підлаштувався під ваш маршрут.",
      subscription.plan === "pro"
        ? "У вас уже відкритий paid workspace. Після першої оцінки переходьте до перевірки реальної вакансії."
        : "Поки достатньо зібрати одну ринкову позицію. Платний workspace логічно відкривати вже після цього.",
      "Маршрут кабінету: позиція -> вакансія -> резюме -> співбесіда і зарплата -> офер.",
    ];
  }

  return [
    verdict
      ? `${verdict}. Тримайте це як базовий фокус перед перевіркою вакансій.`
      : "Остання оцінка вже задає контекст для наступної вакансії.",
    probability
      ? `${probability}. Це орієнтир для того, наскільки агресивно подаватися на ролі вище поточного рівня.`
      : "Після оцінки логічно перевірити, як ви виглядаєте під реальні вакансії.",
    profileCompletion < 80
      ? `Профіль заповнений на ${profileCompletion}%. Дозаповніть його, щоб аналіз вакансій був точнішим.`
      : targetMarket
        ? `Орієнтир зараз: ${targetMarket}. Це впливатиме і на вакансії, і на мову резюме, і на вимоги ринку.`
        : totalSimulations > 1
          ? "Перейдіть до Vacancy Fit і перевірте не абстрактний напрям, а конкретну роль."
          : "Після першої оцінки варто перевірити конкретну вакансію.",
  ];
}

export function buildActivityItems(
  recentSimulations: DashboardSimulation[],
  subscription: DashboardAccessState,
) {
  const simulationItems = recentSimulations.slice(0, 4).map((simulation) => {
    const label =
      simulation.currentRole && simulation.targetRole
        ? `Оновлено оцінку ${simulation.currentRole} -> ${simulation.targetRole}`
        : simulation.targetRole
          ? `Проаналізовано напрям ${simulation.targetRole}`
          : "Збережено нову ринкову оцінку";

    return {
      title: label,
      description:
        formatDateTime(simulation.createdAt) ??
        simulationStatusLabel(simulation.status),
    };
  });

  if (simulationItems.length > 0) {
    return simulationItems;
  }

  return [
    {
      title: "Кабінет готовий до ринкової оцінки",
      description:
        "Після першого результату тут підтягнуться фокус, історія та наступна дія.",
    },
    {
      title:
        subscription.plan === "pro"
          ? "План Pro уже активний"
          : "Базовий доступ активний",
      description:
        subscription.plan === "pro"
          ? "Vacancy Fit і платний workspace прив'язані до цього акаунта."
          : "Після оновлення тут з'являться оплата й межі плану.",
    },
  ];
}
