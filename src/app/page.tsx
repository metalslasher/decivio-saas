import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
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
    ]
  },
  {
    title: "Резюме під цільову роль",
    visual: "resume",
    bullets: [
      "Рекомендована структура під конкретну роль або вакансію",
      "Формулювання досвіду через результати, цифри та досягнення",
      "Виділення релевантних навичок, проєктів і сильних сторін",
      "Фінальна перевірка перед відгуком та готовий експорт у PDF"
    ]
  },
  {
    title: "Підготовка до співбесід",
    visual: "interview",
    bullets: [
      "Питання під конкретну роль і рівень посади",
      "Окремі блоки для розмови з рекрутером, керівником і практичної частини",
      "Підказки, де відповідь звучить слабко або непереконливо",
      "План тренування, щоб поступово посилити відповіді"
    ]
  },
  {
    title: "Модель робочого дня в новій ролі",
    visual: "dayModel",
    bullets: [
      "Розподіл дня між фокус-роботою, зустрічами та операційними задачами",
      "Скільки буде комунікації, самостійної роботи й відповідальності",
      "Типові задачі, інструменти та ритм нової ролі",
      "Що потрібно освоїти в перші тижні, щоб увійти в робочий темп"
    ]
  },
  {
    title: "План переходу",
    visual: "plan",
    bullets: [
      "Пріоритети на перші 30, 60 і 90 днів переходу",
      "Щотижневі кроки для навчання, портфоліо й відгуків",
      "Контрольні точки до першої співбесіди та пропозиції роботи",
      "Показники прогресу, щоб бачити де ви відстаєте"
    ]
  },
  {
    title: "Перевірка відповідності вакансії",
    visual: "match",
    bullets: [
      "Порівняння вашого досвіду з вимогами конкретної вакансії",
      "Показує, яких навичок, інструментів або доказів вам ще бракує",
      "Пояснює, що вже достатньо сильне для відгуку просто зараз",
      "Дає пріоритетний список, що підтягнути спочатку"
    ]
  },
  {
    title: "Оцінка пропозиції роботи",
    visual: "offer",
    bullets: [
      "Порівняння нової пропозиції з поточним доходом і вашою ситуацією",
      "Оцінка, чи перекриває пропозиція ризик переходу на старті",
      "Розрахунок вигоди на горизонті кількох років, а не лише першої зарплати",
      "Пояснення, коли варто погоджуватись, торгуватись або почекати"
    ]
  }
] as const;

type FeatureShowcase = (typeof featureShowcases)[number];

const socialProof = {
  users: "1 200+",
  usersCaption: "успішних змін кар'єри",
  reviews: "250+",
  rating: "4.5/5",
  ratingValue: 4.5
} as const;

const careerBrandNames = [
  "Grammarly",
  "Genesis",
  "Ajax Systems",
  "MacPaw",
  "Readdle",
  "Jooble",
  "Preply",
  "People.ai",
  "airSlate",
  "Restream",
  "Competera",
  "BetterMe",
  "Reface",
  "Petcube",
  "Depositphotos",
  "Promova",
  "Headway",
  "Uklon",
  "monobank",
  "Liki24"
] as const;

const painPoints = [
  {
    title: "Хочете змінити сферу, але не бачите безпечного маршруту"
  },
  {
    title: "Не розумієте, чи окупиться перехід фінансово"
  },
  {
    title: "Складно обрати між кількома ролями"
  },
  {
    title: "Боїтеся вкладати час у напрям, який не дасть результату"
  },
  {
    title: "Сумніваєтесь, чи ваш досвід взагалі релевантний"
  },
  {
    title: "Резюме не пояснює, чому вас мають взяти в нову роль"
  },
  {
    title: "Відгукуєтесь на вакансії, але у відповідь тиша"
  },
  {
    title: "Не знаєте, на який рівень і зарплату реально цілитися"
  }
] as const;

const careerHelpStages = [
  {
    step: "01",
    title: "Порівняти",
    label: "сценарії",
    caption: "роль / напрям / запасний план",
    tags: ["дохід", "ризик", "темп"],
    visual: "scenarios",
    positionClass: "lg:left-[3%] lg:top-[12%]",
    markerClass: "bg-[rgba(67,97,255,0.12)] text-[var(--accent-strong)]"
  },
  {
    step: "02",
    title: "Підготувати",
    label: "профіль",
    caption: "резюме / досвід / вакансії",
    tags: ["навички", "резюме", "ринок"],
    visual: "profile",
    positionClass: "lg:left-[35%] lg:top-[30%]",
    markerClass: "bg-[rgba(20,184,166,0.12)] text-[#0f766e]"
  },
  {
    step: "03",
    title: "Дійти",
    label: "до пропозиції",
    caption: "співбесіди / план / рішення",
    tags: ["розмова", "перехід", "оцінка"],
    visual: "offer",
    positionClass: "lg:right-[3%] lg:top-[8%]",
    markerClass: "bg-[rgba(34,197,94,0.12)] text-[#15803d]"
  }
] as const;

