import { JsonLd } from "@/components/json-ld";
import { SimulateOnboardingWizard } from "@/components/simulate-onboarding-wizard";
import { createBreadcrumbSchema, createMetadata, createSoftwareApplicationSchema } from "@/lib/seo";

const analysisSignals = [
  "поточний чистий дохід як стартова фінансова точка",
  "ринок, на якому ви працюєте зараз",
  "поточна роль, стаж і реальний рівень у ролі",
  "головна ціль і бажаний дохід для наступного переходу",
  "англійська, стан пошуку й готовність резюме"
] as const;

const outcomeCards = [
  {
    title: "Прогноз доходу",
    description: "Бачите, як ваш дохід виглядає відносно ринку і де може бути простір для сильнішої пропозиції."
  },
  {
    title: "Оцінка ринку",
    description: "Результат підсвічує, чи варто посилювати позицію в Україні, дивитись міжнародний ринок або локальну роботу за кордоном."
  },
  {
    title: "Що відкриється далі",
    description: "Після висновку можна перейти до платного плану, де практична частина допоможе з резюме, вакансіями й підготовкою."
  }
] as const;

export const metadata = createMetadata({
  title: "Оцінка доходу й ринку",
  description:
    "Введіть дохід, роль, досвід і бажаний дохід, щоб отримати прогноз, оцінку ринку та зрозуміти, що може блокувати кращу пропозицію.",
  path: "/simulate",
  keywords: [
    "оцінка зарплати",
    "аналіз ринку праці",
    "безкоштовний аналіз доходу",
    "прогноз зарплати"
  ]
});

const simulateSchemas = [
  createBreadcrumbSchema([
    { name: "Головна", path: "/" },
    { name: "Оцінка доходу й ринку", path: "/simulate" }
  ]),
  createSoftwareApplicationSchema({
    path: "/simulate",
    description:
      "Інтерактивна оцінка доходу й ринку, яка показує потенціал вищої пропозиції, основні ризики та напрям для наступного кроку.",
    featureList: ["Прогноз доходу", "Оцінка ринку", "Стан пошуку", "Наступні практичні кроки"]
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
            <h2 className="section-title max-w-2xl">
              Аналіз дивиться не лише на бажаний дохід.
            </h2>
            <p className="body-copy mt-4 max-w-2xl">
              Щоб висновок був корисним для реального рішення, ми враховуємо комбінацію факторів, які впливають на шанс отримати
              кращу пропозицію: ваш поточний ринок, досвід, готовність профілю, англійську й те, наскільки реалістичною є ціль.
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
