import Link from "next/link";
import type { ReactNode } from "react";
import { HeroBeforeAfter } from "@/components/hero-before-after";
import { JsonLd } from "@/components/json-ld";
import { Reveal } from "@/components/reveal";
import { pricingPlans } from "@/lib/pricing";
import { createFaqSchema, createMetadata, createSoftwareApplicationSchema } from "@/lib/seo";

const featureShowcases = [
  {
    title: "Порівняння сценаріїв переходу",
    visual: "scenarios",
    bullets: [
      "Порівняння доходу по роках для кількох варіантів переходу",
      "Точка, де новий напрям починає випереджати поточний шлях",
      "Максимальна просадка та ризиковий період у перші місяці",
      "Альтернативні маршрути переходу з різним темпом входу"
    ],
    cta: "Переглянути сценарії",
    href: "/pricing",
    previewTitle: "Панель сценаріїв",
    previewRows: [
      { label: "Залишитись", value: "+12% за 5 років", accent: false },
      { label: "Перейти", value: "+68% за 5 років", accent: true },
      { label: "Альтернатива", value: "+44% за 5 років", accent: false }
    ],
    chips: ["Окупність: ~22 міс.", "Ризик-період: 6 міс."]
  },
  {
    title: "Резюме під цільову роль",
    visual: "resume",
    bullets: [
      "Рекомендована структура під конкретну роль або вакансію",
      "Формулювання досвіду через результати, цифри та досягнення",
      "Виділення релевантних навичок, проєктів і сильних сторін",
      "Фінальна перевірка перед відгуком та готовий експорт у PDF"
    ],
    cta: "Створити нове резюме",
    href: "/pricing",
    previewTitle: "Конструктор резюме",
    previewRows: [
      { label: "Заголовок і ціль", value: "Оновлено під вакансію", accent: true },
      { label: "Досвід роботи", value: "4 релевантні приклади", accent: true },
      { label: "Навички", value: "12 ключових акцентів", accent: false }
    ],
    chips: ["Зрозуміло для рекрутера", "Готово до відгуку", "Експорт у PDF"]
  },
  {
    title: "Підготовка до співбесід",
    visual: "interview",
    bullets: [
      "Питання під конкретну роль і рівень посади",
      "Окремі блоки для розмови з рекрутером, керівником і практичної частини",
      "Підказки, де відповідь звучить слабко або непереконливо",
      "План тренування, щоб поступово посилити відповіді"
    ],
    cta: "Почати підготовку",
    href: "/pricing",
    previewTitle: "Режим співбесіди",
    previewRows: [
      { label: "Розмова з рекрутером", value: "12 питань + коментарі", accent: false },
      { label: "Професійний етап", value: "18 питань + розбір", accent: true },
      { label: "Практична частина", value: "5 задач + орієнтири", accent: false }
    ],
    chips: ["Пробна співбесіда", "Коментарі до відповідей", "Приклади сильних відповідей"]
  },
  {
    title: "Модель робочого дня в новій ролі",
    visual: "dayModel",
    bullets: [
      "Розподіл дня між фокус-роботою, зустрічами та операційними задачами",
      "Скільки буде комунікації, самостійної роботи й відповідальності",
      "Типові задачі, інструменти та ритм нової ролі",
      "Що потрібно освоїти в перші тижні, щоб увійти в робочий темп"
    ],
    cta: "Переглянути модель дня",
    href: "/pricing",
    previewTitle: "Модель робочого дня",
    previewRows: [
      { label: "Фокус-робота", value: "42%", accent: true },
      { label: "Комунікація і зустрічі", value: "28%", accent: false },
      { label: "Операційні задачі", value: "30%", accent: false }
    ],
    chips: ["Реалістичний темп", "Окремо за рівнями", "Очікування від ролі"]
  },
  {
    title: "План переходу",
    visual: "plan",
    bullets: [
      "Пріоритети на перші 30, 60 і 90 днів переходу",
      "Щотижневі кроки для навчання, портфоліо й відгуків",
      "Контрольні точки до першої співбесіди та пропозиції роботи",
      "Показники прогресу, щоб бачити де ви відстаєте"
    ],
    cta: "Отримати план",
    href: "/pricing",
    previewTitle: "План 30/60/90",
    previewRows: [
      { label: "30 днів", value: "База + портфоліо", accent: true },
      { label: "60 днів", value: "Практика + фідбек", accent: false },
      { label: "90 днів", value: "Інтерв’ю + офер", accent: true }
    ],
    chips: ["Відстеження прогресу", "Нагадування", "Точки перевірки"]
  },
  {
    title: "Перевірка відповідності вакансії",
    visual: "match",
    bullets: [
      "Порівняння вашого досвіду з вимогами конкретної вакансії",
      "Показує, яких навичок, інструментів або доказів вам ще бракує",
      "Пояснює, що вже достатньо сильне для відгуку просто зараз",
      "Дає пріоритетний список, що підтягнути спочатку"
    ],
    cta: "Перевірити вакансію",
    href: "/pricing",
    previewTitle: "Карта відповідності",
    previewRows: [
      { label: "Сильні збіги", value: "7 із 10 вимог", accent: true },
      { label: "Потрібно посилити", value: "3 навички", accent: false },
      { label: "Готовність до відгуку", value: "Після 2 кроків", accent: true }
    ],
    chips: ["Пріоритети підготовки", "Опора на текст вакансії", "Зрозумілий план дій"]
  },
  {
    title: "Оцінка пропозиції роботи",
    visual: "offer",
    bullets: [
      "Порівняння нової пропозиції з поточним доходом і вашою ситуацією",
      "Оцінка, чи перекриває пропозиція ризик переходу на старті",
      "Розрахунок вигоди на горизонті кількох років, а не лише першої зарплати",
      "Пояснення, коли варто погоджуватись, торгуватись або почекати"
    ],
    cta: "Оцінити пропозицію",
    href: "/pricing",
    previewTitle: "Оцінка пропозиції",
    previewRows: [
      { label: "Стартовий дохід", value: "+18% до поточного", accent: false },
      { label: "Горизонт 3 років", value: "+540 тис. грн", accent: true },
      { label: "Фінансовий запас", value: "Покриває стартовий ризик", accent: true }
    ],
    chips: ["Порівняння з поточною роллю", "Оцінка ризику", "Аргументи для переговорів"]
  }
] as const;

