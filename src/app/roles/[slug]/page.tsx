import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { Reveal } from "@/components/reveal";
import { createBreadcrumbSchema, createFaqSchema, createMetadata } from "@/lib/seo";
import { getSeoRole, seoRoles } from "@/lib/seo-roles";

type RolePageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return seoRoles.map((role) => ({ slug: role.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: RolePageProps) {
  const { slug } = await params;
  const role = getSeoRole(slug);
  if (!role) return {};

  return createMetadata({
    title: `Як швидко знайти ${role.accusative} у 2026 році`,
    description: `Готовий текст вакансії, питання для відбору і оплата-орієнтир, щоб знайти ${role.accusative} за кілька днів. Створіть вакансію з ШІ безкоштовно.`,
    path: `/roles/${role.slug}`,
    keywords: [`знайти ${role.accusative}`, `вакансія ${role.name.toLowerCase()}`, `як найняти ${role.accusative}`, `зарплата ${role.name.toLowerCase()} 2026`],
  });
}

export default async function RolePage({ params }: RolePageProps) {
  const { slug } = await params;
  const role = getSeoRole(slug);
  if (!role) notFound();

  const builderHref = `/hire/new?brief=${encodeURIComponent(role.brief)}`;
  const faq = [
    {
      question: `Яку зарплату пропонувати на посаду «${role.name}» у 2026 році?`,
      answer: `Орієнтир для великих міст України — ${role.payRange}. У менших містах зазвичай на 15–25% нижче. Через дефіцит кадрів занижена оплата суттєво зменшує кількість відгуків.`,
    },
    {
      question: `Як відсіяти невідповідних кандидатів на посаду «${role.name}» до дзвінка?`,
      answer: `Додайте до вакансії коротку анкету з 4–6 питань-фільтрів: графік, доїзд, ключовий досвід і дата старту. Decivio автоматично опускає вниз тих, хто не проходить обов'язкові умови.`,
    },
  ];

  return (
    <>
      <JsonLd
        data={[
          createBreadcrumbSchema([
            { name: "Головна", path: "/" },
            { name: role.name, path: `/roles/${role.slug}` },
          ]),
          createFaqSchema(faq),
        ]}
      />

      <section className="mx-auto max-w-4xl py-6 md:py-12 fade-up">
        <span className="eyebrow-pill">Найм · {role.name}</span>
        <h1 className="mt-5 text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold leading-[1.02] tracking-[-0.045em] text-[var(--text-strong)]">
          Як швидко знайти {role.accusative}
        </h1>
        <p className="lead-copy mt-5 max-w-2xl">
          Опишіть вакансію одним реченням — Decivio напише текст оголошення, складе анкету з питаннями-фільтрами і покаже, кому з
          кандидатів дзвонити першим.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link href={builderHref} className="btn-primary !px-7 !py-4">
            Створити вакансію «{role.name}» безкоштовно
          </Link>
        </div>
        <p className="mt-3 text-sm text-[var(--text-muted)]">Готовий опис уже підставлено — залишиться натиснути одну кнопку.</p>
      </section>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
        <Reveal>
          <section className="card h-full p-6">
            <h2 className="panel-title">Що заважає найняти {role.accusative}</h2>
            <ul className="mt-4 space-y-2.5 text-[0.95rem] text-[var(--text-strong)]">
              {role.pains.map((pain) => (
                <li key={pain} className="flex gap-2">
                  <span className="text-[var(--bad)]">•</span>
                  <span>{pain}</span>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
        <Reveal delayMs={80}>
          <section className="card h-full p-6">
            <h2 className="panel-title">Оплата-орієнтир</h2>
            <p className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--accent-strong)]">{role.payRange}</p>
            <p className="body-copy mt-2 text-sm">
              Орієнтир для великих міст України у 2026 році. Точну суму Decivio запропонує з урахуванням вашого міста і графіка.
            </p>
          </section>
        </Reveal>
        <Reveal delayMs={120}>
          <section className="card h-full p-6">
            <h2 className="panel-title">Питання-фільтри для анкети</h2>
            <ol className="mt-4 space-y-2.5 text-[0.95rem] text-[var(--text-strong)]">
              {role.questions.map((question, index) => (
                <li key={question} className="flex gap-3">
                  <span className="font-extrabold text-[var(--accent)]">{index + 1}</span>
                  <span>{question}</span>
                </li>
              ))}
            </ol>
          </section>
        </Reveal>
        <Reveal delayMs={160}>
          <section className="card h-full p-6">
            <h2 className="panel-title">Що варто запропонувати</h2>
            <ul className="mt-4 space-y-2.5 text-[0.95rem] text-[var(--text-strong)]">
              {role.offerIdeas.map((offer) => (
                <li key={offer} className="flex gap-2">
                  <span className="text-[var(--good)]">✓</span>
                  <span>{offer}</span>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      </div>

      <section className="mx-auto mt-12 max-w-4xl">
        <h2 className="section-title">Часті питання</h2>
        <div className="mt-6 space-y-3">
          {faq.map((item) => (
            <details key={item.question} className="card group p-5" open>
              <summary className="cursor-pointer list-none font-extrabold text-[var(--text-strong)]">{item.question}</summary>
              <p className="body-copy mt-3">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-4xl">
        <div className="card-ink p-8 text-center md:p-12">
          <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold tracking-tight">Знайдіть {role.accusative} вже цього тижня</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">Перша вакансія і до 10 оцінених кандидатів — безкоштовно.</p>
          <Link href={builderHref} className="btn-primary mt-7">
            Створити вакансію
          </Link>
        </div>
        <p className="mt-8 text-center text-sm text-[var(--text-muted)]">
          Інші посади:{" "}
          {seoRoles
            .filter((other) => other.slug !== role.slug)
            .map((other, index) => (
              <span key={other.slug}>
                {index > 0 ? " · " : ""}
                <Link href={`/roles/${other.slug}`} className="text-link">
                  {other.name}
                </Link>
              </span>
            ))}
        </p>
      </section>
    </>
  );
}
