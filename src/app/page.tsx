import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { HeroDemo } from "@/components/landing/hero-demo";
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
    icon: "📥",
    title: "80 відгуків — і жодного підходящого",
    text: "Половина навіть не дочитала вакансію. Ви витрачаєте вечори на перегляд резюме, яких могло й не бути.",
  },
  {
    icon: "📞",
    title: "Дзвоните — а графік не підходить",
    text: "Живе на іншому кінці міста, не може у вихідні, хоче вдвічі більше. З'ясовується вже на п'ятій хвилині розмови.",
  },
  {
    icon: "🚪",
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

export default function HomePage() {
  return (
    <>
      <JsonLd data={homeSoftwareSchema} />
      <JsonLd data={homeFaqSchema} />

      <section className="grid grid-cols-1 items-center gap-12 pb-10 pt-6 md:pt-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div className="fade-up min-w-0">
          <span className="eyebrow-pill">ШІ-асистент найму для малого бізнесу</span>
          <h1 className="mt-6 max-w-[14ch] text-[clamp(2.5rem,6vw,4.6rem)] font-extrabold leading-[0.98] tracking-[-0.05em] text-[var(--text-strong)]">
            Наймайте людей за <span className="text-[var(--accent)]">дні</span>, а не тижні
          </h1>
          <p className="lead-copy mt-6 max-w-xl text-[1.08rem]">
            Опишіть, кого шукаєте, одним реченням. Decivio напише вакансію, збере відгуки через розумну анкету і покаже, кому
            дзвонити першим.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/hire/new" className="btn-primary !px-7 !py-4 text-[1rem]">
              Створити вакансію безкоштовно
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
        <HeroDemo />
      </section>

      <section className="py-14 md:py-20">
        <Reveal>
          <h2 className="section-title max-w-[22ch]">Знайомо? Найм забирає час, якого у власника немає</h2>
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {pains.map((pain, index) => (
            <Reveal key={pain.title} delayMs={index * 90}>
              <div className="card h-full p-6">
                <p className="text-3xl">{pain.icon}</p>
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
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {steps.map((step, index) => (
            <Reveal key={step.title} delayMs={index * 110}>
              <div className="card relative h-full overflow-hidden p-6 md:p-7">
                <span className="absolute -right-2 -top-6 text-[7rem] font-extrabold leading-none text-[rgba(67,97,255,0.06)]">{index + 1}</span>
                <span className="chip">{step.tag}</span>
                <h3 className="mt-5 text-xl font-extrabold text-[var(--text-strong)]">{step.title}</h3>
                <p className="body-copy mt-2">{step.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="py-6">
        <Reveal>
          <div className="card-ink grid gap-8 p-7 md:grid-cols-2 md:p-12">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-white/50">Без Decivio</p>
              <ul className="mt-4 space-y-3 text-white/75">
                <li>✕ Пишете вакансію з нуля або копіюєте чужу</li>
                <li>✕ Читаєте десятки однакових відгуків</li>
                <li>✕ Дзвоните кожному, щоб дізнатися про графік і доїзд</li>
                <li>✕ Забуваєте, кому вже дзвонили</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-[#8fa2ff]">З Decivio</p>
              <ul className="mt-4 space-y-3 font-semibold">
                <li>✓ Готова вакансія з оплатою-орієнтиром за 30 секунд</li>
                <li>✓ Фільтри відсіюють невідповідних ще до дзвінка</li>
                <li>✓ Рейтинг: кому дзвонити першим і що спитати</li>
                <li>✓ Статуси кандидатів в одному місці</li>
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
              className="chip chip-muted !px-4 !py-2 !text-[0.9rem] transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]">
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
              <li>✓ Текст вакансії та анкета</li>
            </ul>
            <Link href="/hire/new" className="btn-secondary mt-7">
              Створити вакансію
            </Link>
          </div>
          {pricingPlans.map((plan) => (
            <div key={plan.id} className={`flex flex-col p-7 ${plan.featured ? "card-ink" : "card"}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-lg font-extrabold">{plan.name}</p>
                <span className={`chip ${plan.featured ? "!bg-white/10 !text-white" : ""}`}>{plan.badge}</span>
              </div>
              <p className="mt-3 text-4xl font-extrabold tracking-tight">
                {formatUah(plan.billedNowUah)}
                <span className={`text-base font-semibold ${plan.featured ? "text-white/60" : "text-[var(--text-muted)]"}`}>
                  {plan.id === "monthly" ? " / міс" : " / 90 днів"}
                </span>
              </p>
              <p className={`mt-2 text-[0.95rem] leading-relaxed ${plan.featured ? "text-white/70" : "text-[var(--text-muted)]"}`}>{plan.description}</p>
              <ul className="mt-5 flex-1 space-y-2 text-sm font-semibold">
                <li>✓ До 5 активних вакансій</li>
                <li>✓ Необмежена оцінка кандидатів</li>
                <li>✓ Пріоритетна підтримка</li>
              </ul>
              <Link href={`/pricing?checkoutPlan=${plan.id}`} className={`mt-7 ${plan.featured ? "btn-primary" : "btn-secondary"}`}>
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
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(40rem_16rem_at_50%_0%,rgba(67,97,255,0.14),transparent)]" />
            <h2 className="section-title mx-auto max-w-[20ch]">Потрібна людина вже на цьому тижні?</h2>
            <p className="lead-copy mx-auto mt-4 max-w-xl">Створіть вакансію зараз — це займе менше хвилини і нічого не коштує.</p>
            <Link href="/hire/new" className="btn-primary mt-8 !px-8 !py-4 text-[1rem]">
              Створити вакансію безкоштовно
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