const reviews = [
  {
    name: "Ірина Коваль",
    avatar: "/reviews/iryna-koval.jpg",
    quote:
      "Я скептично ставилась до таких прогнозів. Але тут хоча б стало видно, що перші 5-6 місяців будуть просадкою, а не казкою про 'нове життя'. Після цього вже спокійніше вирішила йти в дизайн поступово.",
    rating: 5
  },
  {
    name: "Олексій Мельник",
    avatar: "/reviews/oleksiy-melnyk.jpg",
    quote:
      "Не все вийшло ідеально з першого разу: довелося кілька разів міняти рівень ринку, бо я завищив очікування. Але в результаті зрозумів, що мені краще цілитись не в junior, а в аналітичні roles ближче до operations.",
    rating: 4
  },
  {
    name: "Наталія Бондар",
    avatar: "/reviews/nataliya-bondar.jpg",
    quote:
      "До цього я чесно думала, що починаю з нуля. Після аналізу виписала 5 історій з HR, які нормально лягають у UX Research: інтерв'ю, патерни, болі людей. Це дуже зняло паніку.",
    rating: 5
  },
  {
    name: "Марина Стеценко",
    avatar: "/reviews/maryna-stetsenko.jpg",
    quote:
      "За два вечори переписала резюме: прибрала красиві, але порожні фрази й додала цифри по запусках. Мінус: хотілося б більше прикладів саме для B2B SaaS, але напрям правок був дуже точний.",
    rating: 4
  },
  {
    name: "Дмитро Литвин",
    avatar: "/reviews/dmytro-lytvyn.jpg",
    quote:
      "Я раніше відгукувався майже на все підряд. Тут відсіяв 7 вакансій, залишив 4 нормальні під мій досвід у sales і з двох отримав перший дзвінок. Не магія, просто менше хаосу.",
    rating: 5
  },
  {
    name: "Анна Романюк",
    avatar: "/reviews/anna-romanyuk.jpg",
    quote:
      "Мені треба було не 'повір у себе', а список що робити в понеділок. План на 30-60-90 днів допоміг. Спочатку пунктів було забагато, я половину відклала, але маршрут нарешті став реальним.",
    rating: 4
  },
  {
    name: "Владислав Гнатюк",
    avatar: "/reviews/vladyslav-hnatyuk.jpg",
    quote:
      "Я був майже впевнений, що без комерційного досвіду в QA мене ніхто не гляне. Аналіз витягнув задачі з support, які можна показати як релевантні, і дав список, що доробити в портфоліо.",
    rating: 5
  },
  {
    name: "Софія Левченко",
    avatar: "/reviews/sofiya-levchenko.jpg",
    quote:
      "Чесно, мені не дуже сподобався перший висновок: краще не поспішати. Але він був логічний. Побачила, що без нормального кейсу про координацію проєктів я просто піду на слабші вакансії.",
    rating: 4
  },
  {
    name: "Андрій Мороз",
    avatar: "/reviews/andriy-moroz.jpg",
    quote:
      "Після трьох співбесід я зрозумів, що погано пояснюю, навіщо мені PM. Тут зібрав нормальну історію переходу: не 'втомився кодити', а що я вже робив продуктово в команді.",
    rating: 5
  },
  {
    name: "Катерина Шевчук",
    avatar: "/reviews/kateryna-shevchuk.jpg",
    quote:
      "Я хотіла просити більше, ніж реально тягнула на старті. Прогноз трохи приземлив, але чесно: краще знати це до співбесіди. Зараз цілюсь у нижчий діапазон і паралельно закриваю payroll.",
    rating: 5
  },
  {
    name: "Роман Савчук",
    avatar: "/reviews/roman-savchuk.jpg",
    quote:
      "Я завис між BA і Product Owner. Після порівняння вибрав BA, бо бар'єр входу для мене нижчий. Не всі вакансії легко класифікувати, це мінус, але рішення стало менш емоційним.",
    rating: 4
  },
  {
    name: "Микита Ткаченко",
    avatar: "/reviews/mykyta-tkachenko.jpg",
    quote:
      "Думав, портфоліо вже ок, бо виглядає красиво. Після перевірки прибрав 3 слабкі екрани й переписав один кейс нормальною логікою. Хотілося б ще прикладів junior-портфоліо, але стало сильніше.",
    rating: 4
  },
  {
    name: "Ольга Данилюк",
    avatar: "/reviews/olha-danyliuk.jpg",
    quote:
      "Я думала, що мені просто скажуть 'йди в продукт'. Насправді висновок був обережніший: спочатку підтягнути кейс по запуску фічі. Це не так приємно читати, зате чесно.",
    rating: 5
  },
  {
    name: "Павло Кравець",
    avatar: "/reviews/pavlo-kravets.jpg",
    quote:
      "Після 8 років у логістиці важко було зрозуміти, що взагалі продавати в резюме. За тиждень зібрав 4 нормальні історії з цифрами. Хотів би ще більше прикладів для supply chain.",
    rating: 4
  },
  {
    name: "Юлія Мартинюк",
    avatar: "/reviews/yuliya-martynyuk.jpg",
    quote:
      "Мене зупиняло питання віку і того, що я не з IT. Тут побачила, які навички з навчання людей можна перенести в L&D/EdTech. Не стало легко, але стало зрозуміло, з чого почати.",
    rating: 5
  },
  {
    name: "Артем Клименко",
    avatar: "/reviews/artem-klymenko.jpg",
    quote:
      "Я прийшов перевірити одну вакансію, а в результаті зрозумів, що вона зарано для мене. Неприємно, але корисно: не витратив тиждень на тестове, яке майже точно не пройшов би.",
    rating: 5
  },
  {
    name: "Максим Романів",
    avatar: "/reviews/maksym-romaniv.jpg",
    quote:
      "Спочатку було відчуття, що інформації забагато. Але коли пройшовся по плану вдруге, стало видно 3 конкретні кроки: портфоліо, 10 вакансій для калібрування і тренування відповідей.",
    rating: 4
  },
  {
    name: "Аліна Горбач",
    avatar: "/reviews/alina-horbach.jpg",
    quote:
      "Я постійно міняла напрям: то UX, то PM, то аналітика. Порівняння сценаріїв нарешті показало, де я фантазую, а де в мене вже є база. Вибрала аналітику і перестала скакати.",
    rating: 5
  },
  {
    name: "Сергій Приходько",
    avatar: "/reviews/serhiy-prykhodko.jpg",
    quote:
      "Мені зайшло, що сервіс не обіцяє швидкий офер. Він показав, що з моїм рівнем англійської міжнародний ринок поки ризиковий. Мінус бал за те, що хотів би більше підказок по англійській.",
    rating: 4
  },
  {
    name: "Ліза Марченко",
    avatar: "/reviews/liza-marchenko.jpg",
    quote:
      "Перед цим я відправила 18 відгуків і отримала тишу. Після перевірки змінила резюме під конкретні вакансії і прибрала зайві junior-формулювання. Перші відповіді з'явились через кілька днів.",
    rating: 5
  }
];

