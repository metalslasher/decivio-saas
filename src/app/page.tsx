import Link from "next/link";
import type { ReactNode } from "react";
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
    title: "Хочете змінити сферу, але не бачите безпечного маршруту",
    description: "Замість випадкових порад ви отримуєте напрям, оцінку ризиків та зрозумілу послідовність дій."
  },
  {
    title: "Не розумієте, чи окупиться перехід",
    description: "Наш сервіс показує прогноз доходу й допомагає оцінити рішення не лише по стартовій зарплаті."
  },
  {
    title: "Складно обрати між кількома ролями",
    description: "Порівнюєте сценарії й бачите, де більше потенціалу саме для вашого досвіду та цілей."
  },
  {
    title: "Є страх втратити темп або гроші на старті",
    description: "Бачите ризиковий період і розумієте, який запас часу та ресурсів краще закласти."
  },
  {
    title: "Втомилися від хаотичних порад",
    description: "Отримуєте не мотиваційні фрази, а практичний план переходу з конкретними пріоритетами."
  },
  {
    title: "Не знаєте, як виглядати сильніше для рекрутера",
    description: "Сервіс підказує, що посилити в резюме, підготовці та аргументах під цільову роль."
  },
  {
    title: "Сумніваєтесь, чи вистачить вашого досвіду",
    description: "Розумієте, які сильні сторони вже можна використати, а які прогалини варто закрити першими."
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
    question: "Що доступно безкоштовно, а що входить у платний доступ?",
    answer:
      "Безкоштовно ви можете швидко перевірити, чи є сенс рухатись глибше. Платний доступ відкриває детальні сценарії, резюме під цільову роль, підготовку до співбесід, перевірку вакансій і покроковий план."
  },
  {
    question: "Скільки часу займає симуляція?",
    answer:
      "Базову симуляцію можна пройти за 2–3 хвилини. Після цього ви одразу бачите висновок і можете вирішити, чи потрібна глибша підготовка."
  },
  {
    question: "Чи підійде сервіс, якщо в мене ще немає досвіду в новій ролі?",
    answer:
      "Так. Сервіс враховує, чи є у вас практичний або базовий досвід, і показує, наскільки реалістичним виглядає вхід саме з вашої поточної точки."
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
  },
  {
    question: "Що відбувається з моїми даними?",
    answer:
      "Дані використовуються для формування вашого кар'єрного висновку та персоналізованих рекомендацій. Ви не вводите платіжні дані під час безкоштовної симуляції, а деталі обробки описані в політиці конфіденційності."
  },
  {
    question: "Кому сервіс може не підійти?",
    answer:
      "Якщо вам потрібна гарантія працевлаштування, готова вакансія або рішення замість вас, сервіс цього не дає. Він корисний тоді, коли ви хочете краще оцінити варіанти і підготуватися до переходу."
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

export default function HomePage() {
  return (
    <>
      <JsonLd data={homeSoftwareSchema} />
      <JsonLd data={homeFaqSchema} />
      <div className="pb-10">
        <div className="space-y-8 md:space-y-12">
          <HeroBeforeAfter />

        <section className="py-5 md:py-7">
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
                  <span className="font-display text-[1.35rem] font-bold leading-none tracking-[-0.035em] text-[var(--text-strong)] md:text-[1.6rem]">
                    {socialProof.rating}
                  </span>
                </div>
                <p className="text-[1.03rem] font-semibold text-[var(--text-muted)] md:text-[1.15rem]">
                  {socialProof.reviews} відгуків
                </p>
              </Link>

              <article className="flex min-h-[8.2rem] flex-col items-center justify-center border-t border-[rgba(22,29,43,0.08)] px-5 py-5 text-center sm:items-start sm:border-l sm:border-t-0 sm:text-left md:min-h-[8.5rem] md:px-7">
                <div className="min-w-0">
                  <p className="font-display text-[1.65rem] font-bold leading-none tracking-[-0.04em] text-[var(--text-strong)] md:text-[1.9rem]">
                    {socialProof.users}
                  </p>
                  <p className="mt-2 max-w-[13rem] text-[1.02rem] font-semibold leading-[1.25] text-[var(--text-muted)] md:text-[1.14rem]">
                    {socialProof.usersCaption}
                  </p>
                </div>
              </article>

              <article className="flex min-h-[8.2rem] flex-col items-center justify-center border-t border-[rgba(22,29,43,0.08)] px-5 py-5 text-center sm:items-start sm:border-l sm:border-t-0 sm:text-left md:min-h-[8.5rem] md:px-7">
                <div className="min-w-0">
                  <p className="font-display text-[1.65rem] font-bold leading-none tracking-[-0.04em] text-[var(--text-strong)] md:text-[1.9rem]">
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

        <section id="career-pains" className="relative py-4 md:py-6">
          <div className="pointer-events-none absolute left-1/2 top-[38%] h-64 w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(63,94,255,0.055)] blur-3xl md:h-80" />
          <div className="relative mx-auto grid w-full max-w-[80rem] min-w-0 gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-6 xl:gap-8">
            <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
              <Reveal className="min-w-0">
                <div className="surface-panel relative w-full min-w-0 overflow-hidden rounded-[2rem] px-5 py-6 text-center sm:text-left md:px-7 md:py-8 lg:px-8 lg:py-9">
                  <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-[rgba(63,94,255,0.08)] blur-3xl" />
                  <h2 className="max-w-full break-words font-display text-[1.18rem] font-bold leading-[1.2] tracking-[-0.03em] text-[var(--text-strong)] [overflow-wrap:anywhere] sm:text-[1.5rem] md:text-[2rem] lg:text-[2.25rem]">
                    Ми поруч, щоб зробити ваш шлях до нової роботи{" "}
                    <span className="text-[var(--accent-strong)]">простішим і результативнішим</span>.
                  </h2>
                  <p className="mt-4 max-w-full break-words text-[0.9rem] leading-[1.72] text-[var(--text-muted)] [overflow-wrap:anywhere] md:text-[1.04rem]">
                    За допомогою наших інструментів і практичних підказок ви швидше виходите на співбесіди, краще виглядаєте на ринку
                    та рухаєтесь до карʼєри, яку справді хочете.
                  </p>
                  <div className="mt-6 flex justify-center sm:justify-start">
                    <Link href="/simulate" className="btn-primary w-full max-w-[18rem] px-4 py-3 text-center text-[0.82rem] leading-tight sm:w-auto sm:max-w-full sm:px-7 md:px-8 md:text-[0.94rem]">
                      Отримати прогноз зміни кар’єри
                    </Link>
                  </div>
                </div>
              </Reveal>
            </div>

            <Reveal className="min-w-0" delayMs={80}>
              <div className="grid min-w-0 gap-3 md:grid-cols-2 lg:grid-cols-1">
                {painPoints.map((item, index) => (
                  <article
                    key={item.title}
                    className="surface-panel group relative w-full min-w-0 overflow-hidden rounded-[1.55rem] px-4 py-4 md:px-5 md:py-5 lg:min-h-[116px]"
                  >
                    <div className="pointer-events-none absolute -right-10 top-0 h-20 w-32 rounded-full bg-[rgba(63,94,255,0.045)] blur-2xl transition-opacity duration-200 group-hover:opacity-80" />
                    <div className="relative flex gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(63,94,255,0.08)] font-display text-[0.78rem] font-bold text-[var(--accent-strong)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <h3 className="break-words font-display text-[1.08rem] font-bold leading-[1.18] tracking-[-0.025em] text-[var(--text-strong)] [overflow-wrap:anywhere] md:text-[1.18rem]">
                          {item.title}
                        </h3>
                        <p className="mt-2 break-words text-[0.9rem] leading-[1.62] text-[var(--text-muted)] [overflow-wrap:anywhere] md:text-[0.95rem]">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <section className="career-opportunity-section relative mx-auto max-w-[80rem] overflow-hidden py-7 md:py-10" aria-labelledby="career-brands-title">
          <Reveal>
            <div className="grid min-w-0 items-center gap-8 lg:grid-cols-[0.98fr_1.02fr] lg:gap-10">
              <div className="relative z-10 min-w-0 text-center lg:text-left">
                <h2 id="career-brands-title" className="font-display text-[2rem] font-extrabold leading-[1.04] tracking-normal text-[var(--text-strong)] sm:text-[2.6rem] md:text-[3.15rem] lg:text-[3.45rem]">
                  Цільтеся в сильні продуктові команди, а не просто в першу{" "}
                  <span className="career-opportunity-accent">доступну вакансію</span>
                </h2>
                <p className="mx-auto mt-5 max-w-[35rem] text-[0.98rem] leading-[1.72] text-[var(--text-muted)] md:text-[1.06rem] lg:mx-0">
                  Наш сервіс допомагає тверезо оцінити перехід, посилити резюме й підготовку так, щоб претендувати на ролі з кращим рівнем доходу,
                  процесів і професійного росту.
                </p>
              </div>

              <div className="career-opportunity-visual" aria-hidden="true">
                <div className="career-target-board">
                  <div className="career-target-rings">
                    <span className="career-target-center" />
                    <svg viewBox="0 0 320 320" className="career-target-dart" fill="none">
                      <path className="career-target-dart-shadow" d="M262 58L166 154" />
                      <path className="career-target-dart-shaft" d="M258 62L163 157" />
                      <path className="career-target-dart-head" d="M146 174l17-38 23 23-40 15z" />
                      <path className="career-target-dart-tail" d="M258 62l2-42 38-3-4 35 35-4-3 38-42 2" />
                      <path className="career-target-dart-tail-line" d="M258 62l26 26" />
                    </svg>
                  </div>

                  <div className="career-floating-bubble career-floating-bubble--growth">
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M4.5 15.5l5.2-5.2 3.4 3.4 6.4-7.2" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M15.5 6.5h4v4" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  <div className="career-floating-bubble career-floating-bubble--star">
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 3.8l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8L12 3.8z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
                    </svg>
                  </div>

                  <div className="career-floating-bubble career-floating-bubble--team">
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M8.6 11.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM3.6 18.8c.5-2.8 2.4-4.5 5-4.5s4.5 1.7 5 4.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                      <path d="M15.5 11.3a2.7 2.7 0 1 0 0-5.4M17.1 14.4c2 .5 3.3 2 3.7 4.4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                    </svg>
                  </div>

                  <div className="career-opportunity-note">
                    <span className="career-opportunity-note-icon">
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M4.5 15.5l5.2-5.2 3.4 3.4 6.4-7.2" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M15.5 6.5h4v4" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="career-opportunity-note-copy">
                      <span>Кращі команди.</span>
                      <span>Кращі процеси.</span>
                      <span>Кращі можливості.</span>
                    </span>
                    <span className="career-opportunity-note-progress" />
                  </div>
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

      </div>

      <section id="features" className="mx-auto mt-8 max-w-[80rem] space-y-8 md:mt-10 md:space-y-10">
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

      <section id="reviews" className="relative mx-auto mt-10 max-w-[80rem] md:mt-14">
        <Reveal>
          <div className="relative">
            <div className="overflow-hidden px-1 pt-8 md:px-2 md:pt-10">
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

      <section id="faq" className="mx-auto mt-16 max-w-[80rem] md:mt-24">
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

