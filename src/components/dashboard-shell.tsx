"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuthDialog } from "@/components/auth-dialog-provider";
import { getSupabaseBrowserClient } from "@/lib/db/supabase-browser";
import { formatUah, pricingPlans } from "@/lib/pricing";

type DashboardView = "overview" | "scenario" | "resume" | "interviews" | "jobs" | "offers" | "assistant" | "access";

type ChipTone = "neutral" | "accent" | "success" | "gold";

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

type DashboardAccessState = {
  plan: "free" | "pro";
  status: "free" | "trial" | "active" | "canceled" | "past_due";
  currentPeriodEnd: string | null;
};

type DashboardNavSection = {
  title: string;
  items: DashboardNavItem[];
};

type DashboardNavItem = {
  view: DashboardView;
  label: string;
  helper: string;
  badge?: string;
  icon: ReactNode;
};

type DashboardModule = {
  view: Extract<DashboardView, "scenario" | "resume" | "interviews" | "jobs" | "offers" | "assistant">;
  title: string;
  description: string;
  helper: string;
  statusLabel: string;
  statusTone: ChipTone;
  searchTerms: string[];
  icon: ReactNode;
};

type ProgressStep = {
  label: string;
  progress: number;
};

type ModuleWorkspaceConfig = {
  eyebrow: string;
  title: string;
  description: string;
  statusLabel: string;
  statusTone: ChipTone;
  summary: Array<{ label: string; value: string }>;
  lanes: Array<{
    title: string;
    description: string;
    items: string[];
  }>;
};

const dateFormatter = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit"
});

const compactDateFormatter = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "short"
});

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5L12 4l9 7.5" />
      <path d="M5.5 10.5V20h13V10.5" />
      <path d="M9.5 20v-5h5v5" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M8.5 7.5h4a3 3 0 0 1 3 3v3" />
      <path d="M15.5 16.5h-4a3 3 0 0 1-3-3v-3" />
    </svg>
  );
}

function ResumeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5Z" />
      <path d="M14 3.5V8h4" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </svg>
  );
}

function InterviewIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 17.5h8l4 3v-12A2.5 2.5 0 0 0 15.5 6h-9A2.5 2.5 0 0 0 4 8.5V15a2.5 2.5 0 0 0 2 2.45Z" />
      <path d="M8 10h6" />
      <path d="M8 13h4" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 7V5.8A1.8 1.8 0 0 1 9.8 4h4.4A1.8 1.8 0 0 1 16 5.8V7" />
      <rect x="3" y="7" width="18" height="13" rx="2.5" />
      <path d="M3 12.5h18" />
      <path d="M10 12.5v1.2A1.3 1.3 0 0 0 11.3 15h1.4a1.3 1.3 0 0 0 1.3-1.3v-1.2" />
    </svg>
  );
}

function OfferIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 19.5V9.5" />
      <path d="M10 19.5V4.5" />
      <path d="M15 19.5v-7" />
      <path d="M20 19.5v-12" />
      <path d="M3.5 19.5h17" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5l1.5 4.2L17.7 9l-4.2 1.4L12 14.6l-1.5-4.2L6.3 9l4.2-1.3L12 3.5Z" />
      <path d="M18.5 14.5l.8 2.3 2.2.7-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.7.8-2.3Z" />
      <path d="M6.5 14.5l.9 2.5 2.6.8-2.6.9-.9 2.5-.9-2.5-2.5-.9 2.5-.8.9-2.5Z" />
    </svg>
  );
}

function CreditCardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="M3 10h18" />
      <path d="M7.5 14.5h3.5" />
    </svg>
  );
}

const dashboardModules: DashboardModule[] = [
  {
    view: "scenario",
    title: "Мій сценарій",
    description: "Головний блок порівняння ролей, ринків і фінансової траєкторії.",
    helper: "Останні розрахунки й фокус на наступний крок.",
    statusLabel: "Активно",
    statusTone: "success",
    searchTerms: ["сценарій", "перехід", "прогноз", "дохід"],
    icon: <RouteIcon />
  },
  {
    view: "resume",
    title: "CV Builder",
    description: "Окремий workspace для резюме під цільову роль, seniority і вакансію.",
    helper: "Каркас модуля вже закладено, логіку підключимо окремо.",
    statusLabel: "Готово до інтеграції",
    statusTone: "accent",
    searchTerms: ["cv", "резюме", "вакансія", "ats"],
    icon: <ResumeIcon />
  },
  {
    view: "interviews",
    title: "Підготовка до співбесід",
    description: "Питання, mock interview і підсвітка слабких відповідей.",
    helper: "Місце під тренування перед рекрутером і hiring manager.",
    statusLabel: "Доступно",
    statusTone: "neutral",
    searchTerms: ["співбесіда", "interview", "mock", "питання"],
    icon: <InterviewIcon />
  },
  {
    view: "jobs",
    title: "Нова робота / Day One",
    description: "Очікування від нової ролі, перші тижні та адаптація без провалу.",
    helper: "Допоможе перейти від оферу до реальної роботи.",
    statusLabel: "Доступно",
    statusTone: "neutral",
    searchTerms: ["day one", "нова робота", "адаптація", "онбординг"],
    icon: <BriefcaseIcon />
  },
  {
    view: "offers",
    title: "Порівняння оферів",
    description: "Матриця ризику, доходу й аргументів для рішення або торгу.",
    helper: "Окремий модуль для моменту, коли пропозиція вже на столі.",
    statusLabel: "Pro",
    statusTone: "gold",
    searchTerms: ["offer", "офер", "зарплата", "переговори"],
    icon: <OfferIcon />
  },
  {
    view: "assistant",
    title: "Career AI Assistant",
    description: "Контекстний AI-помічник по вакансіях, CV, питаннях і рішенню по кроках.",
    helper: "Працюватиме поверх усіх модулів як єдина точка підтримки.",
    statusLabel: "Новинка",
    statusTone: "accent",
    searchTerms: ["assistant", "ai", "поради", "помічник"],
    icon: <SparkIcon />
  }
];

const dashboardNavSections: DashboardNavSection[] = [
  {
    title: "Робочий простір",
    items: [
      {
        view: "overview",
        label: "Головна",
        helper: "Огляд, пріоритети й модулі.",
        icon: <HomeIcon />
      },
      {
        view: "scenario",
        label: "Мій сценарій",
        helper: "Останній перехід і наступні дії.",
        icon: <RouteIcon />
      }
    ]
  },
  {
    title: "Модулі",
    items: [
      {
        view: "resume",
        label: "CV Builder",
        helper: "Резюме під цільову роль.",
        icon: <ResumeIcon />
      },
      {
        view: "interviews",
        label: "Співбесіди",
        helper: "Питання, mock interview, фідбек.",
        icon: <InterviewIcon />
      },
      {
        view: "jobs",
        label: "Нова робота",
        helper: "Day One і перші тижні.",
        icon: <BriefcaseIcon />
      },
      {
        view: "offers",
        label: "Порівняння оферів",
        helper: "Рішення по пропозиції й переговорах.",
        badge: "Pro",
        icon: <OfferIcon />
      },
      {
        view: "assistant",
        label: "AI Assistant",
        helper: "Контекстний помічник по всьому кабінету.",
        badge: "New",
        icon: <SparkIcon />
      }
    ]
  },
  {
    title: "Сервіс",
    items: [
      {
        view: "access",
        label: "Тариф і доступ",
        helper: "План, billing і межі доступу.",
        icon: <CreditCardIcon />
      }
    ]
  }
];

