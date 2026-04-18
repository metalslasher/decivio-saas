"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { useAuthDialog } from "@/components/auth-dialog-provider";
import { WordmarkLogo } from "@/components/wordmark-logo";
import { getSupabaseBrowserClient } from "@/lib/db/supabase-browser";
import { GUEST_USER_COOKIE_NAME } from "@/lib/guest-session";
import { formatUah, pricingPlans } from "@/lib/pricing";

type DashboardView = "overview" | "scenario" | "resume" | "interviews" | "jobs" | "offers" | "assistant" | "access";

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

type DashboardNavItem = {
  view: DashboardView;
  label: string;
  helper: string;
  icon: ReactNode;
};

type DashboardModule = {
  view: Exclude<DashboardView, "overview" | "scenario" | "access">;
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

const dateFormatter = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit"
});

const shortDateFormatter = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "short"
});

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
      <path d="M9 7.5h3.8A3.2 3.2 0 0 1 16 10.7v2.8" />
      <path d="M15 16.5h-3.7A3.3 3.3 0 0 1 8 13.2v-2.7" />
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

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h3l2-4 3 8 2.5-5H20" />
      <path d="M5 19.5h14" />
      <path d="M5 4.5h14" opacity="0.36" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none" aria-hidden="true">
      <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none" aria-hidden="true">
      <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none" aria-hidden="true">
      <path d="M9 6L4 12l5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 5v14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none" aria-hidden="true">
      <path d="M15 6l5 6-5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 5v14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BrandBadge() {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-[1rem] bg-[linear-gradient(180deg,#5b72ff_0%,#4563ff_100%)] text-[1.05rem] font-extrabold text-white shadow-[0_16px_28px_-18px_rgba(67,97,255,0.42)]">
      D
    </span>
  );
}

const dashboardNavItems: DashboardNavItem[] = [
  { view: "overview", label: "Головна", helper: "Останній сценарій, модулі й пріоритети.", icon: <HomeIcon /> },
  { view: "scenario", label: "Сценарії", helper: "Останній розрахунок і історія переходів.", icon: <RouteIcon /> },
  { view: "resume", label: "CV Builder", helper: "Резюме під цільову роль і вакансію.", icon: <ResumeIcon /> },
  { view: "interviews", label: "Співбесіди", helper: "Питання, mock interview і фідбек.", icon: <InterviewIcon /> },
  { view: "jobs", label: "Нова робота", helper: "Day One, адаптація й очікування від ролі.", icon: <BriefcaseIcon /> },
  { view: "offers", label: "Офери", helper: "Порівняння пропозицій і рішень.", icon: <OfferIcon /> },
  { view: "assistant", label: "AI Assistant", helper: "Контекстний помічник по всьому маршруту.", icon: <SparkIcon /> },
  { view: "access", label: "Доступ", helper: "Тариф, billing і керування акаунтом.", icon: <CreditCardIcon /> }
];

const dashboardModules: DashboardModule[] = [
  {
    view: "resume",
    title: "CV Builder",
    description: "Окремий робочий простір для адаптації резюме під роль, seniority і конкретну вакансію.",
    helper: "Після сильного сценарію це перший логічний крок до ринку.",
    searchTerms: ["cv", "резюме", "ats", "вакансія"],
    icon: <ResumeIcon />
  },
  {
    view: "interviews",
    title: "Підготовка до співбесід",
    description: "Місце для питань, mock interview і підсвітки слабких відповідей під цільову роль.",
    helper: "Працює після сценарію і CV, коли вже зрозуміло, куди ви йдете.",
    searchTerms: ["співбесіди", "interview", "mock", "питання"],
    icon: <InterviewIcon />
  },
  {
    view: "jobs",
    title: "Нова робота / Day One",
    description: "Окремий модуль про старт у ролі, адаптацію, очікування від команди й перші тижні.",
    helper: "Допомагає перейти від оферу до реальної роботи без хаосу.",
    searchTerms: ["day one", "нова робота", "адаптація", "онбординг"],
    icon: <BriefcaseIcon />
  },
  {
    view: "offers",
    title: "Порівняння оферів",
    description: "Матриця рішень по зарплаті, ризику, траєкторії й аргументах для переговорів.",
    helper: "Фінальний decision board, коли пропозиція вже на столі.",
    searchTerms: ["офер", "offer", "переговори", "зарплата"],
    icon: <OfferIcon />
  },
  {
    view: "assistant",
    title: "Career AI Assistant",
    description: "Контекстний AI-шар поверх сценаріїв, CV, вакансій і співбесід із короткими наступними діями.",
    helper: "Допомагає швидше переходити між модулями й не губити контекст.",
    searchTerms: ["assistant", "ai", "поради", "помічник"],
    icon: <SparkIcon />
  }
];

