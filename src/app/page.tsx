import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { HeroDemo } from "@/components/landing/hero-demo";
import { PosterDemo } from "@/components/landing/poster-demo";
import { BookingDemo, PhoneApplyDemo, RolesMarquee, TelegramDemo } from "@/components/landing/product-demos";
import { Reveal } from "@/components/reveal";
import { formatUah, pricingPlans } from "@/lib/pricing";
import { seoRoles } from "@/lib/seo-roles";
import { createFaqSchema, createMetadata, createSoftwareApplicationSchema } from "@/lib/seo";

export const metadata = createMetadata({
  title: "ШІ-асистент найму для малого бізнесу",
  description:
    "Опишіть, кого шукаєте, одним реченням — Decivio напише вакансію, збере відгуки через розумну анкету і покаже, кому дзвонити першим.",
  path: "/",
  keywords: ["пошук працівників", "як швидко знайти працівника", "текст вакансії", "найм без HR", "відбір кандидатів"],
});

const pains = [
  {
    icon: "inbox" as const,
    title: "80 відгуків — і жодного підходящого",
    text: "Половина навіть не дочитала вакансію. Ви витрачаєте вечори на перегляд резюме, яких могло й не бути.",
  },
  {
    icon: "phone" as const,
    title: "Дзвоните — а графік не підходить",
    text: "Живе на іншому кінці міста, не може у вихідні, хоче вдвічі більше. З'ясовується вже на п'ятій хвилині розмови.",
  },
  {
    icon: "door" as const,
    title: "Новенький пішов через тиждень",
    text: "Бо очікування не збіглися з реальністю. І все починається спочатку, а зміни закривають ті, хто лишився.",
  },
];

const steps = [
  {
    title: "Опишіть, кого шукаєте",
    text: "Одним реченням, як знайомому: «бариста на Поділ, 2/2, можна без досвіду». Ніяких шаблонів і форм.",
    tag: "30 секунд",
  },
  {
    title: "Отримайте вакансію й анкету",
    text: "ШІ пише сильний текст з оплатою-орієнтиром і складає 4–6 питань-фільтрів. Розміщуєте посилання на Work.ua, OLX, у Telegram.",
    tag: "Готово до публікації",
  },
  {
    title: "Дзвоніть тим, хто зверху",
    text: "Кандидати відповідають з телефону за 2 хвилини. Кожен отримує оцінку, плюси, ризики та питання для дзвінка.",
    tag: "Рейтинг кандидатів",
  },
];

const roles = [
  "Бариста",
  "Кухар",
  "Офіціант",
  "Продавець-консультант",
  "Касир",
  "Кур'єр",
  "Водій категорії C",
  "Комплектувальник",
  "Вантажник",
  "Будівельник",
  "Електрик",
  "Зварювальник",
  "Адміністратор",
  "Оператор кол-центру",
  "Менеджер з продажу",
  "Майстер манікюру",
  "Прибиральник",
  "Охоронець",
];

const faqItems = [
  {
    question: "Мені потрібно відмовлятися від Work.ua чи OLX?",
    answer:
      "Ні. Decivio працює поверх майданчиків: ви розміщуєте вакансію там, де звикли, але кандидати відгукуються через коротку анкету, а ви отримуєте впорядкований список замість хаосу в повідомленнях.",
  },
  {
    question: "Кандидатам треба реєструватися або мати резюме?",
    answer:
      "Ні. Анкета відкривається за посиланням з будь-якого телефону, займає до 2 хвилин і не вимагає резюме. Тому відгукуються й ті, хто ніколи не писав резюме.",
  },
  {
    question: "ШІ сам відмовляє кандидатам?",
    answer:
      "Ні. ШІ лише впорядковує кандидатів і пояснює чому. Рішення завжди за вами: ви бачите всі відповіді та можете подзвонити будь-кому.",
  },
  {
    question: "Чи не буде ШІ дискримінувати кандидатів?",
    answer:
      "Ми забороняємо ШІ питати та оцінювати вік, стать, сімейний стан, здоров'я, національність чи зовнішність. Оцінка — лише за умовами роботи та досвідом.",
  },
  {
    question: "Як працює Telegram-бот?",
    answer:
      "Кандидати можуть відгукнутися прямо в Telegram — ті самі питання кнопками і номер в один дотик. А вам бот надсилає сильних кандидатів одразу з кнопками «Запросити» чи «Відмова».",
  },
  {
    question: "Звідки береться оплата-орієнтир?",
    answer:
      "Якщо ви вказали оплату — використовується вона. Якщо ні — ШІ пропонує реалістичний діапазон для ролі та міста. Це орієнтир, який варто звірити з вашою ситуацією.",
  },
  {
    question: "Скільки це коштує?",
    answer:
      "Перша вакансія і до 10 оцінених кандидатів — безкоштовно. Далі — Pro за 990 грн на місяць або 90 днів одним платежем для сезонного набору.",
  },
];