const moduleWorkspaceConfigs: Record<Exclude<DashboardView, "overview" | "scenario" | "access">, ModuleWorkspaceConfig> = {
  resume: {
    eyebrow: "CV Builder",
    title: "Робочий простір для резюме під цільову роль",
    description: "Цей екран уже закладений як окремий модуль кабінету: тут буде збиратись CV під роль, вакансію і seniority без змішування з іншими задачами.",
    statusLabel: "Каркас готовий",
    statusTone: "accent",
    summary: [
      { label: "Вхід", value: "Сценарій, досвід, вакансія" },
      { label: "Фокус", value: "Досягнення, цифри, relevance" },
      { label: "Вихід", value: "Чернетка CV + версії під ролі" }
    ],
    lanes: [
      {
        title: "Що буде на екрані",
        description: "Окремі зони під базове CV, цільову версію та адаптацію під вакансію.",
        items: ["Бібліотека версій резюме", "Блок досягнень з цифрами", "Структура під ATS і читабельність"]
      },
      {
        title: "Перший реліз",
        description: "Сюди логічно підключати форму, редактор секцій і оцінку якості.",
        items: ["Заповнення ролі й контексту", "Підсвітка слабких формулювань", "CTA на експорт і перевірку вакансії"]
      },
      {
        title: "Місце в маршруті",
        description: "Модуль живе поруч із сценаріями та вакансіями, але не забирає у них фокус.",
        items: ["Після сильного сценарію переходу", "Перед відгуками на вакансії", "Як місток до interview prep"]
      }
    ]
  },
  interviews: {
    eyebrow: "Співбесіди",
    title: "Модуль підготовки до співбесід у власному workspace",
    description: "Тут буде окремий інтерфейс для тренування відповідей, сценаріїв розмови з рекрутером і технічного або менеджерського етапу.",
    statusLabel: "Структура закладена",
    statusTone: "neutral",
    summary: [
      { label: "Вхід", value: "Роль, seniority, вакансія" },
      { label: "Фокус", value: "Слабкі місця й аргументація" },
      { label: "Вихід", value: "Пакет питань + mock flow" }
    ],
    lanes: [
      {
        title: "Що буде на екрані",
        description: "Потоки для recruiter call, hiring interview і практичної частини.",
        items: ["Добірка питань за роллю", "Сильні й слабкі відповіді", "Mock режим із фідбеком"]
      },
      {
        title: "Перший реліз",
        description: "Сюди підключатиметься генерація питань і оцінка відповідей.",
        items: ["Треки під різні типи співбесід", "Коментарі до відповідей", "Пріоритети для доопрацювання"]
      },
      {
        title: "Місце в маршруті",
        description: "Модуль спрацьовує після того, як користувач уже знає, куди рухається.",
        items: ["Після CV Builder", "Перед масовими відгуками", "Перед фінальними інтерв'ю"]
      }
    ]
  },
  jobs: {
    eyebrow: "Нова робота",
    title: "Day One workspace для реалістичного старту в новій ролі",
    description: "Окремий модуль про те, як виглядає робочий ритм, перші тижні та очікування від ролі після оферу.",
    statusLabel: "Доступно в структурі",
    statusTone: "neutral",
    summary: [
      { label: "Вхід", value: "Роль, команда, контекст переходу" },
      { label: "Фокус", value: "Ризики старту й адаптація" },
      { label: "Вихід", value: "План перших тижнів" }
    ],
    lanes: [
      {
        title: "Що буде на екрані",
        description: "Картина реального робочого дня, відповідальностей і темпу.",
        items: ["Розклад дня по типах задач", "Що очікують у перший місяць", "Де найбільше ризику провалитись"]
      },
      {
        title: "Перший реліз",
        description: "Сюди можна додавати чеклісти адаптації та базовий onboarding plan.",
        items: ["Шаблон 30 днів", "Чекліст входу в роль", "Теми для синків із менеджером"]
      },
      {
        title: "Місце в маршруті",
        description: "Це продовження модуля сценаріїв і оферів, а не окрема від них історія.",
        items: ["Після прийняття оферу", "Перед першими тижнями в ролі", "Для зниження стресу на старті"]
      }
    ]
  },
  offers: {
    eyebrow: "Офери",
    title: "Порівняння оферів у вигляді окремого decision board",
    description: "Окремий екран під матрицю доходу, ризику, умов і аргументів для рішення. Він уже має своє місце в навігації й не змішується з основним dashboard.",
    statusLabel: "Pro модуль",
    statusTone: "gold",
    summary: [
      { label: "Вхід", value: "Поточна роль + 1-2 офери" },
      { label: "Фокус", value: "Ризик, гроші, компроміси" },
      { label: "Вихід", value: "Чіткий recommendation board" }
    ],
    lanes: [
      {
        title: "Що буде на екрані",
        description: "Порівняння пропозицій не тільки по зарплаті, а й по траєкторії на кілька років.",
        items: ["Матриця оферів поруч", "Ризик-період на старті", "Аргументи для прийняття або торгу"]
      },
      {
        title: "Перший реліз",
        description: "Сюди логічно заводити умови оферу, запас міцності та рекомендацію.",
        items: ["Форма параметрів оферу", "Сильні й слабкі сторони", "Висновок по fit і timing"]
      },
      {
        title: "Місце в маршруті",
        description: "Це фінальна зона прийняття рішення після сценаріїв, вакансій і співбесід.",
        items: ["Коли є конкретна пропозиція", "Для переговорів про умови", "Для порівняння двох маршрутів"]
      }
    ]
  },
  assistant: {
    eyebrow: "AI Assistant",
    title: "Контекстний AI-помічник поверх усього career workspace",
    description: "Модуль уже винесено в окремий розділ кабінету. Тут буде AI, який розуміє ваш сценарій, CV, вакансії, питання й доступ до модулів.",
    statusLabel: "Новий шар взаємодії",
    statusTone: "accent",
    summary: [
      { label: "Вхід", value: "Контекст користувача і модулів" },
      { label: "Фокус", value: "Швидкі підказки й наступний крок" },
      { label: "Вихід", value: "Рекомендації в контексті маршруту" }
    ],
    lanes: [
      {
        title: "Що буде на екрані",
        description: "Чат-панель, швидкі промпти та готові сценарії для дій усередині кабінету.",
        items: ["Швидкі команди по CV і вакансіях", "AI по сценаріях і оферах", "Пояснення складних рішень простою мовою"]
      },
      {
        title: "Перший реліз",
        description: "Сюди підключатиметься чат, пам'ять по користувачу та точкові дії.",
        items: ["Готові промпти з dashboard", "Поради на основі останнього сценарію", "Переходи в потрібні модулі"]
      },
      {
        title: "Місце в маршруті",
        description: "AI не дублює модулі, а допомагає швидше рухатись між ними.",
        items: ["Працює поверх усієї навігації", "Підказує, з чого почати", "Пояснює, чому наступний крок саме такий"]
      }
    ]
  }
};

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