const moduleWorkspaceConfigs: Record<DashboardModule["view"], ModuleWorkspaceConfig> = {
  resume: {
    eyebrow: "CV Builder",
    title: "Робочий простір для резюме під цільову роль",
    description: "Цей модуль уже виділено в окремий workspace: тут логічно збирати CV під роль, вакансію й seniority без змішування з іншими задачами кабінету.",
    summary: [
      { label: "Вхід", value: "Сценарій, досвід, вакансія" },
      { label: "Фокус", value: "Досягнення, цифри, relevance" },
      { label: "Вихід", value: "Чернетка CV + версії під ролі" }
    ],
    columns: [
      {
        title: "Що тут має жити",
        description: "Окремі зони під базову версію CV, адаптацію під вакансію й бібліотеку варіантів.",
        items: ["Блок досягнень із цифрами", "Структура під ATS і читабельність", "Швидкий перехід до перевірки вакансії"]
      },
      {
        title: "Перший реліз",
        description: "У цей екран природно підключати форму, редактор секцій і оцінку якості резюме.",
        items: ["Збір цільової ролі", "Підсвітка слабких формулювань", "Фінальний експорт у PDF"]
      },
      {
        title: "Місце в маршруті",
        description: "Модуль іде слідом за сильним сценарієм і веде в підготовку до співбесід.",
        items: ["Після сценарію переходу", "Перед відгуками", "Поруч із вакансіями та інтерв'ю"]
      }
    ]
  },
  interviews: {
    eyebrow: "Співбесіди",
    title: "Окремий workspace для підготовки до співбесід",
    description: "Тут буде окремий інтерфейс для recruiter screen, manager interview і практичних питань без змішування з аналітикою переходу.",
    summary: [
      { label: "Вхід", value: "Роль, рівень, вакансія" },
      { label: "Фокус", value: "Слабкі місця й аргументація" },
      { label: "Вихід", value: "Пакет питань + mock flow" }
    ],
    columns: [
      {
        title: "Що тут має жити",
        description: "Потоки під recruiter call, hiring manager і кейсову частину.",
        items: ["Добірка питань за роллю", "Сильні й слабкі відповіді", "Mock режим із фідбеком"]
      },
      {
        title: "Перший реліз",
        description: "Сюди можна підключати генерацію запитань, оцінку відповідей і пріоритети тренування.",
        items: ["Розділення по етапах інтерв'ю", "Коментарі до відповідей", "План тренування по слабких місцях"]
      },
      {
        title: "Місце в маршруті",
        description: "Модуль працює після CV Builder, коли користувач уже рухається до ринку.",
        items: ["Після підготовки CV", "Перед активними відгуками", "Перед фінальними інтерв'ю"]
      }
    ]
  },
  jobs: {
    eyebrow: "Нова робота",
    title: "Day One workspace для реалістичного старту в ролі",
    description: "Окремий модуль про темп роботи, адаптацію, очікування від нової ролі й перші тижні після оферу.",
    summary: [
      { label: "Вхід", value: "Роль, команда, контекст" },
      { label: "Фокус", value: "Ризики старту й адаптація" },
      { label: "Вихід", value: "План входу в роль" }
    ],
    columns: [
      {
        title: "Що тут має жити",
        description: "Картина реального робочого дня, ролі менеджера й стартових очікувань.",
        items: ["Розподіл дня по типах задач", "Що від вас чекатимуть у перший місяць", "Де найчастіше просідають новачки"]
      },
      {
        title: "Перший реліз",
        description: "У модуль природно лягають чеклісти адаптації та план перших 30 днів.",
        items: ["Шаблон 30 днів", "Теми для синків із менеджером", "Перелік стартових ризиків"]
      },
      {
        title: "Місце в маршруті",
        description: "Це продовження сценаріїв та оферів, а не окрема історія сама по собі.",
        items: ["Після прийняття оферу", "Перед стартом у ролі", "Для зниження стресу на вході"]
      }
    ]
  },
  offers: {
    eyebrow: "Офери",
    title: "Decision board для порівняння оферів",
    description: "Окремий екран під матрицю доходу, ризику, умов і компромісів. Це логічна фінальна зона прийняття рішення після сценаріїв і співбесід.",
    summary: [
      { label: "Вхід", value: "Поточна роль + 1-2 офери" },
      { label: "Фокус", value: "Ризик, гроші, timing" },
      { label: "Вихід", value: "Рекомендація по рішенню" }
    ],
    columns: [
      {
        title: "Що тут має жити",
        description: "Не лише зарплата, а повне порівняння траєкторій, ризику і простору для переговорів.",
        items: ["Матриця оферів поруч", "Ризик-період на старті", "Аргументи для прийняття або торгу"]
      },
      {
        title: "Перший реліз",
        description: "Сюди логічно підключати параметри оферу, запас міцності та decision summary.",
        items: ["Форма умов оферу", "Сильні й слабкі сторони", "Висновок по fit і timing"]
      },
      {
        title: "Місце в маршруті",
        description: "Це останній великий крок перед Day One, коли рішення вже потрібно приймати.",
        items: ["Коли є конкретна пропозиція", "Для порівняння двох маршрутів", "Для переговорів про умови"]
      }
    ]
  },
  assistant: {
    eyebrow: "AI Assistant",
    title: "Контекстний AI-помічник поверх усього кабінету",
    description: "Окремий розділ під AI, який розуміє ваш сценарій, модулі, доступ і може підказувати наступний крок без шуму.",
    summary: [
      { label: "Вхід", value: "Контекст користувача і модулів" },
      { label: "Фокус", value: "Короткі наступні дії" },
      { label: "Вихід", value: "Підказки в контексті маршруту" }
    ],
    columns: [
      {
        title: "Що тут має жити",
        description: "Чат, швидкі команди й короткі сценарії дій усередині кабінету.",
        items: ["Промпти для CV і вакансій", "AI по сценаріях та оферах", "Пояснення складних рішень простою мовою"]
      },
      {
        title: "Перший реліз",
        description: "Сюди добре лягає чат, пам'ять по користувачу й переходи до потрібних модулів.",
        items: ["Готові запити з dashboard", "Поради на основі останнього сценарію", "Контекстні переходи в модулі"]
      },
      {
        title: "Місце в маршруті",
        description: "AI не дублює модулі, а пришвидшує рух між ними й економить увагу.",
        items: ["Працює поверх усієї навігації", "Підказує, з чого почати", "Не дає загубитися в наступних кроках"]
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

function getShortProfileLabel(email: string) {
  return email.split("@")[0]?.trim() ?? email;
}

function getInitials(email: string) {
  const localPart = email.split("@")[0]?.trim() ?? "";
  const normalized = localPart.replace(/[^a-zA-Zа-яА-ЯіїєІЇЄґҐ0-9]+/g, " ").trim();
  const parts = normalized.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return (parts[0] ?? localPart.slice(0, 2) ?? "DC").slice(0, 2).toUpperCase();
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
  return Number.isNaN(parsed.getTime()) ? null : shortDateFormatter.format(parsed);
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

function readCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function isValidGuestSessionId(value: string | null) {
  return typeof value === "string" && uuidPattern.test(value);
}

function buildProgressSteps(totalSimulations: number, subscription: DashboardAccessState) {
  return [
    {
      label: "Заповнити стартовий сценарій переходу",
      progress: totalSimulations > 0 ? 100 : 12
    },
    {
      label: "Порівняти 2-3 маршрути переходу",
      progress: totalSimulations >= 3 ? 100 : totalSimulations === 2 ? 76 : totalSimulations === 1 ? 42 : 0
    },
    {
      label: "Зібрати CV під цільову роль",
      progress: subscription.plan === "pro" ? (totalSimulations > 0 ? 38 : 10) : 0
    },
    {
      label: "Пройти mock interview",
      progress: subscription.plan === "pro" ? (totalSimulations > 0 ? 18 : 0) : 0
    },
    {
      label: "Оцінити offer-fit",
      progress: 0
    }
  ];
}

function buildProfileReadiness(totalSimulations: number, subscription: DashboardAccessState, lastSimulation: DashboardSimulation | null) {
  let readiness = 22;

  if (totalSimulations > 0) {
    readiness += 26;
  }

  if (subscription.plan === "pro") {
    readiness += 18;
  }

  if (lastSimulation?.probabilityOfGettingJob !== null) {
    readiness += 12;
  }

  if (totalSimulations > 2) {
    readiness += 9;
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
      "Почніть зі стартового сценарію, щоб dashboard перестав бути загальним і підлаштувався під ваш маршрут.",
      subscription.plan === "pro"
        ? "У вас уже відкритий повний стек. Після першого сценарію можна одразу йти в CV Builder та підготовку до співбесід."
        : "Поки достатньо зібрати один сильний сценарій. Платні модулі логічно підключати вже після цього.",
      "Навігація в кабінеті побудована по маршруту: сценарії -> CV -> співбесіди -> офери -> Day One."
    ];
  }

  return [
    verdict ? `${verdict}. Тримайте цей маршрут як базовий фокус кабінету.` : "Останній сценарій уже задає контекст для наступних модулів.",
    probability
      ? `${probability}. Це хороший орієнтир, щоб вирішити, чи переходити до CV і interview prep вже зараз.`
      : "Після сценарію логічно перейти до CV і перевірки, як ви виглядаєте під реальні вакансії.",
    targetMarket ? `Орієнтир зараз: ${targetMarket}. Це впливатиме і на вакансії, і на мову CV, і на вимоги ринку.` : totalSimulations > 1 ? "Спробуйте ще один альтернативний маршрут, щоб бачити не одну точку, а поле рішень." : "Після першого розрахунку варто додати альтернативний сценарій для порівняння."
  ];
}

function buildActivityItems(recentSimulations: DashboardSimulation[], subscription: DashboardAccessState) {
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
      title: "Кабінет готовий до стартового сценарію",
      description: "Після першого розрахунку тут підтягнуться фокус, історія та рекомендації."
    },
    {
      title: subscription.plan === "pro" ? "Pro доступ уже активний" : "Базовий доступ активний",
      description: subscription.plan === "pro" ? "Усі модулі прив'язані до цього акаунта." : "Після апгрейду тут з'явиться billing і межі плану."
    }
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

function DashboardChip({ tone = "default", children }: { tone?: ChipTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] ${chipClasses(tone)}`}>
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
          <div className="dashboard-topbar h-[5.3rem]" />
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

function DashboardGuest({ onLogin, onSignup }: { onLogin: () => void; onSignup: () => void }) {
  return (
    <section className="dashboard-shell-screen dashboard-shell">
      <div className="mx-auto w-full px-4 py-6 md:px-6 xl:px-8">
        <div className="flex items-center gap-3 py-2">
          <BrandBadge />
          <Link href="/" className="inline-flex items-center" aria-label="Decivio">
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
              Після авторизації тут зʼявиться робочий простір зі сценаріями, історією переходів, модульною навігацією, доступом до тарифу
              та окремими екранами під CV, співбесіди, офери й AI-помічника.
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
              ["Ліва shell", "Sidebar живе окремо від контенту й лишається під рукою."],
              ["Модулі", "Кожен інструмент має свій workspace, а не змішується в один екран."],
              ["Останній сценарій", "У фокусі завжди останній розрахунок або онбординг, якщо його ще не було."],
              ["Доступ", "Тариф, billing і керування акаунтом винесені в окремий сервісний розділ."]
            ].map(([title, description]) => (
              <article key={title} className="surface-panel rounded-[1.7rem] p-5">
                <h2 className="text-[1.1rem] font-semibold tracking-[-0.03em] text-[var(--text-strong)]">{title}</h2>
                <p className="mt-3 text-[0.94rem] leading-[1.7] text-[var(--text-muted)]">{description}</p>
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
          <p className="mt-5 max-w-2xl text-[1rem] leading-[1.78] text-[var(--text-muted)]">{message}</p>
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

function DashboardMetricCard({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <article className="surface-soft rounded-[1.45rem] p-4 md:p-5">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">{label}</p>
      <p className="mt-3 text-[1.18rem] font-semibold leading-[1.15] tracking-[-0.03em] text-[var(--text-strong)]">{value}</p>
      <p className="mt-2 text-[0.9rem] leading-[1.68] text-[var(--text-muted)]">{description}</p>
    </article>
  );
}

function DashboardProgressRow({ label, progress }: { label: string; progress: number }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.95rem] leading-[1.55] text-[var(--text-strong)]">{label}</p>
        <span className="text-sm font-semibold text-[var(--text-muted)]">{progress}%</span>
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
}

function DashboardModuleCard({ module }: { module: DashboardModule }) {
  return (
    <article className="surface-panel group rounded-[1.85rem] p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_28px_58px_-40px_rgba(22,29,43,0.18)] md:p-6">
      <span className="surface-soft inline-flex h-12 w-12 items-center justify-center rounded-[1rem] text-[var(--accent-strong)]">
        {module.icon}
      </span>

      <h3 className="mt-5 text-[1.28rem] font-semibold leading-[1.1] tracking-[-0.04em] text-[var(--text-strong)]">{module.title}</h3>
      <p className="mt-3 text-[0.95rem] leading-[1.72] text-[var(--text-muted)]">{module.description}</p>
      <p className="mt-2 text-[0.88rem] leading-[1.65] text-[var(--text-soft)]">{module.helper}</p>

      <Link href={getDashboardHref(module.view)} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-strong)] transition hover:text-[var(--accent)]">
        Відкрити
        <span aria-hidden="true">›</span>
      </Link>
    </article>
  );
}

function DashboardSidebar({
  activeView,
  isCollapsed,
  isMobileOpen,
  onToggleCollapsed,
  onCloseMobile,
  totalSimulations,
  accessLabel,
  subscription
}: {
  activeView: DashboardView;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
  totalSimulations: number;
  accessLabel: string;
  subscription: DashboardAccessState;
}) {
  const planLabel = subscription.plan === "pro" ? "Pro активний" : "Pro доступ";
  const accessHref = subscription.plan === "pro" ? getDashboardHref("access") : "/pricing";
  const sidebarLinkWidth = isCollapsed ? "justify-center px-0 py-3" : "px-3.5 py-3";

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
        className={`dashboard-sidebar-shell fixed inset-y-0 left-0 z-50 w-[17.25rem] transform transition-transform duration-300 lg:w-[var(--cabinet-sidebar-width)] ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="dashboard-sidebar-panel flex h-full flex-col">
          <div className="flex h-[5.3rem] items-center justify-between border-b border-[rgba(24,26,32,0.08)] px-4">
            <Link href="/dashboard" aria-label="Decivio" className="min-w-0">
              {isCollapsed ? <BrandBadge /> : <WordmarkLogo className="text-[2.05rem]" />}
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleCollapsed}
                className="dashboard-icon-button hidden lg:inline-flex"
                aria-label={isCollapsed ? "Розгорнути навігацію" : "Згорнути навігацію"}
              >
                {isCollapsed ? <ExpandIcon /> : <CollapseIcon />}
              </button>
              <button type="button" onClick={onCloseMobile} className="dashboard-icon-button lg:hidden" aria-label="Закрити навігацію">
                <CloseIcon />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <div className={`mb-4 rounded-[1.4rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.74)] p-3 ${isCollapsed ? "text-center" : ""}`}>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-soft)]">{isCollapsed ? "Стан" : "Швидкий стан"}</p>
              <div className={`mt-3 ${isCollapsed ? "space-y-2" : "grid gap-3"}`}>
                <div>
                  <p className="text-[1.05rem] font-semibold tracking-[-0.03em] text-[var(--text-strong)]">{totalSimulations}</p>
                  {!isCollapsed ? <p className="text-sm text-[var(--text-muted)]">сценаріїв у кабінеті</p> : null}
                </div>
                <div>
                  <DashboardChip tone={accessTone(subscription.plan, subscription.status)}>{isCollapsed ? subscription.plan.toUpperCase() : accessLabel}</DashboardChip>
                </div>
              </div>
            </div>

            <nav className="space-y-1.5" aria-label="Навігація кабінету">
              {dashboardNavItems.map((item) => {
                const isActive = item.view === activeView;

                return (
                  <Link
                    key={item.view}
                    href={getDashboardHref(item.view)}
                    onClick={onCloseMobile}
                    title={isCollapsed ? item.label : undefined}
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

                    {!isCollapsed ? (
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{item.label}</span>
                        <span className="mt-1 block text-[0.82rem] leading-[1.5] text-inherit opacity-80">{item.helper}</span>
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-[rgba(24,26,32,0.08)] p-3">
            <div className={`rounded-[1.45rem] bg-[linear-gradient(180deg,rgba(63,94,255,0.1),rgba(238,242,255,0.86))] p-4 ${isCollapsed ? "text-center" : ""}`}>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">{planLabel}</p>
              {!isCollapsed ? (
                <>
                  <p className="mt-3 text-[0.95rem] leading-[1.68] text-[var(--text-muted)]">
                    {subscription.plan === "pro"
                      ? "Billing, межі плану й керування доступом винесені в окремий сервісний розділ."
                      : "Коли буде потрібен повний стек модулів, апгрейд уже вбудований у цю shell-навігацію."}
                  </p>
                  <Link href={accessHref} className="btn-primary mt-5 w-full">
                    {subscription.plan === "pro" ? "Керувати доступом" : "Відкрити Pro"}
                  </Link>
                </>
              ) : (
                <Link href={accessHref} className="btn-primary mt-4 !px-0 w-full">
                  {subscription.plan === "pro" ? "→" : "+"}
                </Link>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function DashboardTopbar({
  email,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onOpenMobileSidebar,
  suggestedActionHref,
  suggestedActionLabel,
  onSignOut,
  isSigningOut
}: {
  email: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onOpenMobileSidebar: () => void;
  suggestedActionHref: string;
  suggestedActionLabel: string;
  onSignOut: () => void;
  isSigningOut: boolean;
}) {
  return (
    <header className="dashboard-topbar sticky top-0 z-30">
      <div className="flex items-center gap-3 px-4 py-4 md:px-6 xl:px-8">
        <button type="button" onClick={onOpenMobileSidebar} className="dashboard-icon-button lg:hidden" aria-label="Відкрити навігацію">
          <MenuIcon />
        </button>

        <Link href="/dashboard" className="inline-flex items-center lg:hidden" aria-label="Decivio">
          <WordmarkLogo className="text-[2rem]" />
        </Link>

        <form onSubmit={onSearchSubmit} className="hidden min-w-0 flex-1 md:flex">
          <label className="dashboard-search flex w-full items-center gap-3">
            <span className="text-[var(--text-soft)]">
              <SearchIcon />
            </span>
            <input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Пошук модулів, сценаріїв і дій"
              className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-strong)] outline-none placeholder:text-[var(--text-soft)]"
            />
          </label>
        </form>

        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <Link href={suggestedActionHref} className="btn-primary hidden lg:inline-flex">
            {suggestedActionLabel}
          </Link>

          <Link href={getDashboardHref("scenario")} className="dashboard-icon-button hidden sm:inline-flex" aria-label="Відкрити історію сценаріїв">
            <ActivityIcon />
          </Link>

          <div className="group relative">
            <button type="button" className="account-profile-pill" aria-haspopup="menu" aria-label="Відкрити меню акаунта">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(238,242,255,0.92)] text-sm font-semibold text-[var(--accent-strong)]">
                {getInitials(email)}
              </span>
              <span className="hidden min-w-0 lg:block">
                <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-soft)]">Профіль</span>
                <span className="block max-w-[10rem] truncate text-sm font-semibold text-[var(--text-strong)]">{getShortProfileLabel(email)}</span>
              </span>
            </button>

            <div className="pointer-events-none absolute right-0 top-full z-40 translate-y-1 pt-2 opacity-0 transition-all duration-150 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
              <div className="account-menu-panel min-w-[14rem] p-2">
                <Link href="/dashboard" className="account-menu-link">
                  <span className="account-menu-icon">
                    <HomeIcon />
                  </span>
                  <span>Кабінет</span>
                </Link>
                <Link href={getDashboardHref("access")} className="account-menu-link">
                  <span className="account-menu-icon">
                    <CreditCardIcon />
                  </span>
                  <span>Оплата</span>
                </Link>
                <div className="account-menu-divider" />
                <button type="button" onClick={onSignOut} disabled={isSigningOut} className="account-menu-link account-menu-link-danger disabled:cursor-not-allowed disabled:opacity-60">
                  <svg viewBox="0 0 24 24" className="account-menu-icon" fill="none" aria-hidden="true">
                    <path d="M14 7l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8 12h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M10 5H6.8A1.8 1.8 0 0 0 5 6.8v10.4A1.8 1.8 0 0 0 6.8 19H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  {isSigningOut ? "Виходимо..." : "Вийти"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={onSearchSubmit} className="px-4 pb-4 md:hidden">
        <label className="dashboard-search flex w-full items-center gap-3">
          <span className="text-[var(--text-soft)]">
            <SearchIcon />
          </span>
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Пошук модулів, сценаріїв і дій"
            className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-strong)] outline-none placeholder:text-[var(--text-soft)]"
          />
        </label>
      </form>
    </header>
  );
}

function DashboardOverview({
  userDisplayName,
  totalSimulations,
  subscription,
  recentSimulations,
  lastSimulation,
  searchQuery
}: {
  userDisplayName: string;
  totalSimulations: number;
  subscription: DashboardAccessState;
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

  const targetMarket = mapTargetMarketLabel(lastSimulation?.targetMarket ?? null);
  const priority = mapPriorityLabel(lastSimulation?.transitionPriority ?? null);
  const lastVerdict = verdictLabel(lastSimulation?.verdictLabel ?? null);
  const probability = probabilityLabel(lastSimulation?.probabilityOfGettingJob ?? null);
  const moneyDelta = formatSignedMoney(lastSimulation?.ceilingGapMedian ?? null);
  const focusTitle =
    lastSimulation?.currentRole && lastSimulation.targetRole
      ? `${lastSimulation.currentRole} -> ${lastSimulation.targetRole}`
      : lastSimulation?.targetRole
        ? `Фокус на переході в ${lastSimulation.targetRole}`
        : "Почнімо зі стартового сценарію переходу";

  const comparisonCards = [
    {
      title: lastSimulation?.currentRole ? `Залишитись у ${lastSimulation.currentRole}` : "Залишитись у поточній ролі",
      description: "Базова лінія, від якої ми відштовхуємось у порівнянні.",
      note: "Найнижча невизначеність"
    },
    {
      title: lastSimulation?.targetRole ? `Перейти в ${lastSimulation.targetRole}` : "Перейти в новий напрям",
      description: lastVerdict ?? "Основний сценарій переходу, який зараз варто тримати у фокусі.",
      note: probability ?? "Ключовий сценарій"
    },
    {
      title: "Проміжний маршрут",
      description: targetMarket ? `Орієнтир на ${targetMarket}.` : "М'якший сценарій із меншим стресом на старті.",
      note: priority ?? "Можна порівняти окремо"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.14fr),23rem]">
        <article className="dashboard-spotlight-card rounded-[2.3rem] p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <DashboardChip tone={lastSimulation ? "success" : "accent"}>{lastSimulation ? "Останній сценарій" : "Стартовий онбординг"}</DashboardChip>
            {targetMarket ? <DashboardChip tone="default">{targetMarket}</DashboardChip> : null}
            {priority ? <DashboardChip tone="accent">{priority}</DashboardChip> : null}
          </div>

          <h1 className="mt-5 max-w-[14ch] text-[2.35rem] font-semibold leading-[0.92] tracking-[-0.055em] text-[var(--text-strong)] md:text-[3.25rem]">
            {focusTitle}
          </h1>
          <p className="mt-5 max-w-3xl text-[1rem] leading-[1.78] text-[var(--text-muted)]">
            {lastSimulation
              ? `${firstName}, головний екран кабінету збирає в одному місці останній сценарій, історію переходів, доступ до модулів і зрозумілі наступні кроки.`
              : `${firstName}, поки ви ще не проходили сценарний онбординг. Після першого розрахунку в топі з'явиться останній сценарій, а історія поїде в окремий розділ.`}
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DashboardMetricCard
              label={moneyDelta ? "Потенціал стелі" : "Сценарії"}
              value={moneyDelta ?? `${totalSimulations}`}
              description={moneyDelta ? "Орієнтовний розрив із поточною стелею доходу." : "Збережено в кабінеті й доступно в історії."}
            />
            <DashboardMetricCard
              label="Наступний крок"
              value={lastSimulation ? "Перевести сценарій у підготовку" : "Пройти стартовий онбординг"}
              description={lastSimulation ? "Після сценарію логічно йти в CV Builder або інтерв'ю." : "Онбординг зараз починається через симуляцію."}
            />
            <DashboardMetricCard
              label="Орієнтир"
              value={probability ?? "Роль ще не визначена"}
              description={lastVerdict ?? "Після першого розрахунку тут з'явиться персональний висновок."}
            />
            <DashboardMetricCard
              label="Готовність профілю"
              value={`${readiness}%`}
              description="Зростає разом зі сценаріями, модулями та опрацюванням ринку."
            />
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={lastSimulation ? getDashboardHref("scenario") : "/simulate"} className="btn-primary">
              {lastSimulation ? "Відкрити сценарії" : "Почати онбординг"}
            </Link>
            <Link href="/simulate" className="btn-secondary">
              Нова симуляція
            </Link>
          </div>
        </article>

        <div className="space-y-6">
          <article className="surface-panel rounded-[2rem] p-5 md:p-6">
            <div className="flex items-center gap-3">
              <span className="surface-soft inline-flex h-11 w-11 items-center justify-center rounded-[1rem] text-[var(--accent-strong)]">
                <SparkIcon />
              </span>
              <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">AI поради на зараз</h2>
            </div>

            <div className="mt-5 space-y-3">
              {insights.map((insight) => (
                <div key={insight} className="surface-soft rounded-[1.25rem] p-4">
                  <p className="text-[0.94rem] leading-[1.72] text-[var(--text-muted)]">{insight}</p>
                </div>
              ))}
            </div>
          </article>

          <article id="activity" className="surface-panel rounded-[2rem] p-5 md:p-6">
            <div className="flex items-center gap-3">
              <span className="surface-soft inline-flex h-11 w-11 items-center justify-center rounded-[1rem] text-[var(--accent-strong)]">
                <ActivityIcon />
              </span>
              <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">Остання активність</h2>
            </div>

            <div className="mt-5 space-y-3">
              {activityItems.map((item) => (
                <div key={`${item.title}-${item.description}`} className="rounded-[1.2rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.74)] p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-1.5 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--accent)]/75" />
                    <div>
                      <p className="text-[0.94rem] leading-[1.62] text-[var(--text-strong)]">{item.title}</p>
                      <p className="mt-1 text-[0.82rem] text-[var(--text-soft)]">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),minmax(0,1fr),22rem]">
        <article className="surface-panel rounded-[2rem] p-5 md:p-6">
          <h2 className="text-[1.5rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">План прогресу</h2>
          <p className="mt-3 text-[0.95rem] leading-[1.72] text-[var(--text-muted)]">
            Це зона, яка тримає людину не в хаосі модулів, а в послідовному маршруті переходу.
          </p>

          <div className="mt-6 space-y-5">
            {progressSteps.map((step) => (
              <DashboardProgressRow key={step.label} label={step.label} progress={step.progress} />
            ))}
          </div>
        </article>

        <article className="surface-panel rounded-[2rem] p-5 md:p-6">
          <h2 className="text-[1.5rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">Порівняння сценаріїв</h2>
          <p className="mt-3 text-[0.95rem] leading-[1.72] text-[var(--text-muted)]">
            Не один напрям, а поле для рішення. Тут краще тримати короткі сценарні блоки без перевантаження текстом.
          </p>

          <div className="mt-6 space-y-4">
            {comparisonCards.map((card, index) => (
              <div
                key={card.title}
                className={`rounded-[1.4rem] border p-4 ${
                  index === 1
                    ? "border-[rgba(52,211,153,0.26)] bg-[rgba(236,253,245,0.78)]"
                    : "border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.74)]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-[1.08rem] font-semibold leading-[1.2] tracking-[-0.03em] text-[var(--text-strong)]">{card.title}</h3>
                    <p className="mt-2 text-[0.92rem] leading-[1.68] text-[var(--text-muted)]">{card.description}</p>
                  </div>
                  <span className="max-w-[9rem] text-right text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">
                    {card.note}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-panel rounded-[2rem] p-5 md:p-6">
          <div className="flex items-center gap-3">
            <span className="surface-soft inline-flex h-11 w-11 items-center justify-center rounded-[1rem] text-[var(--accent-strong)]">
              <CreditCardIcon />
            </span>
            <div>
              <p className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-soft)]">Тариф і доступ</p>
              <h2 className="mt-1 text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">
                {subscription.plan === "pro" ? "Pro Plan" : "Free Plan"}
              </h2>
            </div>
          </div>

          <p className="mt-5 text-[0.95rem] leading-[1.74] text-[var(--text-muted)]">
            {subscription.currentPeriodEnd
              ? `Активний до ${formatDateTime(subscription.currentPeriodEnd) ?? "поточної дати"}. Тут же має жити billing, invoices і межі плану.`
              : "Тариф і керування доступом винесені в окремий сервісний екран, а не змішані з основним dashboard."}
          </p>

          <div className="mt-5 space-y-3">
            <div className="surface-soft rounded-[1.25rem] p-4">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">Статус</p>
              <p className="mt-2 text-[1rem] font-semibold text-[var(--text-strong)]">{mapAccessLabel(subscription.plan, subscription.status)}</p>
            </div>
            <div className="surface-soft rounded-[1.25rem] p-4">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">Що відкрито</p>
              <p className="mt-2 text-[0.92rem] leading-[1.68] text-[var(--text-muted)]">
                {subscription.plan === "pro"
                  ? "Сценарії, модулі підготовки та сервісні екрани вже прив'язані до цього акаунта."
                  : "Базовий сценарний контур активний. Платні модулі вже мають місце в навігації та готові до підключення."}
              </p>
            </div>
          </div>

          <Link href={getDashboardHref("access")} className="btn-secondary mt-6 w-full">
            Відкрити доступ
          </Link>
        </article>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[1.85rem] font-semibold leading-[1.02] tracking-[-0.045em] text-[var(--text-strong)]">Модулі</h2>
            <p className="mt-2 text-[0.96rem] leading-[1.72] text-[var(--text-muted)]">
              Усі інструменти видно одразу, але dashboard не перевантажений і тримає акцент на наступних діях.
            </p>
          </div>
          {searchQuery ? <DashboardChip tone="accent">Пошук: {searchQuery}</DashboardChip> : null}
        </div>

        {filteredModules.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredModules.map((module) => (
              <DashboardModuleCard key={module.view} module={module} />
            ))}
          </div>
        ) : (
          <div className="surface-panel rounded-[1.9rem] p-6">
            <h3 className="text-[1.32rem] font-semibold tracking-[-0.035em] text-[var(--text-strong)]">За цим запитом модулі не знайдено</h3>
            <p className="mt-3 max-w-2xl text-[0.95rem] leading-[1.72] text-[var(--text-muted)]">
              Спробуйте інший запит у пошуку зверху або поверніться до повного огляду кабінету, щоб побачити всю структуру.
            </p>
            <Link href="/dashboard" className="btn-secondary mt-5">
              Скинути пошук
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

function DashboardScenarioWorkspace({
  recentSimulations
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
            У цьому розділі житиме окрема історія сценаріїв. Після першого проходження симуляції сюди підтягнеться останній маршрут, а нижче
            збережуться попередні варіанти для порівняння.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/simulate" className="btn-primary">
              Почати онбординг
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
      : latest.targetRole ?? latest.currentRole ?? "Кар'єрний сценарій";
  const verdict = verdictLabel(latest.verdictLabel);
  const probability = probabilityLabel(latest.probabilityOfGettingJob);
  const market = mapTargetMarketLabel(latest.targetMarket);
  const priority = mapPriorityLabel(latest.transitionPriority);
  const moneyDelta = formatSignedMoney(latest.ceilingGapMedian);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.14fr),23rem]">
        <article className="dashboard-spotlight-card rounded-[2.3rem] p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <DashboardChip tone="success">Останній сценарій</DashboardChip>
            <DashboardChip tone="default">{simulationStatusLabel(latest.status)}</DashboardChip>
            {priority ? <DashboardChip tone="accent">{priority}</DashboardChip> : null}
          </div>

          <h1 className="mt-5 max-w-[15ch] text-[2.3rem] font-semibold leading-[0.94] tracking-[-0.055em] text-[var(--text-strong)] md:text-[3.15rem]">
            {focusTitle}
          </h1>
          <p className="mt-5 max-w-3xl text-[1rem] leading-[1.78] text-[var(--text-muted)]">
            Це окремий workspace для сценаріїв переходу: останній розрахунок, короткий висновок і історія попередніх маршрутів без змішування з іншими модулями.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DashboardMetricCard label="Вердикт" value={verdict ?? "Базовий висновок"} description="Ключове формулювання з останнього сценарію." />
            <DashboardMetricCard label="Шанс входу" value={probability ?? "ще рахується"} description="Орієнтир на реалістичність входу в роль." />
            <DashboardMetricCard label="Ринок" value={market ?? "не вказано"} description="Контекст для вимог, конкуренції та вакансій." />
            <DashboardMetricCard label="Стеля доходу" value={moneyDelta ?? "—"} description="Розрив із поточним шляхом у довшій перспективі." />
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/simulate" className="btn-primary">
              Перерахувати сценарій
            </Link>
            <Link href={getDashboardHref("resume")} className="btn-secondary">
              Перейти до CV Builder
            </Link>
          </div>
        </article>

        <article className="surface-panel rounded-[2rem] p-5 md:p-6">
          <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">Що робити далі</h2>
          <div className="mt-5 space-y-3">
            {[
              "Зафіксувати цільову роль і перевести її в CV Builder.",
              "Порівняти ще один альтернативний маршрут, якщо рішення все ще неочевидне.",
              "Після сильного сценарію перейти в модулі підготовки до ринку."
            ].map((item) => (
              <div key={item} className="surface-soft rounded-[1.2rem] p-4">
                <p className="text-[0.93rem] leading-[1.72] text-[var(--text-muted)]">{item}</p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-[1.8rem] font-semibold leading-[1.04] tracking-[-0.045em] text-[var(--text-strong)]">Історія сценаріїв</h2>
          <p className="mt-2 text-[0.95rem] leading-[1.72] text-[var(--text-muted)]">
            Останній сценарій живе в top area, а попередні варіанти зберігаються тут окремо, щоб не забивати головний dashboard.
          </p>
        </div>

        <div className="grid gap-4">
          {recentSimulations.map((simulation) => {
            const roleLabel =
              simulation.currentRole && simulation.targetRole
                ? `${simulation.currentRole} -> ${simulation.targetRole}`
                : simulation.targetRole ?? simulation.currentRole ?? "Кар'єрний сценарій";

            return (
              <article key={simulation.id} className="surface-panel rounded-[1.8rem] p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[1.24rem] font-semibold leading-[1.14] tracking-[-0.035em] text-[var(--text-strong)]">{roleLabel}</h3>
                    <p className="mt-2 text-[0.93rem] leading-[1.7] text-[var(--text-muted)]">
                      {formatDateTime(simulation.createdAt) ? `Збережено ${formatDateTime(simulation.createdAt)}.` : "Збережено в історії кабінету."}
                    </p>
                  </div>
                  <DashboardChip tone="default">{simulationStatusLabel(simulation.status)}</DashboardChip>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {verdictLabel(simulation.verdictLabel) ? <DashboardChip tone="success">{verdictLabel(simulation.verdictLabel)}</DashboardChip> : null}
                  {probabilityLabel(simulation.probabilityOfGettingJob) ? <DashboardChip tone="accent">{probabilityLabel(simulation.probabilityOfGettingJob)}</DashboardChip> : null}
                  {mapTargetMarketLabel(simulation.targetMarket) ? <DashboardChip tone="default">{mapTargetMarketLabel(simulation.targetMarket)}</DashboardChip> : null}
                  {mapPriorityLabel(simulation.transitionPriority) ? <DashboardChip tone="default">{mapPriorityLabel(simulation.transitionPriority)}</DashboardChip> : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ModuleWorkspace({ moduleView }: { moduleView: DashboardModule["view"] }) {
  const config = moduleWorkspaceConfigs[moduleView];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr),22rem]">
        <article className="dashboard-spotlight-card rounded-[2.3rem] p-6 md:p-8">
          <DashboardChip tone="accent">{config.eyebrow}</DashboardChip>
          <h1 className="mt-5 max-w-[15ch] text-[2.2rem] font-semibold leading-[0.94] tracking-[-0.055em] text-[var(--text-strong)] md:text-[3.05rem]">
            {config.title}
          </h1>
          <p className="mt-5 max-w-3xl text-[1rem] leading-[1.78] text-[var(--text-muted)]">{config.description}</p>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {config.summary.map((item) => (
              <DashboardMetricCard key={item.label} label={item.label} value={item.value} description="Структура цього workspace уже закладена в кабінеті." />
            ))}
          </div>
        </article>

        <article className="surface-panel rounded-[2rem] p-5 md:p-6">
          <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">Що важливо по UX</h2>
          <div className="mt-5 space-y-3">
            {[
              "Модуль живе у власному просторі, а не змішується з overview.",
              "Його можна підключати окремо без перебудови всього кабінету.",
              "Користувач бачить логіку маршруту: сценарії -> модуль -> наступний крок."
            ].map((item) => (
              <div key={item} className="surface-soft rounded-[1.2rem] p-4">
                <p className="text-[0.93rem] leading-[1.68] text-[var(--text-muted)]">{item}</p>
              </div>
            ))}
          </div>

          <Link href="/dashboard" className="btn-secondary mt-6 w-full">
            Повернутися на dashboard
          </Link>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {config.columns.map((column) => (
          <article key={column.title} className="surface-panel rounded-[1.9rem] p-5 md:p-6">
            <h2 className="text-[1.3rem] font-semibold leading-[1.08] tracking-[-0.035em] text-[var(--text-strong)]">{column.title}</h2>
            <p className="mt-3 text-[0.94rem] leading-[1.72] text-[var(--text-muted)]">{column.description}</p>
            <div className="mt-5 space-y-3">
              {column.items.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-[1.2rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.72)] px-4 py-3">
                  <span className="mt-2 inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                  <p className="text-[0.93rem] leading-[1.65] text-[var(--text-muted)]">{item}</p>
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
        <article className="dashboard-spotlight-card rounded-[2.3rem] p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <DashboardChip tone={accessTone(subscription.plan, subscription.status)}>Доступ</DashboardChip>
            <DashboardChip tone={accessTone(subscription.plan, subscription.status)}>{accessLabel}</DashboardChip>
          </div>

          <h1 className="mt-5 max-w-[14ch] text-[2.2rem] font-semibold leading-[0.94] tracking-[-0.055em] text-[var(--text-strong)] md:text-[3.05rem]">
            План, billing і керування акаунтом в одному місці
          </h1>
          <p className="mt-5 max-w-3xl text-[1rem] leading-[1.78] text-[var(--text-muted)]">
            Це окремий сервісний екран для всього, що стосується доступу: поточний план, email акаунта, орієнтир по цінах і майбутній billing.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <DashboardMetricCard label="Акаунт" value={email} description="Саме за цим профілем закріплений доступ до модулів." />
            <DashboardMetricCard
              label="Поточний план"
              value={subscription.plan === "pro" ? "Pro" : "Free"}
              description={subscription.currentPeriodEnd ? `Активний до ${formatShortDate(subscription.currentPeriodEnd) ?? "поточної дати"}.` : "Базовий доступ без billing."}
            />
            <DashboardMetricCard
              label="Що далі"
              value={subscription.plan === "pro" ? "Керувати підпискою" : "Оновити план"}
              description={subscription.plan === "pro" ? "Billing і ліміти плану логічно живуть саме тут." : "Після апгрейду цей екран стане центром керування доступом."}
            />
          </div>
        </article>

        <article className="surface-panel rounded-[2rem] p-5 md:p-6">
          <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">Дії по акаунту</h2>
          <div className="mt-5 space-y-3">
            <Link href="/pricing" className="btn-secondary w-full">
              Переглянути тарифи
            </Link>
            <Link href="/checkout?plan=monthly" className="btn-primary w-full">
              Відкрити оплату
            </Link>
            <button type="button" onClick={onSignOut} disabled={isSigningOut} className="btn-dark w-full disabled:opacity-60">
              {isSigningOut ? "Виходимо..." : "Вийти з акаунта"}
            </button>
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="surface-panel rounded-[1.9rem] p-5 md:p-6">
          <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">Орієнтир по планах</h2>

          <div className="mt-5 space-y-4">
            <div className="surface-soft rounded-[1.35rem] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[1.02rem] font-semibold text-[var(--text-strong)]">{monthlyPlan.name}</p>
                <DashboardChip tone="accent">{formatUah(monthlyPlan.billedNowUah)}</DashboardChip>
              </div>
              <p className="mt-3 text-[0.92rem] leading-[1.68] text-[var(--text-muted)]">{monthlyPlan.billingLabel}</p>
            </div>

            <div className="surface-soft rounded-[1.35rem] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[1.02rem] font-semibold text-[var(--text-strong)]">{annualPlan.name}</p>
                <DashboardChip tone="success">{formatUah(annualPlan.billedNowUah)}</DashboardChip>
              </div>
              <p className="mt-3 text-[0.92rem] leading-[1.68] text-[var(--text-muted)]">
                {annualPlan.billingLabel}. Економія {formatUah(annualPlan.savingsUah)} за рік.
              </p>
            </div>
          </div>
        </article>

        <article className="surface-panel rounded-[1.9rem] p-5 md:p-6">
          <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">Що входить у кабінет</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {dashboardModules.map((module) => (
              <div key={module.view} className="rounded-[1.25rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.72)] p-4">
                <div className="flex items-center gap-3">
                  <span className="surface-soft inline-flex h-10 w-10 items-center justify-center rounded-[0.95rem] text-[var(--accent-strong)]">
                    {module.icon}
                  </span>
                  <p className="text-[0.98rem] font-semibold text-[var(--text-strong)]">{module.title}</p>
                </div>
                <p className="mt-3 text-[0.88rem] leading-[1.62] text-[var(--text-muted)]">{module.description}</p>
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
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { openAuthDialog } = useAuthDialog();
  const [state, setState] = useState<DashboardState>({ status: "loading" });
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(requestedSearch ?? "");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedValue = window.localStorage.getItem("decivio_dashboard_sidebar_collapsed");
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

    window.localStorage.setItem("decivio_dashboard_sidebar_collapsed", String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    setSearchValue(requestedSearch ?? "");
  }, [requestedSearch]);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [requestedView, requestedSearch]);

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
      const rawGuestSessionId = readCookie(GUEST_USER_COOKIE_NAME);
      const guestSessionId = isValidGuestSessionId(rawGuestSessionId) ? rawGuestSessionId : null;

      let simulationsCountQuery = supabase.from("simulations").select("id", { count: "exact", head: true });
      let simulationsListQuery = supabase
        .from("simulations")
        .select("id, created_at, status, inputs")
        .order("created_at", { ascending: false })
        .limit(8);

      if (guestSessionId) {
        simulationsCountQuery = simulationsCountQuery.or(`user_id.eq.${userId},guest_session_id.eq.${guestSessionId}`);
        simulationsListQuery = simulationsListQuery.or(`user_id.eq.${userId},guest_session_id.eq.${guestSessionId}`);
      } else {
        simulationsCountQuery = simulationsCountQuery.eq("user_id", userId);
        simulationsListQuery = simulationsListQuery.eq("user_id", userId);
      }

      const [profileResponse, subscriptionResponse, countResponse, simulationsResponse] = await Promise.all([
        supabase.from("profiles").select("email, full_name").eq("id", userId).maybeSingle(),
        supabase.from("subscriptions").select("status, plan, current_period_end").eq("user_id", userId).maybeSingle(),
        simulationsCountQuery,
        simulationsListQuery
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

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedQuery = searchValue.trim();
    if (!normalizedQuery) {
      router.push("/dashboard");
      return;
    }

    router.push(`/dashboard?search=${encodeURIComponent(normalizedQuery)}`);
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
  const suggestedActionHref = lastSimulation ? getDashboardHref("scenario") : "/simulate";
  const suggestedActionLabel = lastSimulation ? "Останній сценарій" : "Почати онбординг";
  const moduleView =
    activeView === "resume" || activeView === "interviews" || activeView === "jobs" || activeView === "offers" || activeView === "assistant"
      ? activeView
      : null;
  const shellStyle = {
    "--cabinet-sidebar-width": isSidebarCollapsed ? "5.75rem" : "17.25rem"
  } as CSSProperties;

  return (
    <section className="dashboard-shell-screen dashboard-shell" style={shellStyle}>
      <DashboardSidebar
        activeView={activeView}
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onToggleCollapsed={() => setIsSidebarCollapsed((current) => !current)}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        totalSimulations={state.totalSimulations}
        accessLabel={accessLabel}
        subscription={state.subscription}
      />

      <div className="lg:pl-[var(--cabinet-sidebar-width)]">
        <DashboardTopbar
          email={state.user.email}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onSearchSubmit={handleSearchSubmit}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          suggestedActionHref={suggestedActionHref}
          suggestedActionLabel={suggestedActionLabel}
          onSignOut={handleSignOut}
          isSigningOut={isSigningOut}
        />

        <div className="space-y-6 px-4 py-6 md:px-6 xl:px-8">
          {activeView === "overview" ? (
            <DashboardOverview
              userDisplayName={state.user.displayName}
              totalSimulations={state.totalSimulations}
              subscription={state.subscription}
              recentSimulations={state.recentSimulations}
              lastSimulation={lastSimulation}
              searchQuery={searchQuery}
            />
          ) : null}

          {activeView === "scenario" ? <DashboardScenarioWorkspace recentSimulations={state.recentSimulations} /> : null}

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
