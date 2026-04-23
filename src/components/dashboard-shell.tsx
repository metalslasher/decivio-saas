"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { useAuthDialog } from "@/components/auth-dialog-provider";
import { BrandBadge } from "@/components/brand-badge";
import { WordmarkLogo } from "@/components/wordmark-logo";
import {
  englishLevelOptions,
  experienceLevelOptions,
  parseStoredCareerSwitchInputs,
  targetMarketOptions,
  transitionPriorityOptions,
  type EnglishLevel,
  type ExperienceLevel,
  type TargetMarket,
  type TransitionPriority,
} from "@/lib/career-switch-form";
import { getSupabaseBrowserClient } from "@/lib/db/supabase-browser";
import { GUEST_USER_COOKIE_NAME } from "@/lib/guest-session";
import { PASSWORD_POLICY_HINT, validateStrongPassword } from "@/lib/password-policy";
import { emitProfileUpdated } from "@/lib/profile-broadcast";
import {
  createEmptyProfileContext,
  jobSearchStageOptions,
  mergeProfileContext,
  parseProfileContext,
  workPreferenceOptions,
  type JobSearchStage,
  type ProfileContext,
  type WorkPreference,
} from "@/lib/profile-context";
import { formatUah, pricingPlans } from "@/lib/pricing";

type DashboardView =
  | "overview"
  | "scenario"
  | "profile"
  | "resume"
  | "interviews"
  | "jobs"
  | "offers"
  | "assistant"
  | "access";

type ChipTone = "default" | "accent" | "success" | "gold";

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
      profile: DashboardUserProfile;
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
  betterLongTermDirection: string | null;
  riskLevel: string | null;
  probabilityOfGettingJob: number | null;
  ceilingGapMedian: number | null;
  currentBestCaseMedian: number | null;
  targetBestCaseMedian: number | null;
  profileContextSeed: Partial<ProfileContext>;
};

type DashboardUserProfile = {
  fullName: string | null;
  timezone: string | null;
  avatarUrl: string | null;
  context: ProfileContext;
  completion: number;
};

type ProfileRow = {
  email?: string | null;
  full_name?: string | null;
  timezone?: string | null;
  avatar_url?: string | null;
  profile_context?: unknown;
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

type DashboardProgressStep = {
  label: string;
  progress: number;
  href?: string;
};

type DashboardNavItem = {
  view: DashboardView;
  label: string;
  helper: string;
  icon: ReactNode;
};

type DashboardModule = {
  view: Exclude<DashboardView, "overview" | "scenario" | "profile" | "access">;
  title: string;
  description: string;
  helper: string;
  searchTerms: string[];
  icon: ReactNode;
};

type ModuleWorkspaceConfig = {
  eyebrow: string;
  title: string;
  description: string;
  summary: Array<{ label: string; value: string }>;
  columns: Array<{
    title: string;
    description: string;
    items: string[];
  }>;
};

type ProfileDraft = {
  full_name: string;
  timezone: string;
  avatar_url: string | null;
  city: string;
  current_income: string;
  current_role: string;
  current_experience_years: string;
  target_role: string;
  experience_level: ExperienceLevel | "";
  english_level: EnglishLevel | "";
  target_market: TargetMarket | "";
  transition_priority: TransitionPriority | "";
  weekly_learning_hours: string;
  work_preference: WorkPreference | "";
  job_search_stage: JobSearchStage | "";
  linkedin_url: string;
  portfolio_url: string;
  focus_note: string;
};

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

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 11.5L12 4l9 7.5" />
      <path d="M5.5 10.5V20h13V10.5" />
      <path d="M9.5 20v-5h5v5" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
      <path d="M9 7.5h3.8A3.2 3.2 0 0 1 16 10.7v2.8" />
      <path d="M15 16.5h-3.7A3.3 3.3 0 0 1 8 13.2v-2.7" />
    </svg>
  );
}

function ResumeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5Z" />
      <path d="M14 3.5V8h4" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </svg>
  );
}

function InterviewIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 17.5h8l4 3v-12A2.5 2.5 0 0 0 15.5 6h-9A2.5 2.5 0 0 0 4 8.5V15a2.5 2.5 0 0 0 2 2.45Z" />
      <path d="M8 10h6" />
      <path d="M8 13h4" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 7V5.8A1.8 1.8 0 0 1 9.8 4h4.4A1.8 1.8 0 0 1 16 5.8V7" />
      <rect x="3" y="7" width="18" height="13" rx="2.5" />
      <path d="M3 12.5h18" />
      <path d="M10 12.5v1.2A1.3 1.3 0 0 0 11.3 15h1.4a1.3 1.3 0 0 0 1.3-1.3v-1.2" />
    </svg>
  );
}

function OfferIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
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
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3.5l1.5 4.2L17.7 9l-4.2 1.4L12 14.6l-1.5-4.2L6.3 9l4.2-1.3L12 3.5Z" />
      <path d="M18.5 14.5l.8 2.3 2.2.7-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.7.8-2.3Z" />
      <path d="M6.5 14.5l.9 2.5 2.6.8-2.6.9-.9 2.5-.9-2.5-2.5-.9 2.5-.8.9-2.5Z" />
    </svg>
  );
}

function CreditCardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="M3 10h18" />
      <path d="M7.5 14.5h3.5" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19c1.7-3.4 4.2-5.1 7-5.1s5.3 1.7 7 5.1" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="10" width="14" height="10" rx="2.5" />
      <path d="M8 10V7.8A4 4 0 0 1 12 4a4 4 0 0 1 4 3.8V10" />
      <path d="M12 14v2.6" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 16V5" />
      <path d="M7.5 9.5L12 5l4.5 4.5" />
      <path d="M5 18.5h14" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12h3l2-4 3 8 2.5-5H20" />
      <path d="M5 19.5h14" />
      <path d="M5 4.5h14" opacity="0.36" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none" aria-hidden="true">
      <path
        d="M4 7H20M4 12H20M4 17H20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none" aria-hidden="true">
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none" aria-hidden="true">
      <path
        d="M9 6L4 12l5 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 5v14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none" aria-hidden="true">
      <path
        d="M15 6l5 6-5 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 5v14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

const dashboardNavItems: DashboardNavItem[] = [
  {
    view: "overview",
    label: "Головна",
    helper: "Останній сценарій, модулі й пріоритети.",
    icon: <HomeIcon />,
  },
  {
    view: "scenario",
    label: "Сценарії",
    helper: "Останній розрахунок і історія переходів.",
    icon: <RouteIcon />,
  },
  {
    view: "resume",
    label: "Резюме",
    helper: "Резюме під цільову роль і вакансію.",
    icon: <ResumeIcon />,
  },
  {
    view: "interviews",
    label: "Співбесіди",
    helper: "Питання, пробна співбесіда і відгук.",
    icon: <InterviewIcon />,
  },
  {
    view: "jobs",
    label: "Нова робота",
    helper: "Перші дні, адаптація й очікування від ролі.",
    icon: <BriefcaseIcon />,
  },
  {
    view: "offers",
    label: "Пропозиції",
    helper: "Порівняння пропозицій і рішень.",
    icon: <OfferIcon />,
  },
  {
    view: "assistant",
    label: "Помічник",
    helper: "Контекстні підказки по всьому маршруту.",
    icon: <SparkIcon />,
  },
];

const dashboardModules: DashboardModule[] = [
  {
    view: "resume",
    title: "Резюме",
    description:
      "Окремий розділ для адаптації резюме під роль, рівень і конкретну вакансію.",
    helper: "Після сильного сценарію це перший логічний крок до ринку.",
    searchTerms: ["резюме", "cv", "вакансія", "роль"],
    icon: <ResumeIcon />,
  },
  {
    view: "interviews",
    title: "Підготовка до співбесід",
    description:
      "Місце для питань, пробної співбесіди й підсвітки слабких відповідей під цільову роль.",
    helper:
      "Працює після сценарію і резюме, коли вже зрозуміло, куди ви йдете.",
    searchTerms: ["співбесіди", "співбесіда", "пробна", "питання"],
    icon: <InterviewIcon />,
  },
  {
    view: "jobs",
    title: "Перші дні на новій роботі",
    description:
      "Окремий модуль про старт у ролі, адаптацію, очікування від команди й перші тижні.",
    helper: "Допомагає перейти від оферу до реальної роботи без хаосу.",
    searchTerms: ["перші дні", "нова робота", "адаптація", "старт"],
    icon: <BriefcaseIcon />,
  },
  {
    view: "offers",
    title: "Порівняння пропозицій",
    description:
      "Матриця рішень по зарплаті, ризику, траєкторії й аргументах для переговорів.",
    helper: "Фінальний блок для рішення, коли пропозиція вже на столі.",
    searchTerms: ["пропозиція", "офер", "переговори", "зарплата"],
    icon: <OfferIcon />,
  },
  {
    view: "assistant",
    title: "Кар'єрний помічник",
    description:
      "Контекстний помічник для сценаріїв, резюме, вакансій і співбесід із короткими наступними діями.",
    helper: "Допомагає швидше переходити між модулями й не губити контекст.",
    searchTerms: ["помічник", "поради", "кроки", "контекст"],
    icon: <SparkIcon />,
  },
];