const faqItems = [
  {
    question: "Як працює симулятор зміни кар'єри в Decivio?",
    answer:
      "Ви проходите коротку симуляцію, вказуєте поточну роль, дохід, досвід, бажаний напрям і ринок. Після цього отримуєте висновок: наскільки перехід виглядає реалістичним, де є ризики і з чого краще почати."
  },
  {
    question: "Чим цей аналіз відрізняється від простої оцінки зарплати?",
    answer:
      "Звичайна оцінка зарплати показує лише можливу цифру на старті. Тут ви бачите сценарій у часі: просадку на початку, період окупності, потенціал нового напряму і різницю між кількома варіантами переходу."
  },
  {
    question: "Чим Decivio відрізняється від ChatGPT?",
    answer:
      "Decivio не просто генерує текст. Сервіс збирає вашу ситуацію в сценарій, рахує ризики, показує сильні й слабкі місця переходу та перетворює це на конкретні наступні кроки."
  },
  {
    question: "Які дані потрібні для кар'єрної симуляції?",
    answer:
      "Для базового прогнозу достатньо поточного доходу, поточної ролі, стажу, цільової ролі, релевантного досвіду, англійської та ринку, на який ви орієнтуєтесь."
  },
  {
    question: "Чи можна порівняти кілька напрямів або сценаріїв?",
    answer:
      "Так. Ви можете побачити різницю між поточним шляхом і кількома варіантами переходу, щоб зрозуміти, який сценарій виглядає сильніше саме для вас."
  },
  {
    question: "Чи підходить сервіс для України та міжнародного ринку?",
    answer:
      "Так. У симуляції можна орієнтуватися на Україну, віддалений формат, міжнародний ринок або локальну роботу за кордоном. Висновок залежить від обраного ринку, ролі, рівня досвіду та ваших вхідних даних."
  },
  {
    question: "Чи гарантує сервіс роботу або офер?",
    answer:
      "Ні. Сервіс не гарантує офер і не замінює рішення роботодавця. Його задача - допомогти тверезо оцінити перехід, краще підготувати резюме, вакансії й аргументи для співбесід."
  },
  {
    question: "Наскільки точним є прогноз доходу?",
    answer:
      "Прогноз не є обіцянкою конкретної зарплати. Це сценарна оцінка на основі ваших даних, ринку й припущень. Її варто використовувати як орієнтир для рішення, а не як гарантований результат."
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
        <div className="grid gap-2.5 rounded-[1.2rem] border border-[rgba(63,94,255,0.12)] bg-[rgba(238,242,255,0.42)] p-3">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`flex items-center gap-3 rounded-[0.95rem] border px-3 py-2.5 ${
                index === 1
                  ? "border-[rgba(63,94,255,0.18)] bg-white text-[var(--accent-strong)]"
                  : "border-[rgba(24,26,32,0.06)] bg-white/70 text-[var(--text-muted)]"
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${index === 1 ? "bg-[var(--accent)]" : "bg-[rgba(196,204,220,0.9)]"}`} />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className={`h-1.5 rounded-full ${index === 1 ? "w-[76%] bg-[var(--accent)]/70" : "w-[64%] bg-[rgba(190,200,218,0.74)]"}`} />
                <div className={`h-1.5 rounded-full ${index === 1 ? "w-[52%] bg-[var(--accent)]/30" : "w-[44%] bg-[rgba(218,224,236,0.86)]"}`} />
              </div>
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={index === 1 ? "M6 12.5l4 4 8-9" : "M8 12h8"} />
              </svg>
            </div>
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
            <span className="text-[0.9rem] font-semibold text-[var(--text-strong)]">42%</span>
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
            <span className="text-[1.1rem] font-semibold text-[var(--accent-strong)]">70%</span>
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

function FeatureStackCard({ item, index }: { item: FeatureShowcase; index: number }) {
  const cardStyle = {
    "--feature-card-top": `${6.25 + index * 0.62}rem`,
    "--feature-card-z": index + 1
  } as CSSProperties;

  return (
    <article className="feature-stack-card" style={cardStyle}>
      <div className="feature-stack-card-grid">
        <div className="min-w-0">
          <h3 className="break-words font-display text-[1.52rem] font-bold leading-[1.08] tracking-normal text-[var(--text-strong)] [overflow-wrap:anywhere] md:text-[1.86rem]">
            {item.title}
          </h3>

          <div className="mt-5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {item.bullets.map((bullet) => (
              <p key={bullet} className="feature-stack-bullet">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                <span>{bullet}</span>
              </p>
            ))}
          </div>

        </div>

        <div className="feature-stack-preview">
          <FeaturePreview item={item} />
        </div>
      </div>
    </article>
  );
}

