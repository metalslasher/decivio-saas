import { JsonLd } from "@/components/json-ld";
import { SimulateOnboardingWizard } from "@/components/simulate-onboarding-wizard";
import { createBreadcrumbSchema, createMetadata, createSoftwareApplicationSchema } from "@/lib/seo";

const analysisSignals = [
  "поточний дохід як стартова точка",
  "ринок, на якому ви працюєте або хочете працювати",
  "роль, стаж і рівень самостійності",
  "бажаний дохід та причина зміни",
  "англійська, стан пошуку й готовність резюме"
] as const;

const outcomeCards = [
  {
    title: "Ринкова позиція",
    description: "Бачите, як ваш дохід і профіль виглядають відносно ролі, рівня й ринку."
  },
  {
    title: "Оцінка ринку",
    description: "Розумієте, чи варто лишатися в поточному ринку, дивитися міжнародні можливості або локальну роботу за кордоном."
  },
  {
    title: "Наступний крок",
    description: "Отримуєте першу практичну підказку: що перевірити, посилити або підготувати перед активними відгуками."
  }
] as const;

export const metadata = createMetadata({
  title: "Оцінка кар'єрної позиції",
  description:
    "Пройдіть коротку оцінку доходу, ролі, досвіду, ринку й готовності профілю, щоб отримати перший висновок про потенціал росту та наступний крок.",
  path: "/simulate",
  keywords: [
    "оцінка зарплати",
    "перевірити зарплату",
    "аналіз ринку праці",
    "безкоштовна оцінка зарплати",
    "прогноз зарплати"
  ]
});

const simulateSchemas = [
  createBreadcrumbSchema([
    { name: "Головна", path: "/" },
    { name: "Оцінка кар'єрної позиції", path: "/simulate" }
  ]),
  createSoftwareApplicationSchema({
    path: "/simulate",
    description:
      "Коротка оцінка кар'єрної позиції, яка показує потенціал кращих умов, основні ризики та напрям для наступного кроку.",
    featureList: ["Ринкова позиція", "Оцінка ринку", "Стан пошуку", "Наступні практичні кроки"]
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
              Оцінка враховує не тільки бажаний дохід.
            </h2>
            <p className="body-copy mt-4 max-w-2xl">
              Щоб висновок був корисним для реального рішення, потрібна комбінація факторів: ваш ринок, досвід, готовність профілю,
              англійська, стан пошуку й те, наскільки обґрунтованою виглядає ціль.
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
