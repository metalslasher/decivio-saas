import { JsonLd } from "@/components/json-ld";
import { SimulateOnboardingWizard } from "@/components/simulate-onboarding-wizard";
import { createBreadcrumbSchema, createMetadata, createSoftwareApplicationSchema } from "@/lib/seo";

const analysisSignals = [
  "поточний чистий дохід як стартова фінансова точка",
  "поточна роль, досвід і реалістичний рівень на ринку",
  "цільова роль та близькість вашого досвіду до неї",
  "англійська, цільовий ринок і ваш головний пріоритет"
] as const;

const outcomeCards = [
  {
    title: "Прогноз доходу",
    description: "Бачите стартову вилку, потенційну стелю ролі та різницю між поточним і цільовим напрямом."
  },
  {
    title: "Оцінка ризику переходу",
    description: "Результат підсвічує ризиковий період, час до першої пропозиції та реалістичність входу у нову роль."
  },
  {
    title: "Що робити далі",
    description: "Після висновку ви бачите наступний крок, а Decivio може допомогти з резюме, планом, вакансіями й підготовкою до співбесід."
  }
] as const;

export const metadata = createMetadata({
  title: "Симуляція",
  description:
    "Введіть дохід, роль, досвід і цільовий напрям, щоб отримати прогноз, ризики переходу та наступний крок.",
  path: "/simulate",
  keywords: [
    "симулятор зміни кар'єри",
    "калькулятор кар'єрного переходу",
    "безкоштовний аналіз зміни професії",
    "прогноз зарплати після зміни ролі"
  ]
});

const simulateSchemas = [
  createBreadcrumbSchema([
    { name: "Головна", path: "/" },
    { name: "Симулятор зміни кар'єри", path: "/simulate" }
  ]),
  createSoftwareApplicationSchema({
    path: "/simulate",
    description:
      "Інтерактивний симулятор зміни кар'єри від Decivio, який прогнозує дохід, оцінює ризики та допомагає порівняти сценарії переходу.",
    featureList: ["Прогноз доходу", "Оцінка ризику переходу", "Шанс оферу", "Наступні кроки після симуляції"]
  })
];

export default function SimulatePage() {
  return (
    <>
      <JsonLd data={simulateSchemas} />
      <div className="space-y-8 md:space-y-10">
        <SimulateOnboardingWizard />

        <section className="grid gap-5 pb-4 md:gap-6 md:pb-8 lg:grid-cols-[0.95fr,1.05fr]">
          <article className="surface-panel rounded-[2.2rem] px-6 py-6 md:px-8 md:py-8">
            <span className="eyebrow-pill">Що враховуємо</span>
            <h2 className="section-title mt-4 max-w-2xl">
              Аналіз дивиться не лише на бажану зарплату.
            </h2>
            <p className="body-copy mt-4 max-w-2xl">
              Щоб висновок був корисним для реального рішення, Decivio враховує комбінацію факторів, які впливають на швидкість входу,
              ризики, потенціал нового напряму та практичні кроки після результату.
            </p>

            <ul className="mt-5 space-y-3 text-[0.95rem] leading-[1.72] text-[var(--text-muted)]">
              {analysisSignals.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <div className="grid gap-4">
            {outcomeCards.map((item) => (
              <article key={item.title} className="surface-panel rounded-[1.9rem] px-5 py-5 md:px-6 md:py-6">
                <h2 className="panel-title">{item.title}</h2>
                <p className="body-copy mt-3">{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
