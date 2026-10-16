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
    name: "Місячний доступ",
    badge: "Гнучкий старт",
    description: "Для активного пошуку, коли потрібно перевірити кілька вакансій, підготувати подачу і швидко зрозуміти, чи Decivio вам підходить.",
    monthlyEquivalentUah: 899,
    billedNowUah: 899,
    billingLabel: "Щомісячна оплата",
    savingsUah: 0,
    oldMonthlyEquivalentUah: 1299,
    featured: false
  },
  {
    id: "annual",
    name: "90-денний Career Upgrade",
    badge: "Основний план",
    description: "Для реального циклу пошуку: ринкова позиція, перевірка вакансій, підготовка резюме, співбесід і зарплатної аргументації.",
    monthlyEquivalentUah: 733,
    billedNowUah: 2199,
    billingLabel: "Один платіж на 90 днів",
    savingsUah: 498,
    oldMonthlyEquivalentUah: 1299,
    featured: true
  }
];

export const paidFeatureSections: Array<{
  heading: string;
  items: PaidFeatureDefinition[];
}> = [
  {
    heading: "Ринкова позиція",
    items: [
      {
        title: "Порівняння ринків",
        description: "Бачите, де ваш досвід має сильніший фінансовий сенс: в Україні, на міжнародному ринку або в локальній роботі за кордоном."
      },
      {
        title: "Ринковий орієнтир",
        description: "Отримуєте діапазон, потенціал росту й пояснення, за яких умов ця сума виглядає реалістично."
      },
      {
        title: "Сильні сторони та прогалини",
        description: "Розумієте, що вже працює на вашу користь, а що заважає претендувати на кращі умови."
      },
      {
        title: "Наступна дія",
        description: "Після діагнозу бачите, що робити далі: перевірити вакансію, посилити резюме або підготувати salary story."
      }
    ]
  },
  {
    heading: "Вакансії і подача",
    items: [
      {
        title: "Vacancy Fit",
        description: "Вставляєте вакансію і бачите, чи варто подаватися, які є ризики і як виглядає відповідність профілю."
      },
      {
        title: "Резюме під вакансію",
        description: "Отримуєте конкретні акценти: що підсвітити, які докази додати і що переписати перед подачею."
      },
      {
        title: "Пріоритети перед відгуком",
        description: "Не витрачаєте час на випадкові ролі: Decivio показує, де подача має сенс, а де краще шукати ближчу вакансію."
      },
      {
        title: "Наступний крок",
        description: "Після аналізу отримуєте дію: подаватися, спочатку адаптувати резюме або пропустити вакансію."
      }
    ]
  },
  {
    heading: "Співбесіда і зарплата",
    items: [
      {
        title: "Salary angle",
        description: "Формуєте зарплатну позицію не як бажання, а як аргумент під роль, відповідальність і ваш досвід."
      },
      {
        title: "Talking points",
        description: "Отримуєте тези для рекрутера і hiring manager: як пояснити релевантність, ризики й очікування."
      },
      {
        title: "Offer decision пізніше",
        description: "Оцінка оферу лишається наступним шаром продукту після того, як вакансії й подача доведуть повторне використання."
      }
    ]
  }
];

export const pricingFlowSteps = [
  {
    title: "Спочатку безкоштовний висновок",
    description: "Людина проходить оцінку кар'єрної позиції без оплати, щоб побачити, чи сервіс корисний саме для її ситуації."
  },
  {
    title: "Потім формат доступу",
    description: "На тарифах обирається гнучкий місяць або основний 90-денний план під реальний цикл пошуку."
  },
  {
    title: "Після оплати відкривається кабінет",
    description: "Результат зберігається за акаунтом, а в кабінеті відкривається Vacancy Fit і практична підготовка подачі."
  }
];

export function getPricingPlan(planId: string | null | undefined) {
  return pricingPlans.find((plan) => plan.id === planId) ?? pricingPlans[0];
}

export function getPricingPurchaseHref(planId: PaidPlanId) {
  return `/pricing?checkoutPlan=${planId}`;
}