const moduleWorkspaceConfigs: Record<
  DashboardModule["view"],
  ModuleWorkspaceConfig
> = {
  resume: {
    eyebrow: "Резюме",
    title: "Робочий простір для резюме під цільову роль",
    description:
      "Цей модуль уже виділено в окремий розділ: тут логічно збирати резюме під роль, вакансію й рівень без змішування з іншими задачами кабінету.",
    summary: [
      { label: "Вхід", value: "Сценарій, досвід, вакансія" },
      { label: "Фокус", value: "Досягнення, цифри, релевантність" },
      { label: "Вихід", value: "Чернетка резюме та версії під ролі" },
    ],
    columns: [
      {
        title: "Що тут має жити",
        description:
          "Окремі зони під базову версію резюме, адаптацію під вакансію й бібліотеку варіантів.",
        items: [
          "Блок досягнень із цифрами",
          "Структура для систем відбору і читабельність",
          "Швидкий перехід до перевірки вакансії",
        ],
      },
      {
        title: "Перший реліз",
        description:
          "У цей екран природно підключати форму, редактор секцій і оцінку якості резюме.",
        items: [
          "Збір цільової ролі",
          "Підсвітка слабких формулювань",
          "Фінальний експорт у PDF",
        ],
      },
      {
        title: "Місце в маршруті",
        description:
          "Модуль іде слідом за сильним сценарієм і веде в підготовку до співбесід.",
        items: [
          "Після сценарію переходу",
          "Перед відгуками",
          "Поруч із вакансіями та інтерв'ю",
        ],
      },
    ],
  },
  interviews: {
    eyebrow: "Співбесіди",
    title: "Окремий розділ для підготовки до співбесід",
    description:
      "Тут буде окремий інтерфейс для першої розмови з рекрутером, співбесіди з менеджером і практичних питань без змішування з аналітикою переходу.",
    summary: [
      { label: "Вхід", value: "Роль, рівень, вакансія" },
      { label: "Фокус", value: "Слабкі місця й аргументація" },
      { label: "Вихід", value: "Пакет питань + пробний сценарій" },
    ],
    columns: [
      {
        title: "Що тут має жити",
        description:
          "Потоки під розмову з рекрутером, співбесіду з менеджером і кейсову частину.",
        items: [
          "Добірка питань за роллю",
          "Сильні й слабкі відповіді",
          "Пробний режим із відгуком",
        ],
      },
      {
        title: "Перший реліз",
        description:
          "Сюди можна підключати генерацію запитань, оцінку відповідей і пріоритети тренування.",
        items: [
          "Розділення по етапах співбесіди",
          "Коментарі до відповідей",
          "План тренування по слабких місцях",
        ],
      },
      {
        title: "Місце в маршруті",
        description:
          "Модуль працює після розділу з резюме, коли користувач уже рухається до ринку.",
        items: [
          "Після підготовки резюме",
          "Перед активними відгуками",
          "Перед фінальними співбесідами",
        ],
      },
    ],
  },
  jobs: {
    eyebrow: "Нова робота",
    title: "Розділ для реалістичного старту в ролі",
    description:
      "Окремий модуль про темп роботи, адаптацію, очікування від нової ролі й перші тижні після оферу.",
    summary: [
      { label: "Вхід", value: "Роль, команда, контекст" },
      { label: "Фокус", value: "Ризики старту й адаптація" },
      { label: "Вихід", value: "План входу в роль" },
    ],
    columns: [
      {
        title: "Що тут має жити",
        description:
          "Картина реального робочого дня, ролі менеджера й стартових очікувань.",
        items: [
          "Розподіл дня по типах задач",
          "Що від вас чекатимуть у перший місяць",
          "Де найчастіше просідають новачки",
        ],
      },
      {
        title: "Перший реліз",
        description:
          "У модуль природно лягають чеклісти адаптації та план перших 30 днів.",
        items: [
          "Шаблон 30 днів",
          "Теми для синків із менеджером",
          "Перелік стартових ризиків",
        ],
      },
      {
        title: "Місце в маршруті",
        description:
          "Це продовження сценаріїв та оферів, а не окрема історія сама по собі.",
        items: [
          "Після прийняття оферу",
          "Перед стартом у ролі",
          "Для зниження стресу на вході",
        ],
      },
    ],
  },
  offers: {
    eyebrow: "Пропозиції",
    title: "Блок рішень для порівняння пропозицій",
    description:
      "Окремий екран під матрицю доходу, ризику, умов і компромісів. Це логічна фінальна зона прийняття рішення після сценаріїв і співбесід.",
    summary: [
      { label: "Вхід", value: "Поточна роль + 1-2 офери" },
      { label: "Фокус", value: "Ризик, гроші, час" },
      { label: "Вихід", value: "Рекомендація по рішенню" },
    ],
    columns: [
      {
        title: "Що тут має жити",
        description:
          "Не лише зарплата, а повне порівняння траєкторій, ризику і простору для переговорів.",
        items: [
          "Матриця оферів поруч",
          "Ризик-період на старті",
          "Аргументи для прийняття або торгу",
        ],
      },
      {
        title: "Перший реліз",
        description:
          "Сюди логічно підключати параметри пропозиції, запас міцності та підсумок рішення.",
        items: [
          "Форма умов пропозиції",
          "Сильні й слабкі сторони",
          "Висновок по відповідності й часу",
        ],
      },
      {
        title: "Місце в маршруті",
        description:
          "Це останній великий крок перед стартом у новій ролі, коли рішення вже потрібно приймати.",
        items: [
          "Коли є конкретна пропозиція",
          "Для порівняння двох маршрутів",
          "Для переговорів про умови",
        ],
      },
    ],
  },
  assistant: {
    eyebrow: "Помічник",
    title: "Контекстний помічник для всього кабінету",
    description:
      "Окремий розділ із короткими підказками, який розуміє ваш сценарій, модулі, доступ і може запропонувати наступний крок без шуму.",
    summary: [
      { label: "Вхід", value: "Контекст користувача і модулів" },
      { label: "Фокус", value: "Короткі наступні дії" },
      { label: "Вихід", value: "Підказки в контексті маршруту" },
    ],
    columns: [
      {
        title: "Що тут має жити",
        description:
          "Чат, швидкі команди й короткі сценарії дій усередині кабінету.",
        items: [
          "Підказки для резюме і вакансій",
          "Поради для сценаріїв та пропозицій",
          "Пояснення складних рішень простою мовою",
        ],
      },
      {
        title: "Перший реліз",
        description:
          "Сюди добре лягає чат, пам'ять по користувачу й переходи до потрібних модулів.",
        items: [
          "Готові запити з головного екрана",
          "Поради на основі останнього сценарію",
          "Контекстні переходи в модулі",
        ],
      },
      {
        title: "Місце в маршруті",
        description:
          "Помічник не дублює модулі, а пришвидшує рух між ними й економить увагу.",
        items: [
          "Працює поверх усієї навігації",
          "Підказує, з чого почати",
          "Не дає загубитися в наступних кроках",
        ],
      },
    ],
  },
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

function getErrorMessage(error: unknown) {
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

function isMissingProfileExtensionSchema(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes("profile_context") || message.includes("avatar_url");
}

function isMissingAvatarStorageSetup(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("avatars") &&
    (message.includes("bucket") ||
      message.includes("storage") ||
      message.includes("not found"))
  );
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

function getShortProfileLabel(displayName: string, email: string) {
  const normalized = displayName.trim();
  if (normalized) {
    return normalized;
  }

  return email.split("@")[0]?.trim() ?? email;
}

function getInitials(value: string) {
  const normalized = value.replace(/[^a-zA-Zа-яА-ЯіїєІЇЄґҐ0-9]+/g, " ").trim();
  const parts = normalized.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return (parts[0] ?? normalized.slice(0, 2) ?? "DC").slice(0, 2).toUpperCase();
}

function mapTargetMarketLabel(value: string | null) {
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

function mapExperienceLevelLabel(value: ExperienceLevel | null) {
  return (
    experienceLevelOptions.find((item) => item.value === value)?.label ?? null
  );
}

function mapEnglishLevelLabel(value: EnglishLevel | null) {
  return (
    englishLevelOptions.find((item) => item.value === value)?.label ?? null
  );
}

function mapWorkPreferenceLabel(value: WorkPreference | null) {
  return (
    workPreferenceOptions.find((item) => item.value === value)?.label ?? null
  );
}

function mapJobSearchStageLabel(value: JobSearchStage | null) {
  return (
    jobSearchStageOptions.find((item) => item.value === value)?.label ?? null
  );
}

function buildProfileCompletion(
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

function buildMissingProfileItems(
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
    items.push("Уточніть цільову роль для модулів і сценаріїв.");
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

function buildProfileContextSeed(simulation: DashboardSimulation | null) {
  return simulation?.profileContextSeed ?? {};
}

function getBrowserTimeZone() {
  if (typeof Intl === "undefined") {
    return null;
  }

  const value = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function toDraftValue(value: string | number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function buildProfileDraft(
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

function normalizeOptionalInput(value: string) {
  const normalized = value.trim();
  return normalized === "" ? null : normalized;
}

function parseOptionalNumberInput(
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

function normalizeOptionalUrl(value: string, label: string) {
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

function mapAccessLabel(
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

function accessTone(
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

function verdictLabel(value: string | null) {
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

function probabilityLabel(value: number | null) {
  if (value === null) {
    return null;
  }

  const normalized = value <= 1 ? value * 100 : value;
  return `${Math.round(normalized)}% шанс входу`;
}

function riskLevelLabel(value: string | null) {
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

function buildLongTermDirectionInsight(
  value: string | null,
  simulation: Pick<DashboardSimulation, "currentRole" | "targetRole"> | null,
) {
  switch (value) {
    case "current_role":
      return simulation?.currentRole
        ? `У довшій перспективі сильнішим виглядає поточний напрям: ${simulation.currentRole}. Цільову роль краще тестувати через альтернативні сценарії.`
        : "У довшій перспективі сильнішим виглядає поточний напрям, тому цільову роль краще тестувати через альтернативні сценарії.";
    case "target_role":
      return simulation?.targetRole
        ? `У довшій перспективі сильнішим виглядає ${simulation.targetRole}. Саме цей напрям варто тримати як базовий для наступних модулів.`
        : "У довшій перспективі сильнішим виглядає цільовий напрям. Саме його варто тримати як базовий для наступних модулів.";
    case "balanced":
      return "У довшій перспективі обидва напрями виглядають близько, тому рішення краще приймати через порівняння кількох маршрутів, а не одного сценарію.";
    default:
      return null;
  }
}

function moduleSummaryDescription(label: string) {
  switch (label) {
    case "Вхід":
      return "Що саме модуль бере за основу перед стартом.";
    case "Фокус":
      return "На чому тримається головна цінність цього розділу.";
    case "Вихід":
      return "Що користувач має отримати на виході з цього модуля.";
    default:
      return "Ключовий зріз цього розділу.";
  }
}

function formatDateTime(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : dateFormatter.format(parsed);
}

function formatShortDate(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? null
    : shortDateFormatter.format(parsed);
}

function formatSignedMoney(value: number | null) {
  if (value === null) {
    return null;
  }

  const rounded = Math.round(value);
  const sign = rounded > 0 ? "+" : rounded < 0 ? "-" : "";
  return `${sign}${formatUah(Math.abs(rounded))}`;
}

function extractSimulationSnapshot(
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

function getDashboardView(value: string | null): DashboardView {
  switch (value) {
    case "scenario":
    case "profile":
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

function readCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${escapedName}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function isValidGuestSessionId(value: string | null) {
  return typeof value === "string" && uuidPattern.test(value);
}

function buildProgressSteps(
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
      label: "Заповнити стартовий сценарій переходу",
      progress: totalSimulations > 0 ? 100 : 12,
      href: totalSimulations > 0 ? getDashboardHref("scenario") : "/simulate",
    },
    {
      label: "Порівняти 2-3 маршрути переходу",
      progress:
        totalSimulations >= 3
          ? 100
          : totalSimulations === 2
            ? 76
            : totalSimulations === 1
              ? 42
              : 0,
      href: getDashboardHref("scenario"),
    },
    {
      label: "Зібрати резюме під цільову роль",
      progress:
        subscription.plan === "pro" ? (totalSimulations > 0 ? 38 : 10) : 0,
      href: getDashboardHref("resume"),
    },
    {
      label: "Пройти пробну співбесіду",
      progress:
        subscription.plan === "pro" ? (totalSimulations > 0 ? 18 : 0) : 0,
      href: getDashboardHref("interviews"),
    },
    {
      label: "Оцінити відповідність пропозиції",
      progress: 0,
      href: getDashboardHref("offers"),
    },
  ];
}

function buildInsights(
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
        ? "Спершу дозаповніть профіль, щоб кабінет і модулі підлаштовувались під ваш контекст точніше."
        : "Почніть із першої симуляції, щоб головний екран перестав бути загальним і підлаштувався під ваш маршрут.",
      subscription.plan === "pro"
        ? "У вас уже відкритий повний набір модулів. Після першого сценарію можна одразу йти в розділ резюме та підготовку до співбесід."
        : "Поки достатньо зібрати один сильний сценарій. Платні модулі логічно підключати вже після цього.",
      "Навігація в кабінеті побудована по маршруту: сценарії -> резюме -> співбесіди -> пропозиції -> нова робота.",
    ];
  }

  return [
    verdict
      ? `${verdict}. Тримайте цей маршрут як базовий фокус кабінету.`
      : "Останній сценарій уже задає контекст для наступних модулів.",
    probability
      ? `${probability}. Це хороший орієнтир, щоб вирішити, чи переходити до розділу резюме й підготовки до співбесід уже зараз.`
      : "Після сценарію логічно перейти до резюме й перевірки, як ви виглядаєте під реальні вакансії.",
    profileCompletion < 80
      ? `Профіль заповнений на ${profileCompletion}%. Дозаповніть його, щоб поради в модулях були точнішими.`
      : targetMarket
        ? `Орієнтир зараз: ${targetMarket}. Це впливатиме і на вакансії, і на мову резюме, і на вимоги ринку.`
        : totalSimulations > 1
          ? "Спробуйте ще один альтернативний маршрут, щоб бачити не одну точку, а поле рішень."
          : "Після першого розрахунку варто додати альтернативний сценарій для порівняння.",
  ];
}

function buildActivityItems(
  recentSimulations: DashboardSimulation[],
  subscription: DashboardAccessState,
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
      title: "Кабінет готовий до стартового сценарію",
      description:
        "Після першого розрахунку тут підтягнуться фокус, історія та рекомендації.",
    },
    {
      title:
        subscription.plan === "pro"
          ? "План Pro уже активний"
          : "Базовий доступ активний",
      description:
        subscription.plan === "pro"
          ? "Усі модулі прив'язані до цього акаунта."
          : "Після оновлення тут з'являться оплата й межі плану.",
    },
  ];
}

function chipClasses(tone: ChipTone) {
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

function DashboardChip({
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

function DashboardSkeleton() {
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

function DashboardGuest({
  onLogin,
  onSignup,
}: {
  onLogin: () => void;
  onSignup: () => void;
}) {
  return (
    <section className="dashboard-shell-screen dashboard-shell">
      <div className="mx-auto w-full px-4 py-6 md:px-6 xl:px-8">
        <div className="flex items-center gap-3 py-2">
          <BrandBadge />
          <Link
            href="/"
            className="inline-flex items-center"
            aria-label="Decivio"
          >
            <WordmarkLogo className="text-[2.05rem] md:text-[2.2rem]" />
          </Link>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.08fr,0.92fr] xl:items-center">
          <article className="dashboard-spotlight-card rounded-[2.3rem] p-6 md:p-8">
            <DashboardChip tone="accent">Особистий кабінет</DashboardChip>
            <h1 className="mt-5 max-w-[11ch] text-[2.5rem] font-semibold leading-[0.92] tracking-[-0.055em] text-[var(--text-strong)] md:text-[3.5rem]">
              Кабінет відкривається після входу.
            </h1>
            <p className="mt-5 max-w-2xl text-[1rem] leading-[1.78] text-[var(--text-muted)]">
              Після авторизації тут зʼявиться робочий простір зі сценаріями,
              історією переходів, модульною навігацією, доступом до тарифу та
              окремими екранами під резюме, співбесіди, пропозиції й помічника.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button type="button" onClick={onLogin} className="btn-secondary">
                Увійти
              </button>
              <button type="button" onClick={onSignup} className="btn-primary">
                Створити акаунт
              </button>
            </div>
          </article>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              [
                "Ліва навігація",
                "Бокове меню живе окремо від контенту й лишається під рукою.",
              ],
              [
                "Модулі",
                "Кожен інструмент має свій розділ, а не змішується в один екран.",
              ],
              [
                "Останній сценарій",
                "У фокусі завжди останній розрахунок або онбординг, якщо його ще не було.",
              ],
              [
                "Доступ",
                "Тариф, оплата й керування акаунтом винесені в окремий сервісний розділ.",
              ],
            ].map(([title, description]) => (
              <article
                key={title}
                className="surface-panel rounded-[1.7rem] p-5"
              >
                <h2 className="text-[1.1rem] font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
                  {title}
                </h2>
                <p className="mt-3 text-[0.94rem] leading-[1.7] text-[var(--text-muted)]">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardError({ message }: { message: string }) {
  return (
    <section className="dashboard-shell-screen dashboard-shell">
      <div className="mx-auto w-full px-4 py-8 md:px-6 xl:px-8">
        <div className="surface-panel rounded-[2.3rem] p-6 md:p-8">
          <DashboardChip tone="gold">Помилка</DashboardChip>
          <h1 className="mt-5 max-w-[11ch] text-[2.4rem] font-semibold leading-[0.94] tracking-[-0.05em] text-[var(--text-strong)] md:text-[3.1rem]">
            Кабінет тимчасово недоступний.
          </h1>
          <p className="mt-5 max-w-2xl text-[1rem] leading-[1.78] text-[var(--text-muted)]">
            {message}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/simulate" className="btn-primary">
              Перейти до симуляції
            </Link>
            <Link href="/" className="btn-secondary">
              На головну
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardMetricCard({
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

function DashboardAvatar({
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

function DashboardProgressRow({
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

function DashboardModuleCard({ module }: { module: DashboardModule }) {
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

function DashboardAccountMenuContent({
  onSignOut,
  isSigningOut,
}: {
  onSignOut: () => void;
  isSigningOut: boolean;
}) {
  return (
    <>
      <Link href={getDashboardHref("profile")} className="account-menu-link">
        <span className="account-menu-icon">
          <UserIcon />
        </span>
        <span>Профіль</span>
      </Link>
      <Link href={getDashboardHref("access")} className="account-menu-link">
        <span className="account-menu-icon">
          <CreditCardIcon />
        </span>
        <span>Доступ</span>
      </Link>
      <div className="account-menu-divider" />
      <button
        type="button"
        onClick={onSignOut}
        disabled={isSigningOut}
        className="account-menu-link account-menu-link-danger disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg
          viewBox="0 0 24 24"
          className="account-menu-icon"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M14 7l5 5-5 5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 12h11"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M10 5H6.8A1.8 1.8 0 0 0 5 6.8v10.4A1.8 1.8 0 0 0 6.8 19H10"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        {isSigningOut ? "Виходимо..." : "Вийти"}
      </button>
    </>
  );
}

function DashboardSidebarAccount({
  displayName,
  email,
  avatarUrl,
  accessLabel,
  isCompact,
  onSignOut,
  isSigningOut,
}: {
  displayName: string;
  email: string;
  avatarUrl: string | null;
  accessLabel: string;
  isCompact: boolean;
  onSignOut: () => void;
  isSigningOut: boolean;
}) {
  const profileLabel = getShortProfileLabel(displayName, email);
  const menuPositionClass = isCompact
    ? "left-full bottom-0 pl-3"
    : "bottom-full left-0 right-0 pb-3";
  const panelWidthClass = isCompact ? "min-w-[15rem]" : "w-full min-w-[16rem]";

  return (
    <div className={`group relative ${isCompact ? "mx-auto" : ""}`}>
      <button
        type="button"
        className={`dashboard-profile-pill w-full ${isCompact ? "h-14 w-14 justify-center rounded-[1.35rem] p-0" : "justify-between px-3.5 py-3"}`}
        aria-haspopup="menu"
        aria-label="Відкрити меню акаунта"
        title={profileLabel}
      >
        <span
          className={`flex min-w-0 items-center ${isCompact ? "justify-center" : "gap-3"}`}
        >
          <DashboardAvatar
            label={displayName}
            avatarUrl={avatarUrl}
            sizeClassName={isCompact ? "h-10 w-10" : "h-11 w-11"}
            textClassName="text-sm font-semibold"
          />
          {!isCompact ? (
            <span className="min-w-0 text-left">
              <span className="block truncate text-sm font-semibold text-[var(--text-strong)]">
                {profileLabel}
              </span>
              <span className="mt-1 block truncate text-[0.78rem] leading-[1.4] text-[var(--text-soft)]">
                {accessLabel}
              </span>
            </span>
          ) : null}
        </span>

        {!isCompact ? (
          <span className="text-lg leading-none text-[var(--text-soft)]">
            ›
          </span>
        ) : null}
      </button>

      <div
        className={`pointer-events-none absolute z-40 opacity-0 transition-all duration-150 ease-out group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 ${menuPositionClass}`}
      >
        <div className={`account-menu-panel p-2 ${panelWidthClass}`}>
          <DashboardAccountMenuContent
            onSignOut={onSignOut}
            isSigningOut={isSigningOut}
          />
        </div>
      </div>
    </div>
  );
}

function DashboardSidebar({
  activeView,
  isCompact,
  canCompact,
  isMobileOpen,
  displayName,
  email,
  avatarUrl,
  accessLabel,
  onSignOut,
  isSigningOut,
  onToggleCollapsed,
  onCloseMobile,
}: {
  activeView: DashboardView;
  isCompact: boolean;
  canCompact: boolean;
  isMobileOpen: boolean;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  accessLabel: string;
  onSignOut: () => void;
  isSigningOut: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
}) {
  const sidebarLinkWidth = isCompact
    ? "justify-center px-0 py-3"
    : "px-3.5 py-3";

  return (
    <>
      {isMobileOpen ? (
        <button
          type="button"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-[rgba(20,25,37,0.28)] backdrop-blur-sm lg:hidden"
          aria-label="Закрити навігацію"
        />
      ) : null}

      <aside
        className={`dashboard-sidebar-shell fixed inset-y-0 left-0 z-50 w-[17.25rem] transform transition-transform duration-300 md:w-[var(--cabinet-sidebar-width)] ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="dashboard-sidebar-panel flex h-full flex-col">
          <div
            className={`flex h-[var(--dashboard-header-height)] items-center border-b border-[rgba(24,26,32,0.08)] ${
              isCompact ? "justify-center px-0" : "justify-between px-4"
            }`}
          >
            <Link
              href="/dashboard"
              aria-label="Decivio"
              className={`min-w-0 ${isCompact ? "mx-auto" : ""}`}
            >
              {isCompact ? (
                <BrandBadge size="sidebar" />
              ) : (
                <WordmarkLogo className="text-[2.05rem]" />
              )}
            </Link>

            <div className="flex items-center">
              <button
                type="button"
                onClick={onCloseMobile}
                className="dashboard-icon-button lg:hidden"
                aria-label="Закрити навігацію"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          <div className="dashboard-sidebar-scrollarea flex-1 overflow-y-auto px-3 py-4">
            <nav className="space-y-1.5" aria-label="Навігація кабінету">
              {dashboardNavItems.map((item) => {
                const isActive = item.view === activeView;

                return (
                  <Link
                    key={item.view}
                    href={getDashboardHref(item.view)}
                    onClick={onCloseMobile}
                    title={isCompact ? item.label : undefined}
                    aria-label={item.label}
                    className={`group flex items-center gap-3 rounded-[1.25rem] border transition ${sidebarLinkWidth} ${
                      isActive
                        ? "border-[rgba(63,94,255,0.14)] bg-[rgba(238,242,255,0.95)] text-[var(--accent-strong)] shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]"
                        : "border-transparent bg-transparent text-[var(--text-muted)] hover:border-[rgba(24,26,32,0.08)] hover:bg-[rgba(255,255,255,0.72)] hover:text-[var(--text-strong)]"
                    }`}
                  >
                    <span
                      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.95rem] border transition ${
                        isActive
                          ? "border-[rgba(63,94,255,0.12)] bg-white text-[var(--accent-strong)]"
                          : "border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.78)] text-[var(--text-soft)] group-hover:text-[var(--text-strong)]"
                      }`}
                    >
                      {item.icon}
                    </span>

                    {!isCompact ? (
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">
                          {item.label}
                        </span>
                        <span className="mt-1 block text-[0.82rem] leading-[1.5] text-inherit opacity-80">
                          {item.helper}
                        </span>
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="hidden border-t border-[rgba(24,26,32,0.08)] p-3 lg:block">
            <DashboardSidebarAccount
              displayName={displayName}
              email={email}
              avatarUrl={avatarUrl}
              accessLabel={accessLabel}
              isCompact={isCompact}
              onSignOut={onSignOut}
              isSigningOut={isSigningOut}
            />
          </div>

          {canCompact ? (
            <div className="hidden border-t border-[rgba(24,26,32,0.08)] p-3 lg:block">
              <button
                type="button"
                onClick={onToggleCollapsed}
                className={`group flex w-full items-center gap-3 rounded-[1.35rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.76)] p-3 text-left text-[var(--text-muted)] transition hover:border-[rgba(63,94,255,0.14)] hover:bg-[rgba(255,255,255,0.9)] hover:text-[var(--text-strong)] ${
                  isCompact ? "justify-center" : ""
                }`}
                aria-label={isCompact ? "Розгорнути меню" : "Згорнути меню"}
                title={isCompact ? "Розгорнути меню" : "Згорнути меню"}
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.95rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.86)] text-[var(--text-soft)] transition group-hover:text-[var(--accent-strong)]">
                  {isCompact ? <ExpandIcon /> : <CollapseIcon />}
                </span>

                {!isCompact ? (
                  <span className="min-w-0 text-sm font-semibold text-[var(--text-strong)]">
                    Згорнути
                  </span>
                ) : null}
              </button>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}

function DashboardTopbar({
  displayName,
  email,
  avatarUrl,
  onOpenMobileSidebar,
  onSignOut,
  isSigningOut,
}: {
  displayName: string;
  email: string;
  avatarUrl: string | null;
  onOpenMobileSidebar: () => void;
  onSignOut: () => void;
  isSigningOut: boolean;
}) {
  return (
    <header className="dashboard-topbar sticky top-0 z-30 lg:hidden">
      <div className="flex h-[var(--dashboard-header-height)] items-center gap-3 px-4 md:px-6 xl:px-8">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="dashboard-icon-button lg:hidden"
          aria-label="Відкрити навігацію"
        >
          <MenuIcon />
        </button>

        <Link
          href="/dashboard"
          className="inline-flex items-center lg:hidden"
          aria-label="Decivio"
        >
          <WordmarkLogo className="text-[2rem]" />
        </Link>

        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <div className="group relative">
            <button
              type="button"
              className="account-profile-pill"
              aria-haspopup="menu"
              aria-label="Відкрити меню акаунта"
            >
              <DashboardAvatar
                label={displayName}
                avatarUrl={avatarUrl}
                sizeClassName="h-9 w-9"
                textClassName="text-sm font-semibold"
              />
              <span className="hidden min-w-0 lg:block">
                <span className="block max-w-[10rem] truncate text-sm font-semibold text-[var(--text-strong)]">
                  {getShortProfileLabel(displayName, email)}
                </span>
              </span>
            </button>

            <div className="pointer-events-none absolute right-0 top-full z-40 translate-y-1 pt-2 opacity-0 transition-all duration-150 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
              <div className="account-menu-panel min-w-[14rem] p-2">
                <DashboardAccountMenuContent onSignOut={onSignOut} isSigningOut={isSigningOut} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function DashboardOverview({
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

function DashboardScenarioWorkspace({
  recentSimulations,
}: {
  recentSimulations: DashboardSimulation[];
}) {
  const latest = recentSimulations[0] ?? null;

  if (!latest) {
    return (
      <div className="space-y-6">
        <article className="dashboard-spotlight-card rounded-[2.3rem] p-6 md:p-8">
          <DashboardChip tone="accent">Сценарії</DashboardChip>
          <h1 className="mt-5 max-w-[13ch] text-[2.3rem] font-semibold leading-[0.94] tracking-[-0.055em] text-[var(--text-strong)] md:text-[3.15rem]">
            Тут зʼявиться перший сценарій переходу.
          </h1>
          <p className="mt-5 max-w-3xl text-[1rem] leading-[1.78] text-[var(--text-muted)]">
            У цьому розділі житиме окрема історія сценаріїв. Після першого
            проходження симуляції сюди підтягнеться останній маршрут, а нижче
            збережуться попередні варіанти для порівняння.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/simulate" className="btn-primary">
              Пройти симуляцію
            </Link>
            <Link href="/dashboard" className="btn-secondary">
              Повернутися на головну
            </Link>
          </div>
        </article>
      </div>
    );
  }

  const focusTitle =
    latest.currentRole && latest.targetRole
      ? `${latest.currentRole} -> ${latest.targetRole}`
      : (latest.targetRole ?? latest.currentRole ?? "Кар'єрний сценарій");
  const verdict = verdictLabel(latest.verdictLabel);
  const probability = probabilityLabel(latest.probabilityOfGettingJob);
  const market = mapTargetMarketLabel(latest.targetMarket);
  const priority = mapPriorityLabel(latest.transitionPriority);
  const moneyDelta = formatSignedMoney(latest.ceilingGapMedian);
  const longTermDirectionInsight = buildLongTermDirectionInsight(
    latest.betterLongTermDirection,
    latest,
  );
  const latestUpdatedLabel = formatDateTime(latest.createdAt);
  const scenarioSummary =
    longTermDirectionInsight ??
    (latestUpdatedLabel
      ? `Останній розрахунок збережено ${latestUpdatedLabel}. Тут зручно тримати робочий сценарій і повертатися до нього перед наступними модулями.`
      : "Тут зручно тримати робочий сценарій і повертатися до нього перед наступними модулями.");

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.14fr),23rem]">
        <article className="dashboard-spotlight-card rounded-[2.3rem] p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <DashboardChip tone="success">Останній сценарій</DashboardChip>
            <DashboardChip tone="default">
              {simulationStatusLabel(latest.status)}
            </DashboardChip>
            {priority ? (
              <DashboardChip tone="accent">{priority}</DashboardChip>
            ) : null}
          </div>

          <h1 className="mt-5 max-w-[15ch] text-[2.3rem] font-semibold leading-[0.94] tracking-[-0.055em] text-[var(--text-strong)] md:text-[3.15rem]">
            {focusTitle}
          </h1>
          <p className="mt-5 max-w-3xl text-[1rem] leading-[1.78] text-[var(--text-muted)]">
            {scenarioSummary}
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DashboardMetricCard
              label="Вердикт"
              value={verdict ?? "Базовий висновок"}
              description="Ключове формулювання з останнього сценарію."
            />
            <DashboardMetricCard
              label="Шанс входу"
              value={probability ?? "ще рахується"}
              description="Орієнтир на реалістичність входу в роль."
            />
            <DashboardMetricCard
              label="Ринок"
              value={market ?? "не вказано"}
              description="Контекст для вимог, конкуренції та вакансій."
            />
            <DashboardMetricCard
              label="Стеля доходу"
              value={moneyDelta ?? "—"}
              description="Розрив із поточним шляхом у довшій перспективі."
            />
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/simulate" className="btn-primary">
              Перерахувати сценарій
            </Link>
            <Link href={getDashboardHref("resume")} className="btn-secondary">
              Перейти до розділу резюме
            </Link>
          </div>
        </article>

        <article className="surface-panel rounded-[2rem] p-5 md:p-6">
          <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">
            Що робити далі
          </h2>
          <div className="mt-5 space-y-3">
            {[
              "Зафіксувати цільову роль і перевести її в розділ резюме.",
              "Порівняти ще один альтернативний маршрут, якщо рішення все ще неочевидне.",
              "Після сильного сценарію перейти в модулі підготовки до ринку.",
            ].map((item) => (
              <div key={item} className="surface-soft rounded-[1.2rem] p-4">
                <p className="text-[0.93rem] leading-[1.72] text-[var(--text-muted)]">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-[1.8rem] font-semibold leading-[1.04] tracking-[-0.045em] text-[var(--text-strong)]">
            Історія сценаріїв
          </h2>
          <p className="mt-2 text-[0.95rem] leading-[1.72] text-[var(--text-muted)]">
            Усі попередні розрахунки зберігаються тут у хронології, щоб можна було
            повернутись до них і порівняти маршрути між собою.
          </p>
        </div>

        <div className="grid gap-4">
          {recentSimulations.map((simulation) => {
            const roleLabel =
              simulation.currentRole && simulation.targetRole
                ? `${simulation.currentRole} -> ${simulation.targetRole}`
                : (simulation.targetRole ??
                  simulation.currentRole ??
                  "Кар'єрний сценарій");

            return (
              <article
                key={simulation.id}
                className="surface-panel rounded-[1.8rem] p-5 md:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[1.24rem] font-semibold leading-[1.14] tracking-[-0.035em] text-[var(--text-strong)]">
                      {roleLabel}
                    </h3>
                    <p className="mt-2 text-[0.93rem] leading-[1.7] text-[var(--text-muted)]">
                      {formatDateTime(simulation.createdAt)
                        ? `Збережено ${formatDateTime(simulation.createdAt)}.`
                        : "Збережено в історії кабінету."}
                    </p>
                  </div>
                  <DashboardChip tone="default">
                    {simulationStatusLabel(simulation.status)}
                  </DashboardChip>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {verdictLabel(simulation.verdictLabel) ? (
                    <DashboardChip tone="success">
                      {verdictLabel(simulation.verdictLabel)}
                    </DashboardChip>
                  ) : null}
                  {probabilityLabel(simulation.probabilityOfGettingJob) ? (
                    <DashboardChip tone="accent">
                      {probabilityLabel(simulation.probabilityOfGettingJob)}
                    </DashboardChip>
                  ) : null}
                  {mapTargetMarketLabel(simulation.targetMarket) ? (
                    <DashboardChip tone="default">
                      {mapTargetMarketLabel(simulation.targetMarket)}
                    </DashboardChip>
                  ) : null}
                  {mapPriorityLabel(simulation.transitionPriority) ? (
                    <DashboardChip tone="default">
                      {mapPriorityLabel(simulation.transitionPriority)}
                    </DashboardChip>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function DashboardProfileWorkspace({
  supabase,
  userId,
  email,
  profile,
  onProfileSaved,
}: {
  supabase: SupabaseClient;
  userId: string;
  email: string;
  profile: DashboardUserProfile;
  onProfileSaved: (profile: DashboardUserProfile) => void;
}) {
  const browserTimeZone = useMemo(() => getBrowserTimeZone(), []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [draft, setDraft] = useState<ProfileDraft>(() =>
    buildProfileDraft(profile, browserTimeZone),
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarNotice, setAvatarNotice] = useState<string | null>(null);
  const [isAvatarBusy, setIsAvatarBusy] = useState(false);
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const updateDraft = <K extends keyof ProfileDraft>(
    key: K,
    value: ProfileDraft[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const missingItems = useMemo(
    () =>
      buildMissingProfileItems(
        profile.context,
        profile.fullName,
        profile.avatarUrl,
      ),
    [profile.avatarUrl, profile.context, profile.fullName],
  );

  const profileHeading = getShortProfileLabel(draft.full_name.trim(), email);
  const profileAvatarLabel = draft.full_name.trim() || email;
  const profileCurrentRole = normalizeOptionalInput(draft.current_role);
  const profileTargetRole = normalizeOptionalInput(draft.target_role);
  const workPreference = mapWorkPreferenceLabel(draft.work_preference || null);
  const jobSearchStage = mapJobSearchStageLabel(draft.job_search_stage || null);
  const profileHeroSummary =
    missingItems.length > 0
      ? "Тут видно короткий зріз профілю, а нижче можна дозібрати стабільний контекст без повторного введення в кожному новому сценарії."
      : "Профіль уже зібраний: нижче можна швидко оновити основні дані, пароль і додатковий контекст в одному місці.";

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError(null);
    setSaveNotice(null);

    const currentIncome = parseOptionalNumberInput(
      draft.current_income,
      "Поточний дохід",
    );
    if (currentIncome.error) {
      setSaveError(currentIncome.error);
      return;
    }

    const currentExperienceYears = parseOptionalNumberInput(
      draft.current_experience_years,
      "Стаж у поточній сфері",
      { max: 60 },
    );
    if (currentExperienceYears.error) {
      setSaveError(currentExperienceYears.error);
      return;
    }

    const weeklyLearningHours = parseOptionalNumberInput(
      draft.weekly_learning_hours,
      "Години на підготовку за тиждень",
      { max: 80, integer: true },
    );
    if (weeklyLearningHours.error) {
      setSaveError(weeklyLearningHours.error);
      return;
    }

    const linkedinUrl = normalizeOptionalUrl(draft.linkedin_url, "LinkedIn");
    if (linkedinUrl.error) {
      setSaveError(linkedinUrl.error);
      return;
    }

    const portfolioUrl = normalizeOptionalUrl(draft.portfolio_url, "Портфоліо");
    if (portfolioUrl.error) {
      setSaveError(portfolioUrl.error);
      return;
    }

    const nextContext: ProfileContext = {
      city: normalizeOptionalInput(draft.city),
      current_income: currentIncome.value,
      current_role: normalizeOptionalInput(draft.current_role),
      current_experience_years: currentExperienceYears.value,
      target_role: normalizeOptionalInput(draft.target_role),
      experience_level: draft.experience_level || null,
      english_level: draft.english_level || null,
      target_market: draft.target_market || null,
      transition_priority: draft.transition_priority || null,
      weekly_learning_hours: weeklyLearningHours.value,
      work_preference: draft.work_preference || null,
      job_search_stage: draft.job_search_stage || null,
      linkedin_url: linkedinUrl.value,
      portfolio_url: portfolioUrl.value,
      focus_note: normalizeOptionalInput(draft.focus_note),
    };

    const nextFullName = normalizeOptionalInput(draft.full_name);
    const nextTimezone = normalizeOptionalInput(draft.timezone);

    setIsSaving(true);

    try {
      const baseProfileUpdate = {
        full_name: nextFullName,
        timezone: nextTimezone,
      };

      let usedFallbackSave = false;
      let { error } = await supabase
        .from("profiles")
        .update({
          ...baseProfileUpdate,
          profile_context: nextContext,
        })
        .eq("id", userId);

      if (error && isMissingProfileExtensionSchema(error)) {
        usedFallbackSave = true;
        const fallbackResponse = await supabase
          .from("profiles")
          .update(baseProfileUpdate)
          .eq("id", userId);
        error = fallbackResponse.error;
      }

      if (error) {
        setSaveError(error.message);
        return;
      }

      const nextProfile = {
        fullName: nextFullName,
        timezone: nextTimezone,
        avatarUrl: draft.avatar_url,
        context: nextContext,
        completion: buildProfileCompletion(
          nextFullName,
          draft.avatar_url,
          nextContext,
        ),
      };

      onProfileSaved(nextProfile);
      setSaveNotice(
        usedFallbackSave
          ? "Основні дані профілю оновлено. Для повного збереження додаткового контексту потрібно застосувати останню міграцію бази даних."
          : "Профіль оновлено.",
      );
    } catch (error) {
      setSaveError(getErrorMessage(error) || "Не вдалося зберегти профіль.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAvatarError("Аватар підтримує лише PNG, JPG або WEBP.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Розмір аватара має бути до 2 MB.");
      return;
    }

    setAvatarError(null);
    setAvatarNotice(null);
    setIsAvatarBusy(true);

    try {
      const avatarPath = `${userId}/avatar`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(avatarPath, file, {
          upsert: true,
          cacheControl: "3600",
          contentType: file.type,
        });

      if (uploadError) {
        setAvatarError(
          isMissingAvatarStorageSetup(uploadError)
            ? "Аватари ще не ввімкнені на поточній базі даних. Потрібно застосувати останню міграцію Supabase."
            : uploadError.message,
        );
        return;
      }

      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(avatarPath);
      const nextAvatarUrl = `${data.publicUrl}?v=${Date.now()}`;
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: nextAvatarUrl })
        .eq("id", userId);

      if (profileError) {
        setAvatarError(
          isMissingProfileExtensionSchema(profileError)
            ? "Поле для аватара ще не доступне в поточній базі даних. Потрібно застосувати останню міграцію Supabase."
            : profileError.message,
        );
        return;
      }

      updateDraft("avatar_url", nextAvatarUrl);
      onProfileSaved({
        ...profile,
        avatarUrl: nextAvatarUrl,
        completion: buildProfileCompletion(
          profile.fullName,
          nextAvatarUrl,
          profile.context,
        ),
      });
      setAvatarNotice("Аватар оновлено.");
    } catch (error) {
      setAvatarError(
        error instanceof Error ? error.message : "Не вдалося оновити аватар.",
      );
    } finally {
      setIsAvatarBusy(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarError(null);
    setAvatarNotice(null);
    setIsAvatarBusy(true);

    try {
      await supabase.storage.from("avatars").remove([`${userId}/avatar`]);
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", userId);

      if (error) {
        setAvatarError(
          isMissingProfileExtensionSchema(error)
            ? "Поле для аватара ще не доступне в поточній базі даних. Потрібно застосувати останню міграцію Supabase."
            : error.message,
        );
        return;
      }

      updateDraft("avatar_url", null);
      onProfileSaved({
        ...profile,
        avatarUrl: null,
        completion: buildProfileCompletion(
          profile.fullName,
          null,
          profile.context,
        ),
      });
      setAvatarNotice("Аватар прибрано.");
    } catch (error) {
      setAvatarError(getErrorMessage(error) || "Не вдалося прибрати аватар.");
    } finally {
      setIsAvatarBusy(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordNotice(null);

    const passwordValidationError = validateStrongPassword(nextPassword);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }

    if (nextPassword !== confirmPassword) {
      setPasswordError("Паролі не збігаються.");
      return;
    }

    setIsPasswordSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: nextPassword,
      });

      if (error) {
        setPasswordError(error.message);
        return;
      }

      setNextPassword("");
      setConfirmPassword("");
      setPasswordNotice("Пароль оновлено.");
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : "Не вдалося оновити пароль.",
      );
    } finally {
      setIsPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr),22rem]">
        <article className="dashboard-spotlight-card rounded-[2.3rem] p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <DashboardChip tone="accent">Профіль</DashboardChip>
            <DashboardChip
              tone={profile.completion >= 80 ? "success" : "default"}
            >
              {profile.completion}% заповнення
            </DashboardChip>
          </div>

          <h1 className="mt-5 max-w-[15ch] text-[2.2rem] font-semibold leading-[0.94] tracking-[-0.055em] text-[var(--text-strong)] md:text-[3.05rem]">
            Контекст, який працює на всі модулі
          </h1>
          <p className="mt-5 max-w-3xl text-[1rem] leading-[1.78] text-[var(--text-muted)]">
            {profileHeroSummary}
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DashboardMetricCard
              label="Поточна роль"
              value={profileCurrentRole ?? "ще не вказано"}
              description="Підтягується з онбордингу або редагується вручну."
            />
            <DashboardMetricCard
              label="Цільова роль"
              value={profileTargetRole ?? "ще не вказано"}
              description="Головний орієнтир для модулів і сценаріїв."
            />
            <DashboardMetricCard
              label="Формат роботи"
              value={workPreference ?? "ще не вказано"}
              description="Дає контекст для вакансій і очікувань від ролі."
            />
            <DashboardMetricCard
              label="Стадія пошуку"
              value={jobSearchStage ?? "ще не вказано"}
              description="Допомагає підлаштовувати наступні кроки під ваш ритм."
            />
          </div>
        </article>

        <article className="surface-panel rounded-[2rem] p-5 md:p-6">
          <div className="flex items-start gap-4">
            <DashboardAvatar
              label={profileAvatarLabel}
              avatarUrl={draft.avatar_url}
              sizeClassName="h-20 w-20"
              textClassName="text-xl font-semibold"
            />
            <div className="min-w-0">
              <p className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-soft)]">
                Ваш профіль
              </p>
              <h2 className="mt-2 break-words text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)] [overflow-wrap:anywhere]">
                {profileHeading}
              </h2>
              <p className="mt-2 break-all text-[0.92rem] leading-[1.7] text-[var(--text-muted)]">
                {email}
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarUpload}
          />

          <div className="mt-5 grid gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAvatarBusy}
              className="btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="inline-flex items-center gap-2">
                <UploadIcon />
                {isAvatarBusy ? "Оновлюємо..." : "Оновити аватар"}
              </span>
            </button>
            {draft.avatar_url ? (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={isAvatarBusy}
                className="btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-70"
              >
                Прибрати аватар
              </button>
            ) : null}
          </div>

          {avatarError ? (
            <p className="mt-4 rounded-[1.2rem] border border-[rgba(201,155,134,0.5)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger-strong)]">
              {avatarError}
            </p>
          ) : null}

          {avatarNotice ? (
            <p className="mt-4 rounded-[1.2rem] border border-[rgba(63,94,255,0.16)] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-strong)]">
              {avatarNotice}
            </p>
          ) : null}

          <div className="mt-5 space-y-3">
            {missingItems.length > 0 ? (
              missingItems.map((item) => (
                <div key={item} className="surface-soft rounded-[1.2rem] p-4">
                  <p className="text-[0.92rem] leading-[1.68] text-[var(--text-muted)]">
                    {item}
                  </p>
                </div>
              ))
            ) : (
              <div className="surface-soft rounded-[1.2rem] p-4">
                <p className="text-[0.92rem] leading-[1.68] text-[var(--text-muted)]">
                  Профіль виглядає зібрано. Його контекст уже можна
                  використовувати по всьому кабінету.
                </p>
              </div>
            )}
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr),22rem]">
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <article className="surface-panel rounded-[2rem] p-5 md:p-6">
            <div>
              <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">
                Основне
              </h2>
              <p className="mt-3 text-[0.94rem] leading-[1.72] text-[var(--text-muted)]">
                Базові дані профілю та сигнали, які варто не тягнути з кожного
                нового сценарію окремо.
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Ім&rsquo;я
                <input
                  value={draft.full_name}
                  onChange={(event) =>
                    updateDraft("full_name", event.target.value)
                  }
                  className="field-surface mt-1"
                  placeholder="Як до вас звертатись"
                />
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Email
                <input
                  value={email}
                  readOnly
                  className="field-surface mt-1 opacity-75"
                />
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Часовий пояс
                <input
                  value={draft.timezone}
                  onChange={(event) =>
                    updateDraft("timezone", event.target.value)
                  }
                  className="field-surface mt-1"
                  placeholder="Europe/Kiev"
                />
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Місто / база
                <input
                  value={draft.city}
                  onChange={(event) => updateDraft("city", event.target.value)}
                  className="field-surface mt-1"
                  placeholder="Київ"
                />
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Бажаний формат роботи
                <select
                  value={draft.work_preference}
                  onChange={(event) =>
                    updateDraft(
                      "work_preference",
                      event.target.value as WorkPreference | "",
                    )
                  }
                  className="field-surface mt-1"
                >
                  <option value="">Оберіть формат</option>
                  {workPreferenceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Стадія пошуку
                <select
                  value={draft.job_search_stage}
                  onChange={(event) =>
                    updateDraft(
                      "job_search_stage",
                      event.target.value as JobSearchStage | "",
                    )
                  }
                  className="field-surface mt-1"
                >
                  <option value="">Оберіть стадію</option>
                  {jobSearchStageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </article>

          <article className="surface-panel rounded-[2rem] p-5 md:p-6">
            <div>
              <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">
                Кар&rsquo;єрний контекст
              </h2>
              <p className="mt-3 text-[0.94rem] leading-[1.72] text-[var(--text-muted)]">
                Ці поля підтягуються з останнього онбордингу, але тут їх можна
                тримати як стабільну базу для всіх модулів.
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Поточна роль
                <input
                  value={draft.current_role}
                  onChange={(event) =>
                    updateDraft("current_role", event.target.value)
                  }
                  className="field-surface mt-1"
                  placeholder="Наприклад, Sales Manager"
                />
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Цільова роль
                <input
                  value={draft.target_role}
                  onChange={(event) =>
                    updateDraft("target_role", event.target.value)
                  }
                  className="field-surface mt-1"
                  placeholder="Наприклад, Product Manager"
                />
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Поточний чистий дохід, грн/міс
                <input
                  value={draft.current_income}
                  onChange={(event) =>
                    updateDraft("current_income", event.target.value)
                  }
                  className="field-surface mt-1"
                  inputMode="numeric"
                  placeholder="35000"
                />
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Стаж у поточній сфері
                <input
                  value={draft.current_experience_years}
                  onChange={(event) =>
                    updateDraft("current_experience_years", event.target.value)
                  }
                  className="field-surface mt-1"
                  inputMode="decimal"
                  placeholder="4"
                />
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Релевантний досвід
                <select
                  value={draft.experience_level}
                  onChange={(event) =>
                    updateDraft(
                      "experience_level",
                      event.target.value as ExperienceLevel | "",
                    )
                  }
                  className="field-surface mt-1"
                >
                  <option value="">Оберіть рівень</option>
                  {experienceLevelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Англійська
                <select
                  value={draft.english_level}
                  onChange={(event) =>
                    updateDraft(
                      "english_level",
                      event.target.value as EnglishLevel | "",
                    )
                  }
                  className="field-surface mt-1"
                >
                  <option value="">Оберіть рівень</option>
                  {englishLevelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Ринок
                <select
                  value={draft.target_market}
                  onChange={(event) =>
                    updateDraft(
                      "target_market",
                      event.target.value as TargetMarket | "",
                    )
                  }
                  className="field-surface mt-1"
                >
                  <option value="">Оберіть ринок</option>
                  {targetMarketOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Пріоритет переходу
                <select
                  value={draft.transition_priority}
                  onChange={(event) =>
                    updateDraft(
                      "transition_priority",
                      event.target.value as TransitionPriority | "",
                    )
                  }
                  className="field-surface mt-1"
                >
                  <option value="">Оберіть пріоритет</option>
                  {transitionPriorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </article>

          <article className="surface-panel rounded-[2rem] p-5 md:p-6">
            <div>
              <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">
                Додатковий контекст
              </h2>
              <p className="mt-3 text-[0.94rem] leading-[1.72] text-[var(--text-muted)]">
                Це дані, які допомагають видавати точніші підказки вже після
                реєстрації і не змушують вас щоразу пояснювати контекст заново.
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Години на підготовку за тиждень
                <input
                  value={draft.weekly_learning_hours}
                  onChange={(event) =>
                    updateDraft("weekly_learning_hours", event.target.value)
                  }
                  className="field-surface mt-1"
                  inputMode="numeric"
                  placeholder="6"
                />
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                LinkedIn
                <input
                  value={draft.linkedin_url}
                  onChange={(event) =>
                    updateDraft("linkedin_url", event.target.value)
                  }
                  className="field-surface mt-1"
                  placeholder="https://linkedin.com/in/..."
                />
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)] md:col-span-2">
                Портфоліо / сайт
                <input
                  value={draft.portfolio_url}
                  onChange={(event) =>
                    updateDraft("portfolio_url", event.target.value)
                  }
                  className="field-surface mt-1"
                  placeholder="https://..."
                />
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)] md:col-span-2">
                Фокус на найближчі 90 днів
                <textarea
                  value={draft.focus_note}
                  onChange={(event) =>
                    updateDraft("focus_note", event.target.value)
                  }
                  className="field-surface mt-1 min-h-[8rem] resize-y"
                  placeholder="Наприклад: підготувати резюме, пройти 2 пробні співбесіди і вийти на 10 релевантних відгуків."
                  maxLength={280}
                />
              </label>
            </div>

            {saveError ? (
              <p className="mt-5 rounded-[1.2rem] border border-[rgba(201,155,134,0.5)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger-strong)]">
                {saveError}
              </p>
            ) : null}

            {saveNotice ? (
              <p className="mt-5 rounded-[1.2rem] border border-[rgba(63,94,255,0.16)] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-strong)]">
                {saveNotice}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? "Зберігаємо..." : "Зберегти профіль"}
              </button>
              <Link href="/dashboard" className="btn-secondary">
                На головну
              </Link>
            </div>
          </article>
        </form>

        <div className="space-y-6">
          <article className="surface-panel rounded-[2rem] p-5 md:p-6">
            <div className="flex items-center gap-3">
              <span className="surface-soft inline-flex h-11 w-11 items-center justify-center rounded-[1rem] text-[var(--accent-strong)]">
                <LockIcon />
              </span>
              <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">
                Пароль
              </h2>
            </div>

            <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Новий пароль
                <input
                  type="password"
                  value={nextPassword}
                  onChange={(event) => setNextPassword(event.target.value)}
                  className="field-surface mt-1"
                  autoComplete="new-password"
                />
              </label>
              <p className="text-xs leading-[1.72] text-[var(--text-soft)]">
                {PASSWORD_POLICY_HINT}
              </p>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Повторіть пароль
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="field-surface mt-1"
                  autoComplete="new-password"
                />
              </label>

              {passwordError ? (
                <p className="rounded-[1.2rem] border border-[rgba(201,155,134,0.5)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger-strong)]">
                  {passwordError}
                </p>
              ) : null}

              {passwordNotice ? (
                <p className="rounded-[1.2rem] border border-[rgba(63,94,255,0.16)] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-strong)]">
                  {passwordNotice}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isPasswordSaving}
                className="btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPasswordSaving ? "Оновлюємо..." : "Оновити пароль"}
              </button>
            </form>
          </article>

          <article className="surface-panel rounded-[2rem] p-5 md:p-6">
            <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">
              Де профіль спрацює
            </h2>
            <div className="mt-5 space-y-3">
              {[
                "Сценарії використовують ролі, ринок і пріоритет переходу для нових розрахунків.",
                "Резюме та вакансії підтягують англійську, досвід і формат роботи без повторного введення.",
                "Співбесіди спираються на стадію пошуку й темп підготовки, щоб радити реалістичні наступні кроки.",
                "Пропозиції та нова робота використовують зарплатний контекст і ваші очікування від переходу.",
              ].map((item) => (
                <div key={item} className="surface-soft rounded-[1.2rem] p-4">
                  <p className="text-[0.92rem] leading-[1.68] text-[var(--text-muted)]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

function ModuleWorkspace({
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

function DashboardAccess({
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
  const annualPlan = pricingPlans[1];

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
            майбутня оплата.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <DashboardMetricCard
              label="Акаунт"
              value={email}
              description="Саме за цим профілем закріплений доступ до модулів."
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
            <Link href="/checkout?plan=monthly" className="btn-primary w-full">
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
                  {annualPlan.name}
                </p>
                <DashboardChip tone="success">
                  {formatUah(annualPlan.billedNowUah)}
                </DashboardChip>
              </div>
              <p className="mt-3 text-[0.92rem] leading-[1.68] text-[var(--text-muted)]">
                {annualPlan.billingLabel}. Економія{" "}
                {formatUah(annualPlan.savingsUah)} за рік.
              </p>
            </div>
          </div>
        </article>

        <article className="surface-panel rounded-[1.9rem] p-5 md:p-6">
          <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">
            Що входить у кабінет
          </h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {dashboardModules.map((module) => (
              <div
                key={module.view}
                className="rounded-[1.25rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.72)] p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="surface-soft inline-flex h-10 w-10 items-center justify-center rounded-[0.95rem] text-[var(--accent-strong)]">
                    {module.icon}
                  </span>
                  <p className="text-[0.98rem] font-semibold text-[var(--text-strong)]">
                    {module.title}
                  </p>
                </div>
                <p className="mt-3 text-[0.88rem] leading-[1.62] text-[var(--text-muted)]">
                  {module.description}
                </p>
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
}: {
  requestedView?: string | null;
}) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { openAuthDialog } = useAuthDialog();
  const [state, setState] = useState<DashboardState>({ status: "loading" });
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isPhoneViewport, setIsPhoneViewport] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncViewportMode = () => {
      setIsPhoneViewport(window.innerWidth < 768);
    };

    syncViewportMode();
    window.addEventListener("resize", syncViewportMode);

    return () => {
      window.removeEventListener("resize", syncViewportMode);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedValue = window.localStorage.getItem(
      "decivio_dashboard_sidebar_collapsed",
    );
    if (savedValue === "true" || savedValue === "false") {
      setIsSidebarCollapsed(savedValue === "true");
      return;
    }

    setIsSidebarCollapsed(window.innerWidth < 1440);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      "decivio_dashboard_sidebar_collapsed",
      String(isSidebarCollapsed),
    );
  }, [isSidebarCollapsed]);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [requestedView]);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      if (!isMounted) {
        return;
      }

      setState({ status: "loading" });

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (sessionError) {
        setState({
          status: "error",
          message: "Не вдалося перевірити сесію. Спробуйте оновити сторінку.",
        });
        return;
      }

      if (!session?.user) {
        setState({ status: "guest" });
        return;
      }

      const userId = session.user.id;
      const rawGuestSessionId = readCookie(GUEST_USER_COOKIE_NAME);
      const guestSessionId = isValidGuestSessionId(rawGuestSessionId)
        ? rawGuestSessionId
        : null;

      let simulationsCountQuery = supabase
        .from("simulations")
        .select("id", { count: "exact", head: true });
      let simulationsListQuery = supabase
        .from("simulations")
        .select("id, created_at, status, inputs")
        .order("created_at", { ascending: false })
        .limit(8);

      if (guestSessionId) {
        simulationsCountQuery = simulationsCountQuery.or(
          `user_id.eq.${userId},guest_session_id.eq.${guestSessionId}`,
        );
        simulationsListQuery = simulationsListQuery.or(
          `user_id.eq.${userId},guest_session_id.eq.${guestSessionId}`,
        );
      } else {
        simulationsCountQuery = simulationsCountQuery.eq("user_id", userId);
        simulationsListQuery = simulationsListQuery.eq("user_id", userId);
      }

      const [
        profileResponse,
        subscriptionResponse,
        countResponse,
        simulationsResponse,
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase
          .from("subscriptions")
          .select("status, plan, current_period_end")
          .eq("user_id", userId)
          .maybeSingle(),
        simulationsCountQuery,
        simulationsListQuery,
      ]);

      if (!isMounted) {
        return;
      }

      if (
        profileResponse.error ||
        countResponse.error ||
        simulationsResponse.error ||
        subscriptionResponse.error
      ) {
        setState({
          status: "error",
          message:
            "Не вдалося завантажити дані кабінету. Спробуйте ще раз трохи пізніше.",
        });
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
          resultMap = new Map(
            (results as SimulationResultRow[]).map((item) => [
              item.simulation_id,
              item,
            ]),
          );
        }
      }

      const profile = (profileResponse.data ?? null) as ProfileRow | null;
      const subscriptionRow = (subscriptionResponse.data ??
        null) as SubscriptionRow | null;
      const email =
        session.user.email?.trim() ||
        profile?.email?.trim() ||
        "account@decivio.local";
      const recentSimulations = simulations.map((item) =>
        extractSimulationSnapshot(item, resultMap.get(item.id) ?? null),
      );
      const profileContext = mergeProfileContext(
        parseProfileContext(profile?.profile_context),
        buildProfileContextSeed(recentSimulations[0] ?? null),
      );
      const profileCompletion = buildProfileCompletion(
        profile?.full_name?.trim() ?? null,
        profile?.avatar_url?.trim() ?? null,
        profileContext,
      );
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
        },
        profile: {
          fullName: profile?.full_name?.trim() ?? null,
          timezone: profile?.timezone?.trim() ?? null,
          avatarUrl: profile?.avatar_url?.trim() ?? null,
          context: profileContext,
          completion: profileCompletion,
        },
        subscription: {
          plan: derivedPlan,
          status: derivedStatus,
          currentPeriodEnd: subscriptionRow?.current_period_end ?? null,
        },
        totalSimulations: countResponse.count ?? simulations.length,
        recentSimulations,
      });
    };

    void loadDashboard();

    const {
      data: { subscription },
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

  const handleProfileSaved = (profile: DashboardUserProfile) => {
    emitProfileUpdated({
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
    });

    setState((current) => {
      if (current.status !== "ready") {
        return current;
      }

      return {
        ...current,
        user: {
          ...current.user,
          displayName: formatDisplayName(profile.fullName, current.user.email),
        },
        profile,
      };
    });
  };

  if (state.status === "loading") {
    return <DashboardSkeleton />;
  }

  if (state.status === "guest") {
    return (
      <DashboardGuest
        onLogin={() => openAuthDialog("login", { nextPath: "/dashboard" })}
        onSignup={() => openAuthDialog("signup", { nextPath: "/dashboard" })}
      />
    );
  }

  if (state.status === "error") {
    return <DashboardError message={state.message} />;
  }

  const activeView = getDashboardView(requestedView ?? null);
  const accessLabel = mapAccessLabel(
    state.subscription.plan,
    state.subscription.status,
  );
  const lastSimulation = state.recentSimulations[0] ?? null;
  const moduleView =
    activeView === "resume" ||
    activeView === "interviews" ||
    activeView === "jobs" ||
    activeView === "offers" ||
    activeView === "assistant"
      ? activeView
      : null;
  const canCompactSidebar = !isPhoneViewport;
  const isSidebarCompact = canCompactSidebar && isSidebarCollapsed;
  const shellStyle = {
    "--cabinet-sidebar-width": isSidebarCompact ? "5.75rem" : "17.25rem",
    "--dashboard-header-height": "5.3rem",
  } as CSSProperties;

  return (
    <section
      className="dashboard-shell-screen dashboard-shell"
      style={shellStyle}
    >
      <DashboardSidebar
        activeView={activeView}
        isCompact={isSidebarCompact}
        canCompact={canCompactSidebar}
        isMobileOpen={isMobileSidebarOpen}
        displayName={state.user.displayName}
        email={state.user.email}
        avatarUrl={state.profile.avatarUrl}
        accessLabel={accessLabel}
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
        onToggleCollapsed={() => setIsSidebarCollapsed((current) => !current)}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="lg:pl-[var(--cabinet-sidebar-width)]">
        <DashboardTopbar
          displayName={state.user.displayName}
          email={state.user.email}
          avatarUrl={state.profile.avatarUrl}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onSignOut={handleSignOut}
          isSigningOut={isSigningOut}
        />

        <div className="space-y-6 px-4 py-6 md:px-6 xl:px-8">
          {activeView === "overview" ? (
            <DashboardOverview
              totalSimulations={state.totalSimulations}
              profile={state.profile}
              subscription={state.subscription}
              recentSimulations={state.recentSimulations}
              lastSimulation={lastSimulation}
            />
          ) : null}

          {activeView === "scenario" ? (
            <DashboardScenarioWorkspace
              recentSimulations={state.recentSimulations}
            />
          ) : null}

          {activeView === "profile" ? (
            <DashboardProfileWorkspace
              supabase={supabase}
              userId={state.user.id}
              email={state.user.email}
              profile={state.profile}
              onProfileSaved={handleProfileSaved}
            />
          ) : null}

          {moduleView ? <ModuleWorkspace moduleView={moduleView} /> : null}

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
    </section>
  );
}