type FeatureShowcase = (typeof featureShowcases)[number];

const steps = [
  {
    label: "01",
    title: "Вводите дані",
    description: "Дохід, поточна роль, досвід і напрям переходу.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="5" y="4" width="14" height="16" rx="2.5" />
        <path d="M9 9h6" />
        <path d="M9 13h6" />
        <path d="M9 17h4" />
      </svg>
    )
  },
  {
    label: "02",
    title: "Збираємо контекст",
    description: "Зіставляємо ваш профіль із ринком і напрямом переходу.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 18l4-4 3 2 7-8" />
        <path d="M16 8h3v3" />
        <path d="M5 5v14h14" />
      </svg>
    )
  },
  {
    label: "03",
    title: "Бачите висновок",
    description: "Отримуєте чіткий висновок і розуміння, куди рухатись далі.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="8" />
        <path d="M9.5 12.5l1.7 1.7 3.6-4.2" />
      </svg>
    )
  }
];

const socialProof = {
  users: "1 200+",
  usersCaption: "успішних змін кар'єри",
  reviews: "250+",
  rating: "4.5/5",
  ratingValue: 4.5
} as const;

const supportedRoles = [
  "PPC Specialist",
  "DevOps Engineer",
  "Product Designer",
  "Data Analyst",
  "Frontend Developer",
  "Backend Developer",
  "Project Manager",
  "Customer Success Manager",
  "HR Generalist",
  "Business Analyst",
  "Product Manager",
  "SMM Specialist"
] as const;

const reviews = [
  {
    name: "Ірина Коваль",
    role: "Marketing → Product Design",
    quote: "Після симуляції стало зрозуміло, де саме новий напрям починає обганяти мій поточний шлях. Це дало спокій і рамку для рішення.",
    rating: 5
  },
  {
    name: "Олексій Мельник",
    role: "Operations → Data Analytics",
    quote: "Найцінніше тут не стартова цифра, а вся траєкторія на кілька років уперед. Саме цього мені бракувало для реального вибору.",
    rating: 4
  },
  {
    name: "Наталія Бондар",
    role: "HR → UX Research",
    quote: "Результат читається швидко. Не треба вивчати таблиці, щоб зрозуміти, чи виглядає перехід здоровим фінансово.",
    rating: 5
  },
  {
    name: "Марина Стеценко",
    role: "Content Marketing → Product Marketing",
    quote: "Сподобалось, що сервіс не тисне висновком, а показує структуру: де ризик, де потенціал і чим один маршрут сильніший за інший.",
    rating: 4
  },
  {
    name: "Дмитро Литвин",
    role: "Sales → Customer Success",
    quote: "Добре працює саме контраст між сценаріями. Видно не лише нову роль, а й ціну того, щоб залишитись у поточній точці.",
    rating: 5
  },
  {
    name: "Анна Романюк",
    role: "Recruiting → People Operations",
    quote: "Це короткий формат без зайвого шуму. Отримуєш потрібні цифри й одразу бачиш, чи варто заглиблюватись у перехід далі.",
    rating: 4
  }
];