const homeSoftwareSchema = createSoftwareApplicationSchema({
  path: "/",
  description: "ШІ-асистент найму для малого й середнього бізнесу в Україні.",
  featureList: steps.map((step) => step.title),
  offers: [
    { name: "Безкоштовно", price: 0, description: "1 вакансія і до 10 оцінених кандидатів.", urlPath: "/hire/new" },
    ...pricingPlans.map((plan) => ({ name: plan.name, price: plan.billedNowUah, description: plan.description, urlPath: "/pricing" })),
  ],
});

const homeFaqSchema = createFaqSchema(faqItems);

function PainIcon({ name }: { name: "inbox" | "phone" | "door" }) {
  const paths = {
    inbox: "M4 13l2.5-7h11L20 13M4 13v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5M4 13h4.5l1.5 2.5h4l1.5-2.5H20",
    phone: "M6.6 3.5h2.6l1.3 4-1.9 1.3a11 11 0 0 0 6.6 6.6l1.3-1.9 4 1.3v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z",
    door: "M6 20V5a1 1 0 0 1 1-1h8v16M15 4l3 1.5V20M3.5 20h17M11.5 12h.01",
  } as const;
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d={paths[name]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const showcases = [
  {
    eyebrow: "Для кандидата",
    title: "Відгук за 2 хвилини — з телефона, без резюме",
    text: "Кандидат відкриває посилання з оголошення, відповідає на кілька питань кнопками й залишає номер. Так відгукуються навіть ті, хто ніколи не писав резюме.",
    bullets: ["Працює на будь-якому телефоні", "Одне питання на екран", "Або прямо в Telegram-боті"],
    demo: "apply" as const,
  },
  {
    eyebrow: "Для вас",
    title: "Сильні кандидати — одразу у вашому Telegram",
    text: "Щойно приходить кандидат, якому варто подзвонити першим, бот надсилає картку з оцінкою, плюсами й телефоном. Запросити чи відмовити — однією кнопкою.",
    bullets: ["Оцінка 0–100 і пояснення", "Кнопки «Запросити» / «Відмова»", "Без відкривання сайту"],
    demo: "telegram" as const,
  },
  {
    eyebrow: "Співбесіди",
    title: "Кандидати самі записуються на зручний час",
    text: "Додайте вільні слоти — запрошений кандидат обирає час у Telegram або за посиланням. Ніяких дзвінків туди-сюди, а ви отримуєте підтвердження.",
    bullets: ["Один кандидат — один слот", "Сповіщення про кожен запис", "Посилання для Viber чи SMS"],
    demo: "booking" as const,
  },
  {
    eyebrow: "Офлайн",
    title: "QR-постер для вітрини та каси",
    text: "Половина кандидатів у кав'ярні чи магазині — це ваші ж відвідувачі. Роздрукуйте постер з QR-кодом: скан камерою — і людина вже в анкеті.",
    bullets: ["Готовий A4 за один клік", "Зберігається як PDF", "Веде на ту саму анкету"],
    demo: "poster" as const,
  },
];

export default function HomePage() {
  return (
    <>
      <JsonLd data={homeSoftwareSchema} />
      <JsonLd data={homeFaqSchema} />

      <section className="relative grid grid-cols-1 items-center gap-12 pb-6 pt-8 md:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div className="blob -left-20 top-0 h-72 w-72 bg-[#8fa2ff]" />
        <div className="blob right-0 top-40 h-64 w-64 bg-[#ffd6a5] [animation-delay:-6s]" />

        <div className="fade-up relative min-w-0">
          <span className="eyebrow-pill">
            <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-[var(--good)]" />
            ШІ-асистент найму для малого бізнесу
          </span>
          <h1 className="mt-6 max-w-[14ch] text-[clamp(2.6rem,6.2vw,4.8rem)] font-extrabold leading-[0.98] tracking-[-0.05em] text-[var(--text-strong)]">
            Наймайте людей за{" "}
            <span className="relative inline-block text-[var(--accent)]">
              дні
              <svg viewBox="0 0 120 14" className="absolute -bottom-2 left-0 h-3 w-full text-[var(--accent)] opacity-40" aria-hidden="true">
                <path d="M2 10 C 30 2, 70 2, 118 8" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
              </svg>
            </span>
            , а не тижні
          </h1>
          <p className="lead-copy mt-6 max-w-xl text-[1.08rem]">
            Опишіть, кого шукаєте, одним реченням. Decivio напише вакансію, збере відгуки через розумну анкету чи Telegram-бот і покаже, кому
            дзвонити першим.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/hire/new" className="btn-primary !px-7 !py-4 text-[1rem]">
              Створити вакансію безкоштовно →
            </Link>
            <Link href="/#how" className="btn-secondary !px-7 !py-4 text-[1rem]">
              Як це працює
            </Link>
          </div>
          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-[var(--text-muted)]">
            <li>✓ Без HR-відділу</li>
            <li>✓ Без реєстрації для кандидатів</li>
            <li>✓ Перша вакансія безкоштовно</li>
          </ul>
        </div>

        <div className="relative min-w-0">
          <HeroDemo />
          <div className="toast-pop absolute -right-1 -top-4 hidden w-64 rounded-2xl border border-[var(--line-soft)] bg-white p-3 shadow-[0_24px_50px_-24px_rgba(18,23,38,0.4)] sm:block lg:-right-6">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#2aabee] text-xs text-white">✈</span>
              <p className="text-xs font-extrabold">Telegram · Decivio</p>
              <span className="ml-auto text-[0.65rem] text-[var(--text-soft)]">зараз</span>
            </div>
            <p className="mt-2 text-sm">
              🔥 <b>Олена К.</b> · 91/100 — сильний кандидат на «Бариста»
            </p>
          </div>
        </div>
      </section>

      <section className="py-6">
        <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-soft)]">Наймайте на будь-які лінійні посади</p>
        <RolesMarquee roles={roles} />
      </section>

      <section className="py-14 md:py-20">
        <Reveal>
          <h2 className="section-title max-w-[22ch]">Знайомо? Найм забирає час, якого у власника немає</h2>
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {pains.map((pain, index) => (
            <Reveal key={pain.title} delayMs={index * 90}>
              <div className="card group h-full p-6 transition hover:-translate-y-1">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--bad-soft)] text-[var(--bad)] transition group-hover:scale-110">
                  <PainIcon name={pain.icon} />
                </div>
                <h3 className="mt-4 text-lg font-extrabold leading-snug text-[var(--text-strong)]">{pain.title}</h3>
                <p className="body-copy mt-2">{pain.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="how" className="scroll-mt-24 py-14 md:py-20">
        <Reveal>
          <span className="eyebrow-pill">Як це працює</span>
          <h2 className="section-title mt-4 max-w-[20ch]">Від «треба людина» до списку, кому дзвонити, — за вечір</h2>
        </Reveal>
        <div className="relative mt-10 grid gap-4 lg:grid-cols-3">
          <div className="absolute left-[16%] right-[16%] top-[3.1rem] hidden h-0.5 bg-[linear-gradient(90deg,var(--accent-soft),var(--accent),var(--accent-soft))] lg:block" />
          {steps.map((step, index) => (
            <Reveal key={step.title} delayMs={index * 120}>
              <div className="card relative h-full overflow-hidden p-6 md:p-7">
                <span className="relative z-[1] grid h-11 w-11 place-items-center rounded-full bg-[var(--accent)] text-lg font-extrabold text-white shadow-[0_10px_24px_-10px_rgba(67,97,255,0.7)]">
                  {index + 1}
                </span>
                <span className="chip mt-5">{step.tag}</span>
                <h3 className="mt-3 text-xl font-extrabold text-[var(--text-strong)]">{step.title}</h3>
                <p className="body-copy mt-2">{step.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {showcases.map((item, index) => (
        <section key={item.title} className="py-12 md:py-16">
          <div className={`grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16 ${index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}>
            <Reveal className="min-w-0">
              <span className="eyebrow-pill">{item.eyebrow}</span>
              <h2 className="section-title mt-4 max-w-[18ch]">{item.title}</h2>
              <p className="lead-copy mt-4 max-w-xl">{item.text}</p>
              <ul className="mt-6 space-y-2.5">
                {item.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-3 font-semibold text-[var(--text-strong)]">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--good-soft)] text-xs text-[var(--good)]">✓</span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delayMs={120} className="min-w-0">
              <div className="relative rounded-[2.2rem] bg-[radial-gradient(circle_at_50%_40%,rgba(67,97,255,0.12),transparent_65%)] py-6">
                {item.demo === "apply" ? <PhoneApplyDemo /> : null}
                {item.demo === "telegram" ? <TelegramDemo /> : null}
                {item.demo === "booking" ? <BookingDemo /> : null}
                {item.demo === "poster" ? <PosterDemo /> : null}
              </div>
            </Reveal>
          </div>
        </section>
      ))}

      <section className="py-10">
        <Reveal>
          <div className="card-ink relative grid gap-8 overflow-hidden p-7 md:grid-cols-2 md:p-12">
            <div className="blob -right-10 -top-10 h-56 w-56 bg-[#4361ff] opacity-40" />
            <div className="relative">
              <p className="text-sm font-bold uppercase tracking-wide text-white/50">Без Decivio</p>
              <ul className="mt-4 space-y-3 text-white/75">
                <li>✕ Пишете вакансію з нуля або копіюєте чужу</li>
                <li>✕ Читаєте десятки однакових відгуків</li>
                <li>✕ Дзвоните кожному, щоб дізнатися про графік і доїзд</li>
                <li>✕ Домовляєтесь про час співбесіди в переписці</li>
              </ul>
            </div>
            <div className="relative">
              <p className="text-sm font-bold uppercase tracking-wide text-[#8fa2ff]">З Decivio</p>
              <ul className="mt-4 space-y-3 font-semibold">
                <li>✓ Готова вакансія з оплатою-орієнтиром за 30 секунд</li>
                <li>✓ Фільтри відсіюють невідповідних ще до дзвінка</li>
                <li>✓ Сильні кандидати приходять у ваш Telegram</li>
                <li>✓ Кандидати самі записуються на співбесіду</li>
              </ul>
            </div>
          </div>
        </Reveal>
      </section>

      <section id="roles" className="scroll-mt-24 py-14 md:py-20">
        <Reveal>
          <span className="eyebrow-pill">Для кого</span>
          <h2 className="section-title mt-4 max-w-[24ch]">Для кафе, магазинів, складів, будівництва, сервісу — усіх, хто наймає сам</h2>
          <p className="lead-copy mt-4 max-w-2xl">
            Особливо добре працює для масових і лінійних посад, де кандидатів багато, а резюме — мало.
          </p>
        </Reveal>
        <div className="mt-8 flex flex-wrap gap-2.5">
          {roles.map((role) => (
            <Link
              key={role}
              href={seoRoles.find((item) => item.name === role) ? `/roles/${seoRoles.find((item) => item.name === role)!.slug}` : "/hire/new"}
              className="chip chip-muted !px-4 !py-2 !text-[0.9rem] transition hover:-translate-y-0.5 hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
            >
              {role}
            </Link>
          ))}
        </div>
      </section>

      <section id="pricing" className="scroll-mt-24 py-14 md:py-20">
        <Reveal>
          <span className="eyebrow-pill">Тарифи</span>
          <h2 className="section-title mt-4">Почніть безкоштовно. Платіть, коли наймаєте регулярно</h2>
        </Reveal>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <div className="card flex flex-col p-7">
            <p className="text-lg font-extrabold text-[var(--text-strong)]">Старт</p>
            <p className="mt-3 text-4xl font-extrabold tracking-tight text-[var(--text-strong)]">0 грн</p>
            <p className="body-copy mt-2">Щоб спробувати на реальній вакансії.</p>
            <ul className="mt-5 flex-1 space-y-2 text-sm font-semibold text-[var(--text-strong)]">
              <li>✓ 1 активна вакансія</li>
              <li>✓ До 10 оцінених кандидатів</li>
              <li>✓ Анкета, Telegram-бот, запис на співбесіди</li>
            </ul>
            <Link href="/hire/new" className="btn-secondary mt-7">
              Створити вакансію
            </Link>
          </div>
          {pricingPlans.map((plan) => (
            <div key={plan.id} className={`relative flex flex-col overflow-hidden p-7 ${plan.featured ? "card-ink" : "card"}`}>
              {plan.featured ? <div className="blob -right-16 -top-16 h-48 w-48 bg-[#4361ff] opacity-50" /> : null}
              <div className="relative flex items-center justify-between gap-3">
                <p className="text-lg font-extrabold">{plan.name}</p>
                <span className={`chip ${plan.featured ? "!bg-white/10 !text-white" : ""}`}>{plan.badge}</span>
              </div>
              <p className="relative mt-3 text-4xl font-extrabold tracking-tight">
                {formatUah(plan.billedNowUah)}
                <span className={`text-base font-semibold ${plan.featured ? "text-white/60" : "text-[var(--text-muted)]"}`}>
                  {plan.id === "monthly" ? " / міс" : " / 90 днів"}
                </span>
              </p>
              <p className={`relative mt-2 text-[0.95rem] leading-relaxed ${plan.featured ? "text-white/70" : "text-[var(--text-muted)]"}`}>{plan.description}</p>
              <ul className="relative mt-5 flex-1 space-y-2 text-sm font-semibold">
                <li>✓ До 5 активних вакансій</li>
                <li>✓ Необмежена оцінка кандидатів</li>
                <li>✓ Пріоритетна підтримка</li>
              </ul>
              <Link href={`/pricing?checkoutPlan=${plan.id}`} className={`relative mt-7 ${plan.featured ? "btn-primary" : "btn-secondary"}`}>
                Обрати {plan.name}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 py-14 md:py-20">
        <Reveal>
          <h2 className="section-title">Часті питання</h2>
        </Reveal>
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {faqItems.map((item) => (
            <details key={item.question} className="card group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-extrabold text-[var(--text-strong)]">
                {item.question}
                <span className="text-xl text-[var(--accent)] transition group-open:rotate-45">+</span>
              </summary>
              <p className="body-copy mt-3">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="py-10">
        <Reveal>
          <div className="card relative overflow-hidden p-8 text-center md:p-14">
            <div className="blob -left-10 top-0 h-56 w-56 bg-[#8fa2ff] opacity-40" />
            <div className="blob -right-10 bottom-0 h-56 w-56 bg-[#ffd6a5] opacity-50 [animation-delay:-8s]" />
            <h2 className="section-title relative mx-auto max-w-[20ch]">Потрібна людина вже на цьому тижні?</h2>
            <p className="lead-copy relative mx-auto mt-4 max-w-xl">Створіть вакансію зараз — це займе менше хвилини і нічого не коштує.</p>
            <Link href="/hire/new" className="btn-primary relative mt-8 !px-8 !py-4 text-[1rem]">
              Створити вакансію безкоштовно →
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