type CareerHelpStage = (typeof careerHelpStages)[number];

function CareerStageVisual({ visual }: { visual: CareerHelpStage["visual"] }) {
  if (visual === "scenarios") {
    return (
      <div className="relative h-24 overflow-hidden rounded-[1.25rem] border border-[rgba(67,97,255,0.1)] bg-[linear-gradient(135deg,rgba(67,97,255,0.08),rgba(255,255,255,0.76))] p-3">
        <svg viewBox="0 0 220 72" className="absolute inset-0 h-full w-full" fill="none" aria-hidden="true">
          <path d="M28 44C78 12 116 18 150 44C168 58 186 60 205 45" stroke="rgba(67,97,255,0.28)" strokeWidth="3" strokeLinecap="round" />
          <path d="M28 44C76 34 110 42 148 26C170 17 190 19 205 31" stroke="rgba(20,184,166,0.34)" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <div className="relative z-10 flex h-full items-end justify-between gap-2">
          {["зараз", "ціль", "варіант"].map((item) => (
            <span key={item} className="rounded-full bg-white/80 px-2.5 py-1 text-[0.72rem] font-bold text-[var(--text-strong)] shadow-[0_8px_18px_rgba(35,48,78,0.08)]">
              {item}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (visual === "profile") {
    return (
      <div className="flex h-24 items-center justify-center rounded-[1.25rem] border border-[rgba(20,184,166,0.12)] bg-[linear-gradient(135deg,rgba(240,253,250,0.95),rgba(255,255,255,0.78))]">
        <div className="w-[7rem] rounded-[1rem] bg-white/90 p-3 shadow-[0_18px_38px_rgba(35,48,78,0.12)]">
          <div className="h-2 w-12 rounded-full bg-[rgba(20,184,166,0.25)]" />
          <div className="mt-3 space-y-2">
            <div className="h-1.5 w-full rounded-full bg-[rgba(22,29,43,0.1)]" />
            <div className="h-1.5 w-4/5 rounded-full bg-[rgba(67,97,255,0.22)]" />
            <div className="h-1.5 w-3/5 rounded-full bg-[rgba(20,184,166,0.28)]" />
          </div>
          <div className="mt-3 flex gap-1.5">
            <span className="h-5 flex-1 rounded-full bg-[rgba(67,97,255,0.1)]" />
            <span className="h-5 flex-1 rounded-full bg-[rgba(20,184,166,0.12)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-24 items-center justify-center overflow-hidden rounded-[1.25rem] border border-[rgba(34,197,94,0.12)] bg-[linear-gradient(135deg,rgba(240,253,244,0.95),rgba(255,255,255,0.78))]">
      <div className="relative w-[7.5rem] rotate-[-3deg] rounded-[1rem] bg-white/95 px-3 py-3 shadow-[0_18px_38px_rgba(35,48,78,0.12)]">
        <div className="flex items-center justify-between gap-2">
          <span className="h-2 w-12 rounded-full bg-[rgba(34,197,94,0.28)]" />
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(34,197,94,0.13)] text-[0.78rem] font-black text-[#15803d]">✓</span>
        </div>
        <div className="mt-4 h-1.5 w-full rounded-full bg-[rgba(22,29,43,0.1)]" />
        <div className="mt-2 h-1.5 w-2/3 rounded-full bg-[rgba(34,197,94,0.24)]" />
      </div>
    </div>
  );
}

function CareerHelpSection() {
  return (
    <section className="relative mx-auto mt-12 max-w-[80rem] md:mt-16" aria-labelledby="career-help-title">
      <Reveal>
        <div className="grid min-w-0 gap-7 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-8 xl:gap-10">
          <div className="min-w-0 text-center lg:text-left">
            <p className="text-[0.82rem] font-extrabold uppercase tracking-normal text-[var(--accent-strong)] md:text-[0.88rem]">
              Як Decivio допомагає
            </p>
            <h2 id="career-help-title" className="home-section-heading mx-auto mt-3 max-w-[31rem] lg:mx-0">
              Один маршрут до <span className="home-section-heading-accent">сильнішої заявки</span>
            </h2>
            <p className="mx-auto mt-5 max-w-[30rem] text-[0.98rem] leading-[1.7] text-[var(--text-muted)] md:text-[1.06rem] lg:mx-0">
              Спершу обираєте реалістичний напрям, далі посилюєте профіль і виходите на співбесіди без хаосу.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link href="/simulate" className="btn-primary w-full max-w-[18rem] px-5 py-3 text-center text-[0.92rem] sm:w-auto">
                Побудувати свій маршрут
              </Link>
              <span className="text-[0.9rem] font-semibold text-[var(--text-muted)]">2-3 хвилини</span>
            </div>
          </div>

          <div className="relative min-w-0 overflow-hidden rounded-[2rem] border border-white/75 bg-[linear-gradient(135deg,rgba(248,250,255,0.98),rgba(239,244,255,0.94)_52%,rgba(240,253,250,0.92))] px-4 py-5 shadow-[0_28px_70px_rgba(35,48,78,0.11)] md:px-5 md:py-6 lg:min-h-[34rem]">
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(67,97,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(67,97,255,0.06)_1px,transparent_1px)] bg-[size:54px_54px] opacity-45"
              aria-hidden="true"
            />
            <svg
              viewBox="0 0 760 430"
              className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
              fill="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="career-help-path" x1="62" x2="698" y1="128" y2="124" gradientUnits="userSpaceOnUse">
                  <stop stopColor="rgba(67, 97, 255, 0.72)" />
                  <stop offset="0.52" stopColor="rgba(20, 184, 166, 0.62)" />
                  <stop offset="1" stopColor="rgba(34, 197, 94, 0.72)" />
                </linearGradient>
              </defs>
              <path
                d="M70 146C175 34 286 344 392 246C490 154 530 68 690 132"
                stroke="rgba(255,255,255,0.9)"
                strokeWidth="16"
                strokeLinecap="round"
              />
              <path
                d="M70 146C175 34 286 344 392 246C490 154 530 68 690 132"
                stroke="url(#career-help-path)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="2 18"
              />
            </svg>

            <div className="pointer-events-none absolute left-6 top-6 hidden rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[0.72rem] font-extrabold uppercase tracking-normal text-[var(--text-muted)] shadow-[0_12px_28px_rgba(35,48,78,0.08)] lg:block" aria-hidden="true">
              старт
            </div>
            <div className="pointer-events-none absolute bottom-6 right-6 hidden rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[0.72rem] font-extrabold uppercase tracking-normal text-[#15803d] shadow-[0_12px_28px_rgba(35,48,78,0.08)] lg:block" aria-hidden="true">
              рішення
            </div>

            <div className="relative z-10 grid min-w-0 gap-3 md:grid-cols-3 lg:block lg:min-h-[30rem]">
              {careerHelpStages.map((stage) => (
                <article
                  key={stage.title}
                  className={`relative min-w-0 overflow-hidden rounded-[1.45rem] border border-white/80 bg-white/80 p-4 shadow-[0_18px_42px_rgba(35,48,78,0.12)] backdrop-blur-sm transition-transform duration-200 hover:-translate-y-1 lg:absolute lg:w-[31%] ${stage.positionClass}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-[0.82rem] font-extrabold ${stage.markerClass}`}>
                        {stage.step}
                    </span>
                    <span className="truncate rounded-full border border-[rgba(22,29,43,0.08)] bg-white/75 px-3 py-1 text-[0.72rem] font-extrabold uppercase tracking-normal text-[var(--text-muted)]">
                      {stage.label}
                    </span>
                  </div>

                  <div className="mt-4">
                    <CareerStageVisual visual={stage.visual} />
                  </div>

                  <h3 className="mt-4 break-words font-display text-[1.18rem] font-bold leading-[1.08] tracking-normal text-[var(--text-strong)] [overflow-wrap:anywhere] md:text-[1.28rem]">
                      {stage.title}
                  </h3>
                  <p className="mt-2 text-[0.86rem] font-semibold leading-[1.45] text-[var(--text-muted)]">{stage.caption}</p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {stage.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-[rgba(22,29,43,0.055)] px-2.5 py-1 text-[0.72rem] font-bold text-[var(--text-strong)]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <JsonLd data={homeSoftwareSchema} />
      <JsonLd data={homeFaqSchema} />
      <div className="pb-12 md:pb-16">
        <div className="space-y-10 md:space-y-16">
          <HeroBeforeAfter />

        <section className="py-6 md:py-8">
          <Reveal>
            <div className="surface-panel mx-auto grid max-w-[80rem] overflow-hidden rounded-[1.9rem] sm:grid-cols-3">
              <Link
                href="#reviews"
                className="group flex min-h-[8.2rem] flex-col items-center justify-center gap-3 px-5 py-5 text-center transition-opacity hover:opacity-85 sm:items-start sm:text-left md:min-h-[8.5rem] md:px-7"
              >
                <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                  <div className="flex items-center gap-1" aria-label="Рейтинг 4.5 із 5">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const starNumber = index + 1;
                      const isFull = starNumber <= Math.floor(socialProof.ratingValue);
                      const isHalf = !isFull && starNumber - socialProof.ratingValue <= 0.5;

                      return (
                        <svg key={index} viewBox="0 0 24 24" className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true">
                          <defs>
                            <linearGradient id={`trust-half-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="50%" stopColor="var(--accent)" />
                              <stop offset="50%" stopColor="#eceef3" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.3l-5.8 3.07 1.11-6.47-4.7-4.58 6.49-.94L12 2.5z"
                            fill={isFull ? "var(--accent)" : isHalf ? `url(#trust-half-${index})` : "#eceef3"}
                          />
                        </svg>
                      );
                    })}
                  </div>
                  <span className="font-display text-[1.35rem] font-bold leading-none tracking-normal text-[var(--text-strong)] md:text-[1.6rem]">
                    {socialProof.rating}
                  </span>
                </div>
                <p className="text-[1.03rem] font-semibold text-[var(--text-muted)] md:text-[1.15rem]">
                  {socialProof.reviews} відгуків
                </p>
              </Link>

              <article className="flex min-h-[8.2rem] flex-col items-center justify-center border-t border-[rgba(22,29,43,0.08)] px-5 py-5 text-center sm:items-start sm:border-l sm:border-t-0 sm:text-left md:min-h-[8.5rem] md:px-7">
                <div className="min-w-0">
                  <p className="font-display text-[1.65rem] font-bold leading-none tracking-normal text-[var(--text-strong)] md:text-[1.9rem]">
                    {socialProof.users}
                  </p>
                  <p className="mt-2 max-w-[13rem] text-[1.02rem] font-semibold leading-[1.25] text-[var(--text-muted)] md:text-[1.14rem]">
                    {socialProof.usersCaption}
                  </p>
                </div>
              </article>

              <article className="flex min-h-[8.2rem] flex-col items-center justify-center border-t border-[rgba(22,29,43,0.08)] px-5 py-5 text-center sm:items-start sm:border-l sm:border-t-0 sm:text-left md:min-h-[8.5rem] md:px-7">
                <div className="min-w-0">
                  <p className="font-display text-[1.65rem] font-bold leading-none tracking-normal text-[var(--text-strong)] md:text-[1.9rem]">
                    100%
                  </p>
                  <p className="mt-2 max-w-[13rem] text-[1.02rem] font-semibold leading-[1.25] text-[var(--text-muted)] md:text-[1.14rem]">
                    індивідуальний підхід
                  </p>
                </div>
              </article>
            </div>
          </Reveal>
        </section>

        <section id="career-pains" className="relative py-6 md:py-8">
          <div className="pointer-events-none absolute left-1/2 top-[38%] h-64 w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(63,94,255,0.055)] blur-3xl md:h-80" />
          <div className="relative mx-auto grid w-full max-w-[80rem] min-w-0 gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-6 xl:gap-8">
            <div className="order-2 min-w-0 lg:order-2 lg:sticky lg:top-28 lg:self-start">
              <Reveal className="min-w-0">
                <div className="surface-panel relative w-full min-w-0 overflow-hidden rounded-[2rem] px-5 py-6 text-center sm:text-left md:px-7 md:py-8 lg:px-8 lg:py-9">
                  <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-[rgba(63,94,255,0.08)] blur-3xl" />
                  <h2 className="home-section-heading max-w-full break-words [overflow-wrap:anywhere]">
                    Ми поруч, щоб зробити ваш шлях до нової роботи{" "}
                    <span className="home-section-heading-accent">простішим і результативнішим</span>
                  </h2>
                  <p className="mt-4 max-w-full break-words text-[0.9rem] leading-[1.72] text-[var(--text-muted)] [overflow-wrap:anywhere] md:text-[1.04rem]">
                    За допомогою наших інструментів і практичних підказок ви швидше виходите на співбесіди, краще виглядаєте на ринку
                    та рухаєтесь до карʼєри, яку справді хочете.
                  </p>
                  <div className="mt-6 flex justify-center sm:justify-start">
                    <Link href="/simulate" className="btn-primary w-full max-w-[18rem] px-4 py-3 text-center text-[0.9rem] leading-tight sm:w-auto sm:max-w-full sm:px-7 md:px-8 md:text-[0.94rem]">
                      Отримати прогноз зміни кар’єри
                    </Link>
                  </div>
                </div>
              </Reveal>
            </div>

            <Reveal className="order-1 min-w-0 lg:order-1" delayMs={80}>
              <div className="grid min-w-0 gap-3 md:grid-cols-2 lg:grid-cols-1">
                {painPoints.map((item, index) => (
                  <article
                    key={item.title}
                    className="surface-panel group relative w-full min-w-0 overflow-hidden rounded-[1.55rem] px-4 py-4 md:px-5 md:py-5 lg:min-h-[86px]"
                  >
                    <div className="pointer-events-none absolute -right-10 top-0 h-20 w-32 rounded-full bg-[rgba(63,94,255,0.045)] blur-2xl transition-opacity duration-200 group-hover:opacity-80" />
                    <div className="relative flex items-center gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(63,94,255,0.08)] font-display text-[0.78rem] font-bold text-[var(--accent-strong)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <h3 className="break-words font-display text-[1.08rem] font-bold leading-[1.18] tracking-normal text-[var(--text-strong)] [overflow-wrap:anywhere] md:text-[1.18rem]">
                          {item.title}
                        </h3>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

      </div>

      <section id="features" className="feature-stack-section mx-auto mt-12 max-w-[80rem] md:mt-16">
        <div className="feature-card-stack">
          {featureShowcases.map((item, index) => (
            <FeatureStackCard key={item.title} item={item} index={index} />
          ))}
        </div>
      </section>

      <section className="career-opportunity-section relative mx-auto mt-10 max-w-[80rem] py-8 md:mt-12 md:py-10" aria-labelledby="career-brands-title">
        <Reveal>
          <div className="grid min-w-0 items-center gap-8 lg:grid-cols-[0.98fr_1.02fr] lg:gap-10">
            <div className="relative z-10 min-w-0 text-center lg:text-left">
              <h2 id="career-brands-title" className="home-section-heading mx-auto max-w-[36rem] lg:mx-0">
                Цільтеся в сильні продуктові команди, а не просто в першу{" "}
                <span className="home-section-heading-accent">доступну вакансію</span>
              </h2>
              <p className="mx-auto mt-5 max-w-[35rem] text-[0.98rem] leading-[1.72] text-[var(--text-muted)] md:text-[1.06rem] lg:mx-0">
                Наш сервіс допомагає тверезо оцінити перехід, посилити резюме й підготовку так, щоб претендувати на ролі з кращим рівнем доходу,
                процесів і професійного росту.
              </p>
            </div>

            <div className="career-opportunity-visual" aria-hidden="true">
              <div className="career-target-board">
                <Image
                  src="/graphics/career-target-visual.webp"
                  alt=""
                  width={1400}
                  height={933}
                  sizes="(max-width: 640px) 100vw, (max-width: 1023px) 74vw, 44vw"
                  className="career-target-asset"
                />
              </div>
            </div>
          </div>

          <div className="career-brand-marquee relative mt-7 overflow-hidden py-2 md:mt-8">
            <div className="career-brand-track flex w-max items-center">
              {Array.from({ length: 3 }).map((_, groupIndex) => (
                <div
                  key={groupIndex}
                  className="career-brand-group flex items-center gap-6 md:gap-9"
                  aria-hidden={groupIndex > 0}
                >
                  {careerBrandNames.map((brand) => (
                    <span key={`${brand}-${groupIndex}`} className="career-brand-name">
                      {brand}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <CareerHelpSection />

      <section id="reviews" className="relative mx-auto mt-10 max-w-[80rem] md:mt-12">
        <Reveal>
          <div className="relative">
            <div className="overflow-hidden px-1 pt-4 md:px-2 md:pt-5">
              <div className="reviews-marquee-track flex w-max gap-5">
                {[...reviews, ...reviews].map((review, index) => (
                  <article
                    key={`${review.name}-${index}`}
                    aria-hidden={index >= reviews.length}
                    className="surface-panel relative flex min-h-[345px] w-[22.5rem] flex-none flex-col overflow-hidden rounded-[2rem] px-6 py-6 md:w-[23.5rem]"
                  >
                    <span className="pointer-events-none absolute left-4 top-2 font-display text-[4.6rem] leading-none text-[rgba(74,108,255,0.08)]">
                      “
                    </span>

                    <p className="relative text-[0.97rem] leading-[1.72] text-[var(--text-strong)]">
                      {review.quote}
                    </p>

                    <div className="relative mt-auto flex items-center gap-4 pt-5">
                      <Image
                        src={review.avatar}
                        alt=""
                        aria-hidden="true"
                        width={112}
                        height={112}
                        sizes="56px"
                        className="h-14 w-14 shrink-0 rounded-full object-cover ring-4 ring-white shadow-[0_12px_28px_rgba(35,48,78,0.16)]"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-[1.06rem] font-semibold text-[var(--text-strong)] md:text-[1.12rem]">{review.name}</p>
                        <div className="mt-1.5 flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, starIndex) => {
                            const filled = starIndex < review.rating;

                            return (
                              <svg
                                key={`${review.name}-${index}-${starIndex}`}
                                viewBox="0 0 24 24"
                                className={`h-5 w-5 ${filled ? "fill-[var(--accent)] text-[var(--accent)]" : "fill-[#eceef3] text-[#eceef3]"}`}
                                aria-hidden="true"
                              >
                                <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.3l-5.8 3.07 1.11-6.47-4.7-4.58 6.49-.94L12 2.5z" />
                              </svg>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section id="faq" className="mx-auto mt-16 max-w-[80rem] md:mt-24" aria-label="Часті питання">
        <div className="grid gap-4 md:grid-cols-2">
          {faqItems.map((item, index) => (
            <Reveal key={item.question} delayMs={index * 35}>
              <details className="surface-panel group rounded-[1.8rem] px-5 py-4 md:px-6 md:py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[1.04rem] font-semibold leading-[1.28] tracking-normal text-[var(--text-strong)] marker:hidden [&::-webkit-details-marker]:hidden md:text-[1.12rem]">
                  <span>{item.question}</span>
                  <span className="text-[1.4rem] font-medium text-[var(--accent-strong)] transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 pr-8 text-[0.96rem] leading-[1.72] text-[var(--text-muted)] md:text-[0.99rem]">{item.answer}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="final-cta-section mx-auto mt-16 max-w-[80rem] md:mt-24" aria-labelledby="final-cta-title">
        <Reveal>
          <div className="final-cta-panel">
            <div className="relative z-10 mx-auto flex max-w-[48rem] flex-col items-center text-center">
              <div className="flex items-center gap-1.5" aria-label="Рейтинг 4.5 із 5">
                {Array.from({ length: 5 }).map((_, index) => {
                  const starNumber = index + 1;
                  const isFull = starNumber <= Math.floor(socialProof.ratingValue);
                  const isHalf = !isFull && starNumber - socialProof.ratingValue <= 0.5;

                  return (
                    <svg key={index} viewBox="0 0 24 24" className="h-5 w-5 text-[var(--accent)]" aria-hidden="true">
                      <defs>
                        <linearGradient id={`final-trust-half-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="50%" stopColor="currentColor" />
                          <stop offset="50%" stopColor="rgba(102,112,133,0.24)" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.3l-5.8 3.07 1.11-6.47-4.7-4.58 6.49-.94L12 2.5z"
                        fill={isFull ? "currentColor" : isHalf ? `url(#final-trust-half-${index})` : "rgba(102,112,133,0.24)"}
                      />
                    </svg>
                  );
                })}
                <span className="ml-2 text-[0.94rem] font-semibold text-[var(--text-muted)]">{socialProof.rating} за відгуками користувачів</span>
              </div>

              <p className="mt-7 text-[0.82rem] font-extrabold uppercase tracking-normal text-[var(--accent-strong)] md:text-[0.88rem]">
                Перед тим як вкладати місяці у новий напрям
              </p>
              <h2 id="final-cta-title" className="mt-4 max-w-[42rem] font-display text-[2.12rem] font-extrabold leading-[1.04] tracking-normal text-[var(--text-strong)] sm:text-[2.65rem] md:text-[3.25rem]">
                Перевірте, чи справді окупиться ваша зміна карʼєри
              </h2>
              <p className="mt-6 max-w-[39rem] text-[1rem] font-medium leading-[1.72] text-[var(--text-muted)] md:text-[1.12rem]">
                Decivio покаже ризик-період, потенціал доходу, сильні сторони та перші кроки, щоб ви рухались не навмання,
                а з реалістичним планом.
              </p>

              <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
                <Link href="/simulate" className="final-cta-button">
                  Почати аналіз карʼєри
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <span className="text-[0.9rem] font-semibold text-[var(--text-muted)]">Безкоштовно · 2–3 хвилини</span>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

    </div>
    </>
  );
}