const faqItems = [
  {
    question: "Як працює симулятор зміни кар'єри в Decivio?",
    answer:
      "Ви вводите поточний дохід, роль, досвід, бажаний напрям, рівень англійської та ринок, а Decivio формує персональний висновок із прогнозом доходу, ризиками переходу та наступними кроками."
  },
  {
    question: "Чим цей аналіз відрізняється від простої оцінки зарплати?",
    answer:
      "Decivio дивиться не лише на стартову зарплату. Сервіс порівнює сценарії на кілька років, оцінює шанс увійти в нову роль, часовий горизонт до оферу та потенційну стелю доходу."
  },
  {
    question: "Які дані потрібні для кар'єрної симуляції?",
    answer:
      "Для базового прогнозу достатньо поточного доходу, поточної ролі, стажу, цільової ролі, релевантного досвіду, англійської та ринку, на який ви орієнтуєтесь."
  },
  {
    question: "Для кого підходить сервіс Decivio?",
    answer:
      "Сервіс корисний фахівцям, які планують зміну професії, перехід у суміжну роль, вихід на міжнародний ринок або хочуть зрозуміти, чи окупиться новий напрям у цифрах."
  },
  {
    question: "Скільки часу займає симуляція?",
    answer:
      "Базову симуляцію можна пройти за кілька хвилин. Далі ви отримуєте висновок і можете перейти до платних інструментів, якщо хочете рухатись глибше."
  },
  {
    question: "Що входить у платний доступ?",
    answer:
      "Платний доступ відкриває сценарії переходу, резюме під цільову роль, підготовку до співбесід, перевірку вакансій, оцінку оферу та покроковий план переходу."
  },
  {
    question: "Чи підійде сервіс, якщо в мене ще немає досвіду в новій ролі?",
    answer:
      "Так. Сервіс враховує, чи є у вас практичний або базовий досвід, і показує, наскільки реалістичним виглядає вхід саме з вашої поточної точки."
  },
  {
    question: "Чи можна використати Decivio перед відгуками на вакансії?",
    answer:
      "Так. Після симуляції ви краще розумієте, чи варто рухатися далі, а в платному доступі можете підготувати резюме, перевірити вакансії та підсилити підготовку до співбесіди."
  },
  {
    question: "Чи підходить сервіс для remote або міжнародного ринку?",
    answer:
      "Так. У симуляції можна вибрати ринок України, remote або локальну роботу за кордоном, щоб висновок спирався на ваш цільовий напрям."
  }
] as const;

export const metadata = createMetadata({
  title: "Змінюйте карʼєру з планом, а не навмання",
  description:
    "Decivio допомагає спланувати зміну карʼєри: оцінити сценарії переходу, дохід і ризики, підготувати резюме, перевірити вакансії та краще пройти співбесіди.",
  path: "/",
  keywords: [
    "аналіз зміни кар'єри",
    "прогноз доходу після зміни кар'єри",
    "кар'єрний симулятор",
    "порівняння кар'єрних сценаріїв"
  ]
});

const homeSoftwareSchema = createSoftwareApplicationSchema({
  path: "/",
  description:
    "Decivio допомагає спланувати зміну карʼєри: оцінити сценарії переходу, дохід і ризики, підготувати резюме, перевірити вакансії та краще пройти співбесіди.",
  featureList: featureShowcases.map((item) => item.title),
  offers: [
    {
      name: "Безкоштовний висновок",
      price: 0,
      description: "Перший персоналізований аналіз кар'єрного переходу без оплати.",
      urlPath: "/simulate"
    },
    ...pricingPlans.map((plan) => ({
      name: plan.name,
      price: plan.billedNowUah,
      description: plan.description,
      urlPath: "/pricing"
    }))
  ]
});

const homeFaqSchema = createFaqSchema([...faqItems]);

function FeaturePreviewShell({ children }: { children: ReactNode }) {
  return (
    <div className="feature-preview-shell h-full rounded-[1.75rem] p-4 md:p-5">
      <div className="relative">{children}</div>
    </div>
  );
}

function FeatureChip({ children }: { children: ReactNode }) {
  return <span className="feature-mini-chip">{children}</span>;
}

function Waveform({ bars = 5 }: { bars?: number }) {
  return (
    <div className="feature-waveform" aria-hidden="true">
      {Array.from({ length: bars }).map((_, index) => (
        <span
          key={index}
          className="feature-wave-bar"
          style={{
            height: `${12 + (index % 3) * 5}px`,
            animationDelay: `${index * 120}ms`
          }}
        />
      ))}
    </div>
  );
}

