export type PaidPlanId = "monthly" | "annual";

type PricingPlanDefinition = {
  id: PaidPlanId;
  name: string;
  badge: string;
  description: string;
  monthlyEquivalentUah: number;
  billedNowUah: number;
  billingLabel: string;
  savingsUah: number;
  oldMonthlyEquivalentUah?: number;
  featured: boolean;
};

type PaidFeatureDefinition = {
  title: string;
  description: string;
};

const currencyFormatter = new Intl.NumberFormat("uk-UA");

export function formatUah(value: number) {
  return `${currencyFormatter.format(value)} грн`;
}

export const pricingPlans: PricingPlanDefinition[] = [
  {
    id: "monthly",
    name: "Pro",
    badge: "Для бізнесу, що наймає постійно",
    description: "До 5 активних вакансій, необмежена ШІ-оцінка кандидатів, готові тексти для Work.ua, OLX і Telegram.",
    monthlyEquivalentUah: 990,
    billedNowUah: 990,
    billingLabel: "Щомісячна підписка",
    savingsUah: 0,
    featured: true
  },
  {
    id: "annual",
    name: "Pro на 3 місяці",
    badge: "Сезонний набір",
    description: "Усе з Pro на 90 днів одним платежем — зручно для сезонного або масового набору.",
    monthlyEquivalentUah: 830,
    billedNowUah: 2490,
    billingLabel: "Один платіж на 90 днів",
    savingsUah: 480,
    featured: false
  }
];

export const paidFeatureSections: Array<{
  heading: string;
  items: PaidFeatureDefinition[];
}> = [
  {
    heading: "Найм без HR-відділу",
    items: [
      { title: "Вакансія за 30 секунд", description: "ШІ пише сильний текст оголошення з оплатою, графіком і вимогами." },
      { title: "Розумна анкета", description: "Кандидати відповідають на 4–6 питань з телефону за 2 хвилини." },
      { title: "Рейтинг кандидатів", description: "Кожен відгук отримує оцінку, плюси, ризики і питання для дзвінка." },
      { title: "Фільтри-стоп", description: "Хто не підходить за графіком чи доїздом, автоматично опиняється внизу." }
    ]
  }
];

export const pricingFlowSteps = [
  {
    title: "Спробуйте безкоштовно",
    description: "1 активна вакансія і до 10 оцінених кандидатів без оплати."
  },
  {
    title: "Оберіть формат",
    description: "Щомісячна підписка Pro або 90 днів одним платежем для сезонного набору."
  },
  {
    title: "Наймайте швидше",
    description: "Більше вакансій і необмежена оцінка кандидатів одразу після оплати."
  }
];

export function getPricingPlan(planId: string | null | undefined) {
  return pricingPlans.find((plan) => plan.id === planId) ?? pricingPlans[0];
}

export function getPricingPurchaseHref(planId: PaidPlanId) {
  return `/pricing?checkoutPlan=${planId}`;
}