function formatCompactDate(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : compactDateFormatter.format(parsed);
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

function getFirstName(displayName: string) {
  return displayName.trim().split(/\s+/)[0] ?? displayName;
}

function mapTargetMarketLabel(value: string | null) {
  switch (value) {
    case "ukraine":
      return "ринок України";
    case "remote":
      return "remote-ринок";
    case "abroad":
      return "ринок за кордоном";
    default:
      return null;
  }
}

function mapPriorityLabel(value: string | null) {
  switch (value) {
    case "speed":
      return "швидкий вхід";
    case "income":
      return "зростання доходу";
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

function accessTone(plan: "free" | "pro", status: "free" | "trial" | "active" | "canceled" | "past_due"): ChipTone {
  if (plan === "pro" && (status === "active" || status === "trial")) {
    return "success";
  }

  if (status === "past_due") {
    return "gold";
  }

  return "accent";
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

function simulationStatusTone(status: string): ChipTone {
  switch (status) {
    case "completed":
      return "success";
    case "failed":
      return "gold";
    default:
      return "neutral";
  }
}

function verdictLabel(value: string | null) {
  switch (value) {
    case "switch":
      return "Перехід виглядає сильніше";
    case "depends":
      return "Потрібен обережний маршрут";
    case "stay":
      return "База поки сильніша";
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

function formatSignedMoney(value: number | null) {
  if (value === null) {
    return null;
  }

  const rounded = Math.round(value);
  const sign = rounded > 0 ? "+" : rounded < 0 ? "-" : "";
  return `${sign}${formatUah(Math.abs(rounded))}`;
}

function normalizeSearchQuery(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
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
  switch (value) {
    case "scenario":
    case "resume":
    case "interviews":
    case "jobs":
    case "offers":
    case "assistant":
    case "access":
      return value;
    default:
      return "overview";
  }
}

function getDashboardHref(view: DashboardView) {
  return view === "overview" ? "/dashboard" : `/dashboard?view=${view}`;
}

function isModuleWorkspaceView(
  view: DashboardView
): view is Exclude<DashboardView, "overview" | "scenario" | "access"> {
  return view === "resume" || view === "interviews" || view === "jobs" || view === "offers" || view === "assistant";
}

function buildProgressSteps(totalSimulations: number, subscription: DashboardAccessState) {
  const scenarioCountProgress = totalSimulations >= 3 ? 100 : totalSimulations === 2 ? 74 : totalSimulations === 1 ? 38 : 0;
  const cvProgress = subscription.plan === "pro" ? (totalSimulations > 0 ? 42 : 16) : 0;
  const interviewProgress = subscription.plan === "pro" ? (totalSimulations > 0 ? 18 : 0) : 0;

  return [
    {
      label: "Заповнити стартовий сценарій переходу",
      progress: totalSimulations > 0 ? 100 : 12
    },
    {
      label: "Порівняти 2-3 маршрути переходу",
      progress: scenarioCountProgress
    },
    {
      label: "Зібрати CV під цільову роль",
      progress: cvProgress
    },
    {
      label: "Пройти mock interview",
      progress: interviewProgress
    },
    {
      label: "Оцінити перший offer-fit",
      progress: 0
    }
  ];
}

function buildProfileReadiness(totalSimulations: number, subscription: DashboardAccessState, lastSimulation: DashboardSimulation | null) {
  let readiness = 24;

  if (totalSimulations > 0) {
    readiness += 28;
  }

  if (subscription.plan === "pro") {
    readiness += 18;
  }

  if (lastSimulation?.probabilityOfGettingJob !== null) {
    readiness += 10;
  }

  if (totalSimulations > 2) {
    readiness += 8;
  }

  return Math.min(readiness, 94);
}

function buildInsights(
  subscription: DashboardAccessState,
  totalSimulations: number,
  lastSimulation: DashboardSimulation | null
) {
  const verdict = verdictLabel(lastSimulation?.verdictLabel ?? null);
  const probability = probabilityLabel(lastSimulation?.probabilityOfGettingJob ?? null);
  const targetMarket = mapTargetMarketLabel(lastSimulation?.targetMarket ?? null);

  if (!lastSimulation) {
    return [
      "Почніть із базової симуляції, щоб dashboard перестав бути загальним і підлаштувався під ваш маршрут.",
      subscription.plan === "pro"
        ? "У вас уже відкритий повний стек. Після першого сценарію можна одразу переходити до CV Builder і співбесід."
        : "Поки достатньо зібрати перший сильний сценарій. Платні модулі логічно підключати вже після цього.",
      "Навігація в кабінеті побудована навколо реального маршруту: сценарій -> CV -> співбесіди -> офер -> Day One."
    ];
  }

  return [
    verdict
      ? `${verdict}. Тримайте цей сценарій у фокусі й переведіть його в підготовку до ринку.`
      : "Останній сценарій уже дає базовий контекст для наступних модулів.",
    probability
      ? `${probability}. Це хороший маркер, щоб вирішити, чи рухатись у CV та interview prep вже зараз.`
      : "Після сценарію логічний наступний крок: підготувати CV і перевірити, як ви виглядаєте під реальні вакансії.",
    targetMarket
      ? `Орієнтир зараз: ${targetMarket}. Це впливатиме і на мову CV, і на тип вакансій, і на рівень вимог.`
      : totalSimulations > 1
        ? "Спробуйте ще один альтернативний маршрут, щоб бачити не одну точку, а реальне поле рішень."
        : "Після першого розрахунку варто додати ще один альтернативний сценарій і порівняти темп входу."
  ];
}

function buildActivityItems(
  recentSimulations: DashboardSimulation[],
  subscription: DashboardAccessState
) {
  const simulationItems = recentSimulations.slice(0, 4).map((simulation) => {
    const label =
      simulation.currentRole && simulation.targetRole
        ? `Оновлено сценарій ${simulation.currentRole} -> ${simulation.targetRole}`
        : simulation.targetRole
          ? `Проаналізовано напрям ${simulation.targetRole}`
          : "Збережено новий сценарій переходу";

    return {
      title: label,
      description: formatDateTime(simulation.createdAt) ?? simulationStatusLabel(simulation.status)
    };
  });

  if (simulationItems.length > 0) {
    return simulationItems;
  }

  return [
    {
      title: "Кабінет готовий до першої симуляції",
      description: "Після входу сюди підтягуються сценарії, доступ і наступні модулі."
    },
    {
      title: subscription.plan === "pro" ? "Pro доступ уже активний" : "Базовий доступ активний",
      description: subscription.plan === "pro" ? "Усі модулі прив'язані до цього акаунта." : "Після апгрейду тут з'явиться billing та межі плану."
    }
  ];
}

function chipClasses(tone: ChipTone) {
  switch (tone) {
    case "accent":
      return "workspace-chip workspace-chip-accent";
    case "success":
      return "workspace-chip workspace-chip-success";
    case "gold":
      return "workspace-chip workspace-chip-gold";
    default:
      return "workspace-chip workspace-chip-neutral";
  }
}

function WorkspaceChip({ tone, children }: { tone: ChipTone; children: ReactNode }) {
  return <span className={chipClasses(tone)}>{children}</span>;
}

function MetricMiniCard({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <article className="workspace-card-muted rounded-[1.45rem] p-4">
      <p className="text-[0.73rem] font-semibold uppercase tracking-[0.14em] text-white/42">{label}</p>
      <p className="mt-3 text-[1.25rem] font-semibold leading-[1.12] tracking-[-0.03em] text-white">{value}</p>
      <p className="mt-2 text-[0.9rem] leading-[1.6] text-white/56">{description}</p>
    </article>
  );
}

function ProgressStepRow({ step }: { step: ProgressStep }) {
  const tone: ChipTone = step.progress >= 100 ? "success" : step.progress > 0 ? "accent" : "neutral";

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[0.68rem] font-semibold ${
              step.progress >= 100
                ? "border-emerald-400/30 bg-emerald-400/12 text-emerald-200"
                : step.progress > 0
                  ? "border-[rgba(108,128,255,0.26)] bg-[rgba(108,128,255,0.14)] text-[rgba(230,235,255,0.92)]"
                  : "border-white/10 bg-white/5 text-white/40"
            }`}
          >
            {step.progress >= 100 ? "✓" : step.progress > 0 ? "•" : "○"}
          </span>
          <p className="text-[0.95rem] leading-[1.55] text-white/84">{step.label}</p>
        </div>

        <WorkspaceChip tone={tone}>{step.progress}%</WorkspaceChip>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/8">
        <div
          className={`h-full rounded-full ${
            tone === "success" ? "bg-[linear-gradient(90deg,#2dd4bf_0%,#34d399_100%)]" : "bg-[linear-gradient(90deg,#7c89ff_0%,#9fa9ff_100%)]"
          }`}
          style={{ width: `${Math.max(step.progress, 4)}%` }}
        />
      </div>
    </div>
  );
}

function ModuleCard({ module }: { module: DashboardModule }) {
  return (
    <article className="workspace-card group rounded-[1.8rem] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-white/14">
      <div className="flex items-start justify-between gap-4">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-[1rem] border border-white/10 bg-white/6 text-white/82">
          {module.icon}
        </span>
        <WorkspaceChip tone={module.statusTone}>{module.statusLabel}</WorkspaceChip>
      </div>

      <h3 className="mt-5 text-[1.3rem] font-semibold leading-[1.08] tracking-[-0.035em] text-white">{module.title}</h3>
      <p className="mt-3 text-[0.94rem] leading-[1.72] text-white/58">{module.description}</p>
      <p className="mt-2 text-[0.86rem] leading-[1.68] text-white/42">{module.helper}</p>

      <Link
        href={getDashboardHref(module.view)}
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white transition group-hover:text-[rgba(221,226,255,0.92)]"
      >
        Відкрити
        <span aria-hidden="true">›</span>
      </Link>
    </article>
  );
}

function DashboardSkeleton() {
  return (
    <section className="dashboard-screen dashboard-workspace py-6 md:py-8">
      <div className="mx-auto max-w-[1480px] px-4 md:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[18rem,minmax(0,1fr)]">
          <div className="workspace-card rounded-[2rem] p-5">
            <div className="h-10 rounded-[1rem] bg-white/8" />
            <div className="mt-3 h-20 rounded-[1rem] bg-white/6" />
            <div className="mt-3 h-20 rounded-[1rem] bg-white/6" />
            <div className="mt-3 h-20 rounded-[1rem] bg-white/6" />
          </div>

          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr),22rem]">
              <div className="workspace-card rounded-[2.2rem] p-6">
                <div className="h-6 w-28 rounded-full bg-white/10" />
                <div className="mt-5 h-20 max-w-3xl rounded-[1.4rem] bg-white/10" />
                <div className="mt-5 h-5 max-w-2xl rounded-full bg-white/8" />
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="h-28 rounded-[1.4rem] bg-white/7" />
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="workspace-card rounded-[2rem] p-5">
                  <div className="h-6 w-36 rounded-full bg-white/10" />
                  <div className="mt-4 h-20 rounded-[1.2rem] bg-white/8" />
                  <div className="mt-3 h-20 rounded-[1.2rem] bg-white/8" />
                  <div className="mt-3 h-20 rounded-[1.2rem] bg-white/8" />
                </div>
                <div className="workspace-card rounded-[2rem] p-5">
                  <div className="h-6 w-32 rounded-full bg-white/10" />
                  <div className="mt-4 h-16 rounded-[1.2rem] bg-white/8" />
                  <div className="mt-3 h-16 rounded-[1.2rem] bg-white/8" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardGuest({ onLogin, onSignup }: { onLogin: () => void; onSignup: () => void }) {
  return (
    <section className="dashboard-screen dashboard-workspace py-6 md:py-8">
      <div className="mx-auto max-w-[1480px] px-4 md:px-6 lg:px-8">
        <div className="workspace-card overflow-hidden rounded-[2.4rem] p-6 md:p-8">
          <div className="grid gap-8 xl:grid-cols-[1.05fr,0.95fr] xl:items-center">
            <div>
              <WorkspaceChip tone="accent">Особистий кабінет</WorkspaceChip>
              <h1 className="mt-5 max-w-[12ch] text-[2.5rem] font-semibold leading-[0.92] tracking-[-0.055em] text-white md:text-[3.6rem]">
                Кабінет відкривається після входу.
              </h1>
              <p className="mt-5 max-w-2xl text-[1rem] leading-[1.78] text-white/62 md:text-[1.05rem]">
                Після авторизації тут зʼявиться career workspace зі сценаріями переходу, модульною навігацією, доступом до тарифу та
                окремими екранами під CV, співбесіди, офери й AI-помічника.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button type="button" onClick={onLogin} className="workspace-button-secondary">
                  Увійти
                </button>
                <button type="button" onClick={onSignup} className="workspace-button-primary">
                  Створити акаунт
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <MetricMiniCard label="Навігація" value="Sidebar-first" description="Усі розділи живуть у боковому меню, а не в публічному header." />
              <MetricMiniCard label="Структура" value="Модульна" description="Кожен інструмент має окремий простір, а dashboard залишається чистим." />
              <MetricMiniCard label="Пошук" value="Header search" description="Пошук по модулях, діях і логіці кабінету прямо зверху." />
              <MetricMiniCard label="Доступ" value="Окремий блок" description="Тариф, billing і межі доступу винесені в окремий сервісний розділ." />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardError({ message }: { message: string }) {
  return (
    <section className="dashboard-screen dashboard-workspace py-6 md:py-8">
      <div className="mx-auto max-w-[1480px] px-4 md:px-6 lg:px-8">
        <div className="workspace-card rounded-[2.4rem] p-6 md:p-8">
          <WorkspaceChip tone="gold">Помилка</WorkspaceChip>
          <h1 className="mt-5 max-w-[11ch] text-[2.4rem] font-semibold leading-[0.94] tracking-[-0.05em] text-white md:text-[3.2rem]">
            Кабінет тимчасово недоступний.
          </h1>
          <p className="mt-5 max-w-2xl text-[1rem] leading-[1.78] text-white/62">{message}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/simulate" className="workspace-button-primary">
              Перейти до симуляції
            </Link>
            <Link href="/" className="workspace-button-secondary">
              На головну
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardSidebar({
  activeView,
  totalSimulations,
  accessLabel,
  subscription
}: {
  activeView: DashboardView;
  totalSimulations: number;
  accessLabel: string;
  subscription: DashboardAccessState;
}) {
  const periodLabel = subscription.currentPeriodEnd ? formatCompactDate(subscription.currentPeriodEnd) : null;

  return (
    <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
      <div className="workspace-card rounded-[2rem] p-4 md:p-5">
        <div className="flex items-center gap-3 rounded-[1.35rem] border border-white/8 bg-white/[0.04] p-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-[1rem] border border-white/10 bg-white/8 text-white">
            <SparkIcon />
          </span>
          <div>
            <p className="text-[1.05rem] font-semibold tracking-[-0.03em] text-white">Decivio</p>
            <p className="text-sm leading-[1.5] text-white/48">Career transition workspace</p>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          {dashboardNavSections.map((section) => (
            <div key={section.title}>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-white/36">{section.title}</p>
              <nav className="mt-3 space-y-2" aria-label={section.title}>
                {section.items.map((item) => {
                  const isActive = item.view === activeView;

                  return (
                    <Link
                      key={item.view}
                      href={getDashboardHref(item.view)}
                      className={`group flex items-start gap-3 rounded-[1.3rem] border px-3.5 py-3 transition ${
                        isActive
                          ? "border-[rgba(148,162,255,0.24)] bg-[linear-gradient(180deg,rgba(128,139,255,0.16),rgba(87,97,184,0.12))] text-white"
                          : "border-transparent bg-transparent text-white/62 hover:border-white/8 hover:bg-white/[0.04] hover:text-white/88"
                      }`}
                    >
                      <span
                        className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.95rem] border transition ${
                          isActive
                            ? "border-white/12 bg-white/10 text-white"
                            : "border-white/8 bg-white/[0.03] text-white/54 group-hover:border-white/10 group-hover:bg-white/[0.06] group-hover:text-white/86"
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                          <span>{item.label}</span>
                          {item.badge ? <WorkspaceChip tone={item.badge === "Pro" ? "gold" : "accent"}>{item.badge}</WorkspaceChip> : null}
                        </span>
                        <span className="mt-1 block text-[0.82rem] leading-[1.5] text-inherit opacity-80">{item.helper}</span>
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      <div className="workspace-card rounded-[1.9rem] p-4 md:p-5">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-white/36">Швидкий стан</p>
        <div className="mt-4 space-y-3">
          <div className="workspace-card-muted rounded-[1.2rem] p-4">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-white/34">Сценарії</p>
            <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">{totalSimulations}</p>
            <p className="mt-1 text-sm text-white/50">збережено в історії переходів</p>
          </div>
          <div className="workspace-card-muted rounded-[1.2rem] p-4">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-white/34">Доступ</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <WorkspaceChip tone={accessTone(subscription.plan, subscription.status)}>{accessLabel}</WorkspaceChip>
              {periodLabel ? <span className="text-xs text-white/44">до {periodLabel}</span> : null}
            </div>
          </div>
        </div>
      </div>

      <div className={subscription.plan === "pro" ? "workspace-card-accent rounded-[1.9rem] p-5 text-white" : "workspace-card rounded-[1.9rem] p-5"}>
        <p className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-white/58">
          {subscription.plan === "pro" ? "Pro активний" : "Pro доступ"}
        </p>
        <h2 className="mt-3 text-[1.35rem] font-semibold leading-[1.08] tracking-[-0.04em] text-white">
          {subscription.plan === "pro" ? "Усі модулі закріплені за акаунтом." : "Відкрийте порівняння оферів, AI-шари та розширені workflow."}
        </h2>
        <p className="mt-3 text-[0.94rem] leading-[1.68] text-white/70">
          {subscription.plan === "pro"
            ? "Billing, межі плану та керування доступом винесені в окремий сервісний екран."
            : "Апгрейд уже винесено в окремий блок кабінету, а не заховано серед модулів або маркетингових секцій."}
        </p>
        <Link href={subscription.plan === "pro" ? getDashboardHref("access") : "/pricing"} className="workspace-button-primary mt-5">
          {subscription.plan === "pro" ? "Керувати доступом" : "Оновити тариф"}
        </Link>
      </div>
    </aside>
  );
}

function DashboardOverview({
  userDisplayName,
  accessLabel,
  subscription,
  totalSimulations,
  recentSimulations,
  lastSimulation,
  searchQuery
}: {
  userDisplayName: string;
  accessLabel: string;
  subscription: DashboardAccessState;
  totalSimulations: number;
  recentSimulations: DashboardSimulation[];
  lastSimulation: DashboardSimulation | null;
  searchQuery: string;
}) {
  const firstName = getFirstName(userDisplayName);
  const readiness = buildProfileReadiness(totalSimulations, subscription, lastSimulation);
  const progressSteps = buildProgressSteps(totalSimulations, subscription);
  const insights = buildInsights(subscription, totalSimulations, lastSimulation);
  const activityItems = buildActivityItems(recentSimulations, subscription);
  const filteredModules = dashboardModules.filter((module) => {
    if (!searchQuery) {
      return true;
    }

    const haystack = [module.title, module.description, module.helper, ...module.searchTerms].join(" ").toLowerCase();
    return haystack.includes(searchQuery);
  });

  const focusTitle =
    lastSimulation?.currentRole && lastSimulation.targetRole
      ? `Перехід з ${lastSimulation.currentRole} -> ${lastSimulation.targetRole}`
      : lastSimulation?.targetRole
        ? `Фокус на переході в ${lastSimulation.targetRole}`
        : "Зберіть перший сценарій переходу";

  const targetMarket = mapTargetMarketLabel(lastSimulation?.targetMarket ?? null);
  const priority = mapPriorityLabel(lastSimulation?.transitionPriority ?? null);
  const lastVerdict = verdictLabel(lastSimulation?.verdictLabel ?? null);
  const probability = probabilityLabel(lastSimulation?.probabilityOfGettingJob ?? null);
  const moneyDelta = formatSignedMoney(lastSimulation?.ceilingGapMedian ?? null);
  const lastActivity = formatDateTime(lastSimulation?.createdAt ?? null);

  const scenarioCards = [
    {
      title: lastSimulation?.currentRole ? `Залишитись у ${lastSimulation.currentRole}` : "Залишитись у поточній ролі",
      description: "Базова лінія для порівняння з альтернативами.",
      note: "Найнижча невизначеність",
      emphasized: false
    },
    {
      title: lastSimulation?.targetRole ? `Перейти в ${lastSimulation.targetRole}` : "Перейти в новий напрям",
      description: lastVerdict ?? "Основний сценарій переходу, який варто тримати у фокусі.",
      note: probability ?? "Головний сценарій",
      emphasized: true
    },
    {
      title: priority === "зростання доходу" ? "Більш амбітний маршрут" : "Проміжний маршрут",
      description: targetMarket ? `Орієнтир на ${targetMarket}.` : "М'якший вхід із меншим стресом на старті.",
      note: priority ?? "Менше ризику на старті",
      emphasized: false
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr),22rem]">
        <div className="workspace-card rounded-[2.2rem] p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <WorkspaceChip tone="success">У фокусі зараз</WorkspaceChip>
            {targetMarket ? <WorkspaceChip tone="neutral">{targetMarket}</WorkspaceChip> : null}
            {priority ? <WorkspaceChip tone="accent">{priority}</WorkspaceChip> : null}
          </div>

          <h1 className="mt-5 max-w-[15ch] text-[2.2rem] font-semibold leading-[0.94] tracking-[-0.055em] text-white md:text-[3.2rem]">
            {focusTitle}
          </h1>
          <p className="mt-5 max-w-3xl text-[1rem] leading-[1.78] text-white/64">
            {lastSimulation
              ? `${firstName}, dashboard тримає в одному місці ваш актуальний сценарій, статус доступу, модульну структуру та підказки, що реально рухає до наступного кроку.`
              : `${firstName}, це головний екран вашого career workspace. Після першої симуляції сюди підтягуються сценарій, прогрес, модулі й контекстні рекомендації.`}
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricMiniCard
              label={moneyDelta ? "Потенціал стелі" : "Сценарії"}
              value={moneyDelta ?? `${totalSimulations}`}
              description={moneyDelta ? "Орієнтовний розрив із поточною стелею доходу." : "Збережено в історії кабінету."}
            />
            <MetricMiniCard
              label="Поточний етап"
              value={lastSimulation ? "Опрацювання ролі та маршруту" : "Стартова симуляція"}
              description={lastVerdict ?? "Після першого сценарію тут з'явиться персональний висновок."}
            />
            <MetricMiniCard
              label="Наступний крок"
              value={subscription.plan === "pro" ? "Переходити до CV Builder" : "Закріпити сильний сценарій"}
              description={subscription.plan === "pro" ? "Платні модулі вже в контурі кабінету." : "Після цього буде логічний апгрейд до Pro."}
            />
            <MetricMiniCard
              label="Готовність профілю"
              value={`${readiness}%`}
              description={lastActivity ? `Остання активність: ${lastActivity}.` : "Показник росте разом зі сценаріями й модулями."}
            />
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/simulate" className="workspace-button-primary">
              Запустити нову симуляцію
            </Link>
            <Link href={getDashboardHref("scenario")} className="workspace-button-secondary">
              Відкрити мій сценарій
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <article className="workspace-card rounded-[2rem] p-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-[0.95rem] border border-white/10 bg-white/[0.06] text-white/82">
                <SparkIcon />
              </span>
              <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-white">AI поради на зараз</h2>
            </div>

            <div className="mt-5 space-y-3">
              {insights.map((insight) => (
                <div key={insight} className="workspace-card-muted rounded-[1.25rem] p-4">
                  <p className="text-[0.94rem] leading-[1.72] text-white/74">{insight}</p>
                </div>
              ))}
            </div>
          </article>

          <article id="activity" className="workspace-card rounded-[2rem] p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-white">Activity feed</h2>
              <WorkspaceChip tone={accessTone(subscription.plan, subscription.status)}>{accessLabel}</WorkspaceChip>
            </div>

            <div className="mt-5 space-y-3">
              {activityItems.map((item) => (
                <div key={`${item.title}-${item.description}`} className="workspace-card-muted rounded-[1.25rem] p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-1.5 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-[rgba(145,132,255,0.92)]" />
                    <div>
                      <p className="text-[0.95rem] leading-[1.62] text-white/84">{item.title}</p>
                      <p className="mt-1 text-[0.82rem] text-white/46">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),minmax(0,1fr),23rem]">
        <article className="workspace-card rounded-[2rem] p-5 md:p-6">
          <h2 className="text-[1.55rem] font-semibold leading-[1.06] tracking-[-0.04em] text-white">План прогресу</h2>
          <p className="mt-3 text-[0.95rem] leading-[1.7] text-white/56">
            Ключова зона, яка тримає користувача в продукті й показує не хаос модулів, а послідовність переходу.
          </p>

          <div className="mt-6 space-y-5">
            {progressSteps.map((step) => (
              <ProgressStepRow key={step.label} step={step} />
            ))}
          </div>
        </article>

        <article className="workspace-card rounded-[2rem] p-5 md:p-6">
          <h2 className="text-[1.55rem] font-semibold leading-[1.06] tracking-[-0.04em] text-white">Порівняння сценаріїв</h2>
          <p className="mt-3 text-[0.95rem] leading-[1.7] text-white/56">
            Блок, заради якого людина приходить у сервіс: не один маршрут, а поле для рішення.
          </p>

          <div className="mt-6 space-y-4">
            {scenarioCards.map((card) => (
              <div
                key={card.title}
                className={`rounded-[1.45rem] border p-4 ${
                  card.emphasized
                    ? "border-emerald-400/28 bg-[linear-gradient(180deg,rgba(20,79,67,0.42),rgba(14,55,47,0.34))]"
                    : "border-white/8 bg-white/[0.04]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[1.14rem] font-semibold leading-[1.2] tracking-[-0.03em] text-white">{card.title}</h3>
                    <p className="mt-2 text-[0.92rem] leading-[1.65] text-white/58">{card.description}</p>
                  </div>
                  <WorkspaceChip tone={card.emphasized ? "success" : "neutral"}>{card.note}</WorkspaceChip>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="workspace-card-light rounded-[2rem] p-5 md:p-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-[0.95rem] border border-black/8 bg-black/[0.04] text-[var(--text-strong)]">
              <CreditCardIcon />
            </span>
            <div>
              <p className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-soft)]">Тариф і доступ</p>
              <h2 className="mt-1 text-[1.6rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">
                {subscription.plan === "pro" ? "Pro Plan" : "Free Plan"}
              </h2>
            </div>
          </div>

          <p className="mt-5 text-[0.96rem] leading-[1.75] text-[var(--text-muted)]">
            {subscription.currentPeriodEnd
              ? `Активний до ${formatDateTime(subscription.currentPeriodEnd) ?? "наразі"}. Тут буде billing, invoices, ліміти плану і керування підпискою.`
              : "Окремий сервісний блок під план, billing і межі доступу без змішування з основним workflow."}
          </p>

          <div className="mt-5 space-y-3">
            <div className="rounded-[1.25rem] border border-black/8 bg-black/[0.03] px-4 py-4">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">Статус</p>
              <p className="mt-2 text-[1.05rem] font-semibold text-[var(--text-strong)]">{accessLabel}</p>
            </div>
            <div className="rounded-[1.25rem] border border-black/8 bg-black/[0.03] px-4 py-4">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">Що відкрито</p>
              <p className="mt-2 text-[0.94rem] leading-[1.65] text-[var(--text-muted)]">
                {subscription.plan === "pro"
                  ? "Сценарії, модулі підготовки, AI-шари й сервісні екрани вже прив'язані до акаунта."
                  : "Базовий сценарний контур активний. Платні модулі вже показані в інтерфейсі й готові до підключення."}
              </p>
            </div>
          </div>

          <Link href={getDashboardHref("access")} className="workspace-button-dark mt-6">
            Керувати підпискою
          </Link>
        </article>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[1.9rem] font-semibold leading-[1.02] tracking-[-0.045em] text-white">Модулі</h2>
            <p className="mt-2 text-[0.96rem] leading-[1.72] text-white/56">
              Всі інструменти видно одразу, але фокус тримається на рекомендованих наступних діях, а не на перевантаженні.
            </p>
          </div>
          {searchQuery ? <WorkspaceChip tone="accent">Пошук: {searchQuery}</WorkspaceChip> : null}
        </div>

        {filteredModules.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredModules.map((module) => (
              <ModuleCard key={module.view} module={module} />
            ))}
          </div>
        ) : (
          <div className="workspace-card rounded-[1.9rem] p-6">
            <h3 className="text-[1.35rem] font-semibold tracking-[-0.035em] text-white">За цим запитом модулі не знайдено</h3>
            <p className="mt-3 max-w-2xl text-[0.95rem] leading-[1.72] text-white/58">
              Спробуйте інший запит у пошуку зверху або поверніться до головного dashboard, щоб подивитись усю структуру кабінету.
            </p>
            <Link href="/dashboard" className="workspace-button-secondary mt-5">
              Скинути пошук
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

function DashboardScenarioWorkspace({
  recentSimulations,
  subscription
}: {
  recentSimulations: DashboardSimulation[];
  subscription: DashboardAccessState;
}) {
  const latest = recentSimulations[0] ?? null;

  if (!latest) {
    return (
      <div className="space-y-6">
        <div className="workspace-card rounded-[2.2rem] p-6 md:p-8">
          <WorkspaceChip tone="accent">Мій сценарій</WorkspaceChip>
          <h1 className="mt-5 max-w-[13ch] text-[2.3rem] font-semibold leading-[0.94] tracking-[-0.055em] text-white md:text-[3.1rem]">
            Тут зʼявиться ваш перший маршрут переходу.
          </h1>
          <p className="mt-5 max-w-3xl text-[1rem] leading-[1.78] text-white/62">
            Після першої симуляції цей екран стане центром рішень: останній сценарій, альтернативи, статус розрахунку й орієнтир на наступний крок.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/simulate" className="workspace-button-primary">
              Запустити симуляцію
            </Link>
            <Link href="/dashboard" className="workspace-button-secondary">
              Повернутися на dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const focusTitle =
    latest.currentRole && latest.targetRole
      ? `${latest.currentRole} -> ${latest.targetRole}`
      : latest.targetRole ?? latest.currentRole ?? "Кар'єрний сценарій";

  const verdict = verdictLabel(latest.verdictLabel);
  const probability = probabilityLabel(latest.probabilityOfGettingJob);
  const market = mapTargetMarketLabel(latest.targetMarket);
  const priority = mapPriorityLabel(latest.transitionPriority);
  const moneyDelta = formatSignedMoney(latest.ceilingGapMedian);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.16fr),22rem]">
        <div className="workspace-card rounded-[2.2rem] p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <WorkspaceChip tone="success">Активний сценарій</WorkspaceChip>
            <WorkspaceChip tone={simulationStatusTone(latest.status)}>{simulationStatusLabel(latest.status)}</WorkspaceChip>
            {priority ? <WorkspaceChip tone="accent">{priority}</WorkspaceChip> : null}
          </div>

          <h1 className="mt-5 max-w-[15ch] text-[2.25rem] font-semibold leading-[0.94] tracking-[-0.055em] text-white md:text-[3.15rem]">
            {focusTitle}
          </h1>
          <p className="mt-5 max-w-3xl text-[1rem] leading-[1.78] text-white/62">
            Це окремий робочий простір для сценаріїв переходу: останній розрахунок, історія альтернатив і контекст, який потім підтягується в CV,
            вакансії, співбесіди й офери.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricMiniCard
              label="Вердикт"
              value={verdict ?? "Базовий висновок"}
              description="Ключове формулювання з останнього розрахунку."
            />
            <MetricMiniCard
              label="Шанс входу"
              value={probability ?? "ще рахується"}
              description="Орієнтир на реалістичність входу в роль."
            />
            <MetricMiniCard
              label="Ринок"
              value={market ?? "не вказано"}
              description="Контекст для вимог, конкуренції та вакансій."
            />
            <MetricMiniCard
              label="Стеля доходу"
              value={moneyDelta ?? "—"}
              description="Розрив із поточним шляхом у довшій перспективі."
            />
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/simulate" className="workspace-button-primary">
              Перерахувати сценарій
            </Link>
            <Link href="/dashboard?view=resume" className="workspace-button-secondary">
              Перейти до CV Builder
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <article className="workspace-card rounded-[2rem] p-5">
            <h2 className="text-[1.4rem] font-semibold leading-[1.06] tracking-[-0.04em] text-white">Що робити далі</h2>
            <div className="mt-5 space-y-3">
              {[
                "Зафіксувати цільову роль і перевести її в CV Builder.",
                "Порівняти ще один альтернативний маршрут, якщо рішення неочевидне.",
                subscription.plan === "pro"
                  ? "Після цього йти в interview prep і перевірку вакансій."
                  : "Після сильного сценарію логічно відкривати Pro-модулі."
              ].map((item) => (
                <div key={item} className="workspace-card-muted rounded-[1.2rem] p-4">
                  <p className="text-[0.93rem] leading-[1.72] text-white/74">{item}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="workspace-card rounded-[2rem] p-5">
            <h2 className="text-[1.4rem] font-semibold leading-[1.06] tracking-[-0.04em] text-white">Сигнали сценарію</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {verdict ? <WorkspaceChip tone="success">{verdict}</WorkspaceChip> : null}
              {probability ? <WorkspaceChip tone="accent">{probability}</WorkspaceChip> : null}
              {market ? <WorkspaceChip tone="neutral">{market}</WorkspaceChip> : null}
              {priority ? <WorkspaceChip tone="neutral">{priority}</WorkspaceChip> : null}
              {moneyDelta ? <WorkspaceChip tone="gold">{moneyDelta}</WorkspaceChip> : null}
            </div>
          </article>
        </div>
      </div>

      <div className="grid gap-4">
        {recentSimulations.map((simulation) => {
          const roleLabel =
            simulation.currentRole && simulation.targetRole
              ? `${simulation.currentRole} -> ${simulation.targetRole}`
              : simulation.targetRole ?? simulation.currentRole ?? "Кар'єрний сценарій";

          return (
            <article key={simulation.id} className="workspace-card rounded-[1.8rem] p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-[1.3rem] font-semibold leading-[1.15] tracking-[-0.035em] text-white">{roleLabel}</h2>
                  <p className="mt-2 text-[0.94rem] leading-[1.72] text-white/56">
                    {formatDateTime(simulation.createdAt) ? `Збережено ${formatDateTime(simulation.createdAt)}.` : "Збережено в історії кабінету."}
                  </p>
                </div>
                <WorkspaceChip tone={simulationStatusTone(simulation.status)}>{simulationStatusLabel(simulation.status)}</WorkspaceChip>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {verdictLabel(simulation.verdictLabel) ? <WorkspaceChip tone="success">{verdictLabel(simulation.verdictLabel)}</WorkspaceChip> : null}
                {probabilityLabel(simulation.probabilityOfGettingJob) ? (
                  <WorkspaceChip tone="accent">{probabilityLabel(simulation.probabilityOfGettingJob)}</WorkspaceChip>
                ) : null}
                {mapTargetMarketLabel(simulation.targetMarket) ? <WorkspaceChip tone="neutral">{mapTargetMarketLabel(simulation.targetMarket)}</WorkspaceChip> : null}
                {mapPriorityLabel(simulation.transitionPriority) ? <WorkspaceChip tone="neutral">{mapPriorityLabel(simulation.transitionPriority)}</WorkspaceChip> : null}
                {formatSignedMoney(simulation.ceilingGapMedian) ? <WorkspaceChip tone="gold">{formatSignedMoney(simulation.ceilingGapMedian)}</WorkspaceChip> : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ModuleWorkspace({
  moduleView,
  subscription
}: {
  moduleView: Exclude<DashboardView, "overview" | "scenario" | "access">;
  subscription: DashboardAccessState;
}) {
  const config = moduleWorkspaceConfigs[moduleView];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr),22rem]">
        <div className="workspace-card rounded-[2.2rem] p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <WorkspaceChip tone={config.statusTone}>{config.eyebrow}</WorkspaceChip>
            <WorkspaceChip tone={config.statusTone}>{config.statusLabel}</WorkspaceChip>
          </div>

          <h1 className="mt-5 max-w-[15ch] text-[2.2rem] font-semibold leading-[0.94] tracking-[-0.055em] text-white md:text-[3.05rem]">
            {config.title}
          </h1>
          <p className="mt-5 max-w-3xl text-[1rem] leading-[1.78] text-white/62">{config.description}</p>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {config.summary.map((item) => (
              <MetricMiniCard key={item.label} label={item.label} value={item.value} description="Структура інтерфейсу вже закладена в кабінеті." />
            ))}
          </div>
        </div>

        <article className={moduleView === "offers" && subscription.plan !== "pro" ? "workspace-card-accent rounded-[2rem] p-5 text-white" : "workspace-card rounded-[2rem] p-5"}>
          <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-white">Статус модуля</h2>
          <p className="mt-4 text-[0.95rem] leading-[1.74] text-white/70">
            {moduleView === "offers" && subscription.plan !== "pro"
              ? "Модуль уже присутній у навігації й готовий до підключення логіки, але повний доступ логічно залишено в Pro-плані."
              : "Інтерфейс і місце модуля в маршруті вже закладені. Наступним етапом сюди можна підключати окрему бізнес-логіку без перебудови кабінету."}
          </p>

          <div className="mt-5 space-y-3">
            <div className="workspace-card-muted rounded-[1.2rem] p-4">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-white/34">Навігація</p>
              <p className="mt-2 text-[0.94rem] leading-[1.65] text-white/74">Розділ уже винесений у sidebar й не змішується з dashboard overview.</p>
            </div>
            <div className="workspace-card-muted rounded-[1.2rem] p-4">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-white/34">UX логіка</p>
              <p className="mt-2 text-[0.94rem] leading-[1.65] text-white/74">Кожен модуль має власний workspace, а головний dashboard лишається центром навігації.</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard" className="workspace-button-secondary">
              Повернутися на dashboard
            </Link>
            {moduleView === "offers" && subscription.plan !== "pro" ? (
              <Link href="/pricing" className="workspace-button-primary">
                Відкрити Pro
              </Link>
            ) : null}
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {config.lanes.map((lane) => (
          <article key={lane.title} className="workspace-card rounded-[1.9rem] p-5 md:p-6">
            <h2 className="text-[1.35rem] font-semibold leading-[1.08] tracking-[-0.035em] text-white">{lane.title}</h2>
            <p className="mt-3 text-[0.94rem] leading-[1.72] text-white/56">{lane.description}</p>
            <div className="mt-5 space-y-3">
              {lane.items.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-[1.2rem] border border-white/8 bg-white/[0.04] px-4 py-3">
                  <span className="mt-2 inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-[rgba(140,153,255,0.94)]" />
                  <p className="text-[0.93rem] leading-[1.65] text-white/78">{item}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function DashboardAccess({
  accessLabel,
  subscription,
  email,
  onSignOut,
  isSigningOut
}: {
  accessLabel: string;
  subscription: DashboardAccessState;
  email: string;
  onSignOut: () => void;
  isSigningOut: boolean;
}) {
  const monthlyPlan = pricingPlans[0];
  const annualPlan = pricingPlans[1];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr),22rem]">
        <div className="workspace-card rounded-[2.2rem] p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <WorkspaceChip tone={accessTone(subscription.plan, subscription.status)}>Тариф і доступ</WorkspaceChip>
            <WorkspaceChip tone={accessTone(subscription.plan, subscription.status)}>{accessLabel}</WorkspaceChip>
          </div>

          <h1 className="mt-5 max-w-[14ch] text-[2.2rem] font-semibold leading-[0.94] tracking-[-0.055em] text-white md:text-[3.1rem]">
            Статус плану, billing і керування акаунтом в одному місці
          </h1>
          <p className="mt-5 max-w-3xl text-[1rem] leading-[1.78] text-white/62">
            Окремий сервісний екран для всього, що стосується доступу: план, email акаунта, орієнтир по цінах і місце для майбутнього billing без
            змішування з основними модулями продукту.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <MetricMiniCard label="Акаунт" value={email} description="Саме за цим профілем закріплений доступ до модулів." />
            <MetricMiniCard
              label="Поточний план"
              value={subscription.plan === "pro" ? "Pro" : "Free"}
              description={subscription.currentPeriodEnd ? `Активний до ${formatDateTime(subscription.currentPeriodEnd) ?? "поточної дати"}.` : "Базовий доступ без billing."}
            />
            <MetricMiniCard
              label="Що далі"
              value={subscription.plan === "pro" ? "Керувати підпискою" : "Оновити план"}
              description={subscription.plan === "pro" ? "Billing і ліміти логічно живуть саме тут." : "Після апгрейду цей блок стане центром billing."}
            />
          </div>
        </div>

        <article className="workspace-card rounded-[2rem] p-5">
          <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-white">Дії по акаунту</h2>
          <div className="mt-5 space-y-3">
            <Link href="/pricing" className="workspace-button-secondary w-full">
              Переглянути тарифи
            </Link>
            <Link href="/checkout?plan=monthly" className="workspace-button-primary w-full">
              Відкрити оплату
            </Link>
            <button type="button" onClick={onSignOut} disabled={isSigningOut} className="workspace-button-dark w-full disabled:opacity-60">
              {isSigningOut ? "Виходимо..." : "Вийти з акаунта"}
            </button>
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
        <article className="workspace-card rounded-[1.9rem] p-5 md:p-6">
          <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-white">Орієнтир по планах</h2>

          <div className="mt-5 space-y-4">
            <div className="workspace-card-muted rounded-[1.35rem] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[1.05rem] font-semibold text-white">{monthlyPlan.name}</p>
                <WorkspaceChip tone="accent">{formatUah(monthlyPlan.billedNowUah)}</WorkspaceChip>
              </div>
              <p className="mt-3 text-[0.93rem] leading-[1.68] text-white/58">{monthlyPlan.billingLabel}</p>
            </div>

            <div className="workspace-card-muted rounded-[1.35rem] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[1.05rem] font-semibold text-white">{annualPlan.name}</p>
                <WorkspaceChip tone="success">{formatUah(annualPlan.billedNowUah)}</WorkspaceChip>
              </div>
              <p className="mt-3 text-[0.93rem] leading-[1.68] text-white/58">
                {annualPlan.billingLabel}. Економія {formatUah(annualPlan.savingsUah)} за рік.
              </p>
            </div>
          </div>
        </article>

        <article className="workspace-card rounded-[1.9rem] p-5 md:p-6">
          <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-white">Що відкриває план</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {dashboardModules.map((module) => (
              <div key={module.view} className="rounded-[1.25rem] border border-white/8 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[0.98rem] font-semibold text-white">{module.title}</p>
                  <WorkspaceChip tone={module.statusTone}>{module.statusLabel}</WorkspaceChip>
                </div>
                <p className="mt-3 text-[0.88rem] leading-[1.62] text-white/56">{module.description}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}

export function DashboardShell({
  requestedView,
  requestedSearch
}: {
  requestedView?: string | null;
  requestedSearch?: string | null;
}) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { openAuthDialog } = useAuthDialog();
  const [state, setState] = useState<DashboardState>({ status: "loading" });
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    setIsSigningOut(false);
  };

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
  const searchQuery = normalizeSearchQuery(requestedSearch);
  const accessLabel = mapAccessLabel(state.subscription.plan, state.subscription.status);
  const lastSimulation = state.recentSimulations[0] ?? null;
  const moduleView = isModuleWorkspaceView(activeView) ? activeView : null;

  return (
    <section className="dashboard-screen dashboard-workspace py-6 md:py-8">
      <div className="mx-auto max-w-[1480px] px-4 md:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[18rem,minmax(0,1fr)]">
          <DashboardSidebar
            activeView={activeView}
            totalSimulations={state.totalSimulations}
            accessLabel={accessLabel}
            subscription={state.subscription}
          />

          <div className="min-w-0">
            {activeView === "overview" ? (
              <DashboardOverview
                userDisplayName={state.user.displayName}
                accessLabel={accessLabel}
                subscription={state.subscription}
                totalSimulations={state.totalSimulations}
                recentSimulations={state.recentSimulations}
                lastSimulation={lastSimulation}
                searchQuery={searchQuery}
              />
            ) : null}

            {activeView === "scenario" ? (
              <DashboardScenarioWorkspace recentSimulations={state.recentSimulations} subscription={state.subscription} />
            ) : null}

            {moduleView ? <ModuleWorkspace moduleView={moduleView} subscription={state.subscription} /> : null}

            {activeView === "access" ? (
              <DashboardAccess
                accessLabel={accessLabel}
                subscription={state.subscription}
                email={state.user.email}
                onSignOut={handleSignOut}
                isSigningOut={isSigningOut}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