function ScenarioPreview() {
  const statCards = [
    { value: "+12%", active: false },
    { value: "+68%", active: true },
    { value: "+44%", active: false }
  ];

  return (
    <FeaturePreviewShell>
      <div className="feature-chart-panel rounded-[1.45rem] p-3">
        <div className="relative h-32 overflow-hidden rounded-[1.15rem] border border-[rgba(255,255,255,0.72)] bg-[rgba(255,255,255,0.64)]">
          <div className="feature-chart-grid absolute inset-0" />
          <svg viewBox="0 0 320 128" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M12 98 C 54 92, 72 86, 110 80 S 178 72, 214 64 S 276 54, 308 46"
              className="feature-chart-line feature-chart-line--muted feature-line-draw"
              style={{ animationDelay: "40ms" }}
            />
            <path
              d="M12 104 C 48 100, 74 96, 108 90 S 174 78, 210 70 S 270 60, 308 56"
              className="feature-chart-line feature-chart-line--soft feature-line-draw"
              style={{ animationDelay: "160ms" }}
            />
            <path
              d="M12 108 C 52 108, 78 102, 112 86 S 176 52, 212 40 S 272 28, 308 20"
              className="feature-chart-line feature-chart-line--accent feature-line-draw"
              style={{ animationDelay: "280ms" }}
            />
            <circle cx="308" cy="20" r="5" className="feature-pulse-dot" />
          </svg>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {statCards.map((card) => (
          <div
            key={card.value}
            className={`rounded-[1.1rem] border px-3 py-3 ${
              card.active
                ? "border-[rgba(63,94,255,0.22)] bg-[rgba(238,242,255,0.9)]"
                : "border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.74)]"
            }`}
          >
            <div className="flex gap-1.5">
              <span className={`h-1.5 flex-1 rounded-full ${card.active ? "bg-[var(--accent)]/90" : "bg-[rgba(160,170,188,0.65)]"}`} />
              <span className={`h-1.5 w-5 rounded-full ${card.active ? "bg-[var(--accent)]/45" : "bg-[rgba(196,204,220,0.86)]"}`} />
            </div>
            <p className={`mt-4 text-[1rem] font-semibold ${card.active ? "text-[var(--accent-strong)]" : "text-[var(--text-strong)]"}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <FeatureChip>22 міс.</FeatureChip>
        <FeatureChip>6 міс.</FeatureChip>
      </div>
    </FeaturePreviewShell>
  );
}

function ResumePreview() {
  return (
    <FeaturePreviewShell>
      <div className="grid grid-cols-[1.06fr,0.94fr] gap-3">
        <div className="feature-doc-panel rounded-[1.35rem] p-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]/75" />
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]/35" />
            <span className="h-2 w-2 rounded-full bg-[rgba(195,203,219,0.92)]" />
          </div>

          <div className="mt-3 space-y-2">
            <div className="feature-skeleton-line w-[82%]" />
            <div className="feature-skeleton-line w-[68%]" />
          </div>

          <div className="mt-4 grid gap-2">
            <div className="rounded-[1rem] border border-[rgba(63,94,255,0.18)] bg-[rgba(238,242,255,0.9)] p-3">
              <div className="feature-skeleton-line w-[72%]" />
            </div>
            <div className="rounded-[1rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.74)] p-3">
              <div className="feature-skeleton-line w-[64%]" />
            </div>
            <div className="rounded-[1rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.74)] p-3">
              <div className="feature-skeleton-line w-[76%]" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex justify-center rounded-[1.3rem] border border-[rgba(63,94,255,0.16)] bg-[rgba(255,255,255,0.74)] p-3">
            <div
              className="feature-score-ring"
              style={{
                background: "conic-gradient(var(--accent) 0deg 310deg, rgba(227,232,244,0.9) 310deg 360deg)"
              }}
            >
              <div className="feature-score-ring-inner">
                <span className="text-[1.08rem] font-semibold text-[var(--accent-strong)]">86</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className={`flex h-16 items-center justify-center rounded-[1rem] border ${index % 2 === 0 ? "border-[rgba(63,94,255,0.18)] bg-[rgba(238,242,255,0.88)]" : "border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.74)]"}`}
              >
                <svg viewBox="0 0 24 24" className={`h-5 w-5 ${index % 2 === 0 ? "text-[var(--accent-strong)]" : "text-[var(--text-soft)]"}`} fill="none" stroke="currentColor" strokeWidth="1.9">
                  <path d="M6 12.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FeaturePreviewShell>
  );
}

function InterviewPreview() {
  return (
    <FeaturePreviewShell>
      <div className="rounded-[1.35rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.74)] p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]/45" />
            <span className="h-2.5 w-2.5 rounded-full bg-[rgba(196,204,220,0.9)]" />
          </div>
          <Waveform bars={6} />
        </div>

        <div className="mt-5 flex items-end justify-between rounded-[1.2rem] border border-[rgba(63,94,255,0.12)] bg-[rgba(238,242,255,0.42)] px-4 py-4">
          {[22, 34, 18, 38, 28, 44, 24].map((height, index) => (
            <span
              key={index}
              className="feature-wave-bar"
              style={{
                width: "0.42rem",
                height: `${height}px`,
                animationDelay: `${index * 90}ms`
              }}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {[
          "M12 4v16M5 12h14",
          "M12 6v12M8.5 9.5l3.5-3.5 3.5 3.5M8.5 14.5l3.5 3.5 3.5-3.5",
          "M6 12.5l4 4 8-9"
        ].map((path, index) => (
          <div
            key={index}
            className={`flex h-16 items-center justify-center rounded-[1.1rem] border ${index === 1 ? "border-[rgba(63,94,255,0.2)] bg-[rgba(238,242,255,0.88)]" : "border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.74)]"}`}
          >
            <svg viewBox="0 0 24 24" className={`h-6 w-6 ${index === 1 ? "text-[var(--accent-strong)]" : "text-[var(--text-soft)]"}`} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d={path} />
            </svg>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {[82, 74, 68].map((width, index) => (
          <div key={width} className="rounded-[1rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.7)] px-3 py-3">
            <div className="h-2 overflow-hidden rounded-full bg-[rgba(223,229,241,0.8)]">
              <div
                className="feature-meter-fill h-full rounded-full bg-[linear-gradient(90deg,var(--accent-strong),var(--accent))]"
                style={{ width: `${width}%`, animationDelay: `${index * 120}ms` }}
              />
            </div>
          </div>
        ))}
      </div>
    </FeaturePreviewShell>
  );
}

function DayModelPreview() {
  return (
    <FeaturePreviewShell>
      <div className="grid grid-cols-[auto,1fr] items-center gap-4">
        <div
          className="feature-score-ring"
          style={{
            width: "7.25rem",
            height: "7.25rem",
            background:
              "conic-gradient(var(--accent) 0deg 151deg, rgba(145,160,186,0.86) 151deg 252deg, rgba(196,205,223,0.9) 252deg 360deg)"
          }}
        >
          <div className="feature-score-ring-inner">
            <span className="text-[0.9rem] font-semibold text-[var(--text-strong)]">42</span>
          </div>
        </div>

        <div className="grid gap-2.5">
          {["42%", "28%", "30%"].map((value, index) => (
            <div key={value} className="flex items-center justify-between rounded-[1rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.74)] px-3 py-2.5">
              <div className="flex gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${index === 0 ? "bg-[var(--accent)]" : index === 1 ? "bg-[rgba(148,160,183,0.86)]" : "bg-[rgba(196,205,223,0.94)]"}`} />
                <span className={`h-2.5 w-2.5 rounded-full ${index === 0 ? "bg-[var(--accent)]/45" : index === 1 ? "bg-[rgba(148,160,183,0.45)]" : "bg-[rgba(196,205,223,0.55)]"}`} />
              </div>
              <span className={`text-[0.95rem] font-semibold ${index === 0 ? "text-[var(--accent-strong)]" : "text-[var(--text-strong)]"}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-[1.3rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.72)] p-3">
        <div className="flex overflow-hidden rounded-full">
          <div className="feature-segment-block bg-[linear-gradient(90deg,var(--accent-strong),var(--accent))]" style={{ width: "42%" }} />
          <div className="feature-segment-block bg-[rgba(148,160,183,0.86)]" style={{ width: "28%" }} />
          <div className="feature-segment-block bg-[rgba(194,203,219,0.94)]" style={{ width: "30%" }} />
        </div>
        <div className="mt-3 flex justify-between">
          {[0, 1, 2].map((index) => (
            <span key={index} className={`h-2.5 w-2.5 rounded-full ${index === 0 ? "bg-[var(--accent)]" : index === 1 ? "bg-[rgba(148,160,183,0.86)]" : "bg-[rgba(196,205,223,0.94)]"}`} />
          ))}
        </div>
      </div>
    </FeaturePreviewShell>
  );
}

function PlanPreview() {
  return (
    <FeaturePreviewShell>
      <div className="rounded-[1.3rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.72)] p-4">
        <div className="relative flex items-start justify-between px-2">
          <div className="absolute left-8 right-8 top-[1rem] h-[2px] overflow-hidden rounded-full bg-[rgba(223,229,241,0.9)]">
            <div className="feature-progress-line h-full w-full rounded-full bg-[linear-gradient(90deg,var(--accent-strong),var(--accent))]" />
          </div>

          {["30", "60", "90"].map((value, index) => (
            <div key={value} className="relative z-10 flex flex-col items-center gap-2">
              <span className={`timeline-marker flex h-8 w-8 items-center justify-center rounded-full border text-[0.8rem] font-semibold ${index !== 1 ? "border-[rgba(63,94,255,0.22)] bg-[rgba(238,242,255,0.95)] text-[var(--accent-strong)]" : "border-[rgba(24,26,32,0.08)] bg-white text-[var(--text-muted)]"}`}>
                {value}
              </span>
              <div className="h-6 w-[2px] rounded-full bg-[rgba(223,229,241,0.9)]" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {[72, 56, 84].map((width, index) => (
          <div
            key={width}
            className={`rounded-[1.1rem] border px-3 py-3 ${index !== 1 ? "border-[rgba(63,94,255,0.2)] bg-[rgba(238,242,255,0.88)]" : "border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.74)]"}`}
          >
            <div className="mx-auto mb-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-[0.72rem] font-semibold text-[var(--text-muted)]">
              {index + 1}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[rgba(223,229,241,0.8)]">
              <div
                className="feature-meter-fill h-full rounded-full bg-[linear-gradient(90deg,var(--accent-strong),var(--accent))]"
                style={{ width: `${width}%`, animationDelay: `${index * 120}ms` }}
              />
            </div>
          </div>
        ))}
      </div>
    </FeaturePreviewShell>
  );
}

function MatchPreview() {
  return (
    <FeaturePreviewShell>
      <div className="grid grid-cols-[auto,1fr] items-center gap-4">
        <div
          className="feature-score-ring"
          style={{
            width: "7rem",
            height: "7rem",
            background: "conic-gradient(var(--accent) 0deg 252deg, rgba(227,232,244,0.9) 252deg 360deg)"
          }}
        >
          <div className="feature-score-ring-inner">
            <span className="text-[1.1rem] font-semibold text-[var(--accent-strong)]">70</span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2.5">
          {Array.from({ length: 10 }).map((_, index) => (
            <span
              key={index}
              className={`h-5 rounded-[0.7rem] border ${index < 7 ? "border-[rgba(63,94,255,0.18)] bg-[rgba(238,242,255,0.9)]" : "border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.72)]"}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2.5">
        {[76, 38, 64, 52].map((width, index) => (
          <div key={width} className="rounded-[1rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.72)] p-3">
            <div className="h-12 rounded-[0.85rem] bg-[rgba(242,245,251,0.9)] p-2">
              <div className="h-full overflow-hidden rounded-full bg-[rgba(223,229,241,0.8)]">
                <div
                  className="feature-meter-fill h-full rounded-full bg-[linear-gradient(90deg,var(--accent-strong),var(--accent))]"
                  style={{ width: `${width}%`, animationDelay: `${index * 120}ms` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </FeaturePreviewShell>
  );
}

function OfferPreview() {
  return (
    <FeaturePreviewShell>
      <div className="grid grid-cols-[0.9fr,0.2fr,0.9fr] items-end gap-3">
        <div className="rounded-[1.25rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.74)] p-3">
          <div className="flex h-24 items-end">
            <div className="feature-meter-fill w-full rounded-[1rem_1rem_0.65rem_0.65rem] bg-[rgba(148,160,183,0.86)]" style={{ height: "56%" }} />
          </div>
        </div>

        <div className="flex justify-center pb-4">
          <svg viewBox="0 0 24 24" className="h-7 w-7 text-[var(--accent-strong)]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 16l6-6 3 3 5-5" />
            <path d="M14 8h5v5" />
          </svg>
        </div>

        <div className="rounded-[1.25rem] border border-[rgba(63,94,255,0.22)] bg-[rgba(238,242,255,0.9)] p-3">
          <div className="flex h-24 items-end">
            <div
              className="feature-meter-fill w-full rounded-[1rem_1rem_0.65rem_0.65rem] bg-[linear-gradient(180deg,var(--accent),var(--accent-strong))]"
              style={{ height: "82%", animationDelay: "120ms" }}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {["+18%", "+540"].map((value, index) => (
          <div
            key={value}
            className={`rounded-[1.1rem] border px-3 py-4 text-center ${index === 1 ? "border-[rgba(63,94,255,0.22)] bg-[rgba(238,242,255,0.88)]" : "border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.74)]"}`}
          >
            <span className={`text-[1.06rem] font-semibold ${index === 1 ? "text-[var(--accent-strong)]" : "text-[var(--text-strong)]"}`}>{value}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-[1.2rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.74)] p-3">
        <div className="h-2 overflow-hidden rounded-full bg-[rgba(223,229,241,0.8)]">
          <div className="feature-meter-fill h-full w-[76%] rounded-full bg-[linear-gradient(90deg,var(--accent-strong),var(--accent))]" style={{ animationDelay: "180ms" }} />
        </div>
      </div>
    </FeaturePreviewShell>
  );
}

function FeaturePreview({ item }: { item: FeatureShowcase }) {
  switch (item.visual) {
    case "scenarios":
      return <ScenarioPreview />;
    case "resume":
      return <ResumePreview />;
    case "interview":
      return <InterviewPreview />;
    case "dayModel":
      return <DayModelPreview />;
    case "plan":
      return <PlanPreview />;
    case "match":
      return <MatchPreview />;
    case "offer":
      return <OfferPreview />;
    default:
      return null;
  }
}

export default function HomePage() {
  return (
    <>
      <JsonLd data={homeSoftwareSchema} />
      <JsonLd data={homeFaqSchema} />
      <div className="pb-10">
        <div className="space-y-8 md:space-y-12">
          <HeroBeforeAfter />

        <section className="py-6 md:py-9">
          <Reveal>
            <div className="grid grid-cols-2 gap-4 md:flex md:items-center md:gap-0">
              <Link
                href="#reviews"
                className="block cursor-pointer space-y-1 transition-opacity hover:opacity-85 md:min-w-[18rem]"
              >
                <p className="font-display text-[1.5rem] font-bold leading-none tracking-[-0.04em] text-[var(--text-strong)] md:text-[1.72rem]">
                  {socialProof.reviews} відгуків
                </p>
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-0.5" aria-label="Рейтинг 4.5 із 5">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const starNumber = index + 1;
                      const isFull = starNumber <= Math.floor(socialProof.ratingValue);
                      const isHalf = !isFull && starNumber - socialProof.ratingValue <= 0.5;

                      return (
                        <svg key={index} viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                          <defs>
                            <linearGradient id={`social-half-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="50%" stopColor="var(--accent)" />
                              <stop offset="50%" stopColor="#eceef3" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.3l-5.8 3.07 1.11-6.47-4.7-4.58 6.49-.94L12 2.5z"
                            fill={isFull ? "var(--accent)" : isHalf ? `url(#social-half-${index})` : "#eceef3"}
                          />
                        </svg>
                      );
                    })}
                  </div>
                  <span className="text-[0.97rem] font-semibold text-[var(--text-muted)]">{socialProof.rating}</span>
                </div>
              </Link>

              <article className="space-y-1 md:min-w-[20rem]">
                <p className="font-display text-[1.5rem] font-bold leading-none tracking-[-0.04em] text-[var(--text-strong)] md:text-[1.72rem]">
                  {socialProof.users}
                </p>
                <p className="text-[0.97rem] font-medium text-[var(--text-muted)]">{socialProof.usersCaption}</p>
              </article>

              <div className="relative col-span-2 min-w-0 overflow-hidden py-1.5 md:col-auto md:flex-1 md:py-2">
                <div className="roles-marquee-track flex w-max items-center gap-5 px-2 md:gap-6 md:px-3">
                  {[...supportedRoles, ...supportedRoles].map((role, index) => (
                    <span
                      key={`${role}-${index}`}
                      className="inline-flex items-center gap-2 whitespace-nowrap text-[0.86rem] font-semibold text-[var(--text-muted)] md:text-[0.94rem]"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]/55" />
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <section id="process" className="relative py-4 md:py-6">
          <Reveal>
            <div className="grid gap-5 md:grid-cols-3 md:gap-6">
              {steps.map((step) => (
                <article
                  key={step.title}
                  className="surface-panel relative overflow-hidden rounded-[2rem] px-5 py-6 md:min-h-[272px] md:px-6 md:py-7"
                >
                  <span className="pointer-events-none absolute right-3 top-2 font-display text-[5.6rem] font-semibold leading-none tracking-[-0.06em] text-[rgba(63,94,255,0.08)] md:text-[6.8rem]">
                    {step.label}
                  </span>

                  <div className="relative flex h-full flex-col">
                    <div className="surface-soft flex h-16 w-16 items-center justify-center rounded-[1.35rem] text-[var(--accent-strong)] shadow-[0_14px_28px_-24px_rgba(67,97,255,0.14)]">
                      {step.icon}
                    </div>

                    <div className="mt-7 space-y-3">
                      <h3 className="font-display text-[1.3rem] font-bold leading-[1.04] tracking-[-0.04em] text-[var(--text-strong)] md:text-[1.46rem]">
                        {step.title}
                      </h3>
                      <p className="max-w-[22ch] text-[0.92rem] leading-[1.68] text-[var(--text-muted)] md:text-[0.97rem]">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </Reveal>
        </section>

        <section className="relative py-4 md:py-6">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-[82%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(63,94,255,0.06)] blur-3xl md:h-48" />
          <Reveal className="relative mx-auto max-w-[980px] px-4 py-6 text-center md:px-8 md:py-8">
            <h2 className="mx-auto max-w-4xl text-balance font-display text-[1.26rem] font-bold leading-[1.26] tracking-[-0.035em] text-[var(--text-strong)] md:text-[1.9rem]">
              Ми поруч, щоб зробити ваш шлях до нової роботи{" "}
              <span className="text-[var(--accent-strong)]">простішим і результативнішим</span>.
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-[0.95rem] leading-[1.72] text-[var(--text-muted)] md:text-[1.04rem]">
              За допомогою наших інструментів і практичних підказок ви швидше виходите на співбесіди, краще виглядаєте на ринку
              та рухаєтесь до карʼєри, яку справді хочете.
            </p>
            <div className="mt-4 flex justify-center md:mt-5">
              <Link href="/simulate" className="btn-primary px-7 py-3 md:px-8">
                Отримати прогноз зміни кар’єри
              </Link>
            </div>
          </Reveal>
        </section>
      </div>

      <section id="reviews" className="relative">
        <Reveal>
          <div className="relative">
            <div className="overflow-hidden px-1 pt-8 md:px-2 md:pt-10">
              <div className="reviews-marquee-track flex w-max gap-5">
                {[...reviews, ...reviews].map((review, index) => (
                  <article
                    key={`${review.name}-${index}`}
                    aria-hidden={index >= reviews.length}
                  className="surface-panel relative flex min-h-[315px] w-[20.5rem] flex-none flex-col overflow-hidden rounded-[2rem] px-6 py-6 md:w-[21.5rem]"
                  >
                    <span className="pointer-events-none absolute left-4 top-2 font-display text-[4.6rem] leading-none text-[rgba(74,108,255,0.08)]">
                      “
                    </span>

                    <p className="relative max-w-[28ch] text-[1.01rem] leading-[1.8] text-[var(--text-strong)]">
                      {review.quote}
                    </p>

                    <div className="mt-auto pt-8">
                      <div className="flex items-center justify-center gap-1.5">
                        {Array.from({ length: 5 }).map((_, starIndex) => {
                          const filled = starIndex < review.rating;

                          return (
                            <svg
                              key={`${review.name}-${index}-${starIndex}`}
                              viewBox="0 0 24 24"
                              className={`h-6 w-6 ${filled ? "fill-[var(--accent)] text-[var(--accent)]" : "fill-[#eceef3] text-[#eceef3]"}`}
                              aria-hidden="true"
                            >
                              <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.3l-5.8 3.07 1.11-6.47-4.7-4.58 6.49-.94L12 2.5z" />
                            </svg>
                          );
                        })}
                      </div>

                      <div className="mt-4 text-center">
                        <p className="font-display text-[1.18rem] font-semibold text-[var(--text-strong)] md:text-[1.24rem]">{review.name}</p>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">{review.role}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section id="features" className="mt-8 space-y-8 md:mt-10 md:space-y-10">
        {featureShowcases.map((item, index) => {
          return (
            <Reveal key={item.title} delayMs={index * 40}>
              <article className="surface-panel relative overflow-hidden rounded-[2.4rem] px-6 py-6 md:px-8 md:py-8">
                <div className="pointer-events-none absolute -right-10 top-0 h-20 w-52 rounded-full bg-[rgba(67,97,255,0.05)] blur-3xl" />
                <div className="pointer-events-none absolute -left-10 bottom-0 h-20 w-52 rounded-full bg-[rgba(152,165,255,0.05)] blur-3xl" />

                <div className="relative grid gap-7 md:grid-cols-12 md:gap-8">
                  <div className="flex h-full flex-col md:col-span-7">
                    <div className="space-y-4 md:space-y-5">
                      <h3 className="font-display text-[1.66rem] font-bold leading-[1.01] tracking-[-0.045em] text-[var(--text-strong)] md:text-[2.18rem]">
                        {item.title}
                      </h3>

                      <div className="space-y-2.5">
                        {item.bullets.map((bullet) => (
                          <p key={bullet} className="flex items-start gap-2.5 text-[0.92rem] leading-[1.7] text-[var(--text-muted)] md:text-[0.97rem]">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                            <span>{bullet}</span>
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 md:mt-8">
                      <Link href={item.href} className="btn-primary">
                        {item.cta}
                      </Link>
                    </div>
                  </div>

                  <div className="md:col-span-5">
                    <FeaturePreview item={item} />
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </section>

      <section id="faq" className="mt-16 space-y-5 py-2 md:mt-24 md:space-y-6 md:py-4">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="section-title">Часті питання</h2>
          </div>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2">
          {faqItems.map((item, index) => (
            <Reveal key={item.question} delayMs={index * 40}>
              <details className="surface-panel group rounded-[1.8rem] px-5 py-4 md:px-6 md:py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[1.02rem] font-semibold leading-[1.24] tracking-[-0.02em] text-[var(--text-strong)] marker:hidden [&::-webkit-details-marker]:hidden md:text-[1.12rem]">
                  <span>{item.question}</span>
                  <span className="text-[1.4rem] font-medium text-[var(--accent-strong)] transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 pr-8 text-[0.94rem] leading-[1.72] text-[var(--text-muted)] md:text-[0.98rem]">{item.answer}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

    </div>
    </>
  );
}

