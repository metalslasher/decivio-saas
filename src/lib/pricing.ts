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
    description: "Повний доступ без довгого зобов'язання. Зручно, якщо хочете зайти в роботу поступово й оплатити лише поточний місяць.",
    monthlyEquivalentUah: 799,
    billedNowUah: 799,
    billingLabel: "Оплата щомісяця",
    savingsUah: 0,
    oldMonthlyEquivalentUah: 1599,
    featured: false
  },
  {
    id: "annual",
    name: "Річний доступ",
    badge: "Найкраща ціна",
    description: "Той самий повний набір інструментів, але значно дешевше в перерахунку на місяць і без щомісячного продовження.",
    monthlyEquivalentUah: 399,
    billedNowUah: 4788,
    billingLabel: "Один платіж на 12 місяців",
    savingsUah: 4800,
    oldMonthlyEquivalentUah: 1599,
    featured: true
  }
];

export const paidFeatureSections: Array<{
  heading: string;
  items: PaidFeatureDefinition[];
}> = [
  {
    heading: "Аналітика переходу",
    items: [
      {
        title: "Порівняння кількох сценаріїв",
        description: "Дивитесь не один варіант, а кілька маршрутів переходу з різним темпом і рівнем ризику."
      },
      {
        title: "Модель робочого дня в новій ролі",
        description: "Бачите, як реально виглядає ритм, навантаження і формат відповідальності в новому напрямі."
      },
      {
        title: "Оцінка пропозиції роботи",
        description: "Перевіряєте, чи новий офер справді вигідний саме для вашої ситуації, а не лише на папері."
      }
    ]
  },
  {
    heading: "Підготовка до переходу",
    items: [
      {
        title: "План переходу 30/60/90",
        description: "Отримуєте чітку структуру кроків, щоб рухатися до першого відгуку, співбесіди та оферу."
      },
      {
        title: "Резюме під цільову роль",
        description: "Перепаковуєте досвід під конкретну роль або вакансію, а не надсилаєте універсальне CV."
      },
      {
        title: "Підготовка до співбесід",
        description: "Тренуєте відповіді під цільову роль, розмову з рекрутером і професійну частину."
      }
    ]
  },
  {
    heading: "Робота з вакансіями",
    items: [
      {
        title: "Перевірка відповідності вакансії",
        description: "Швидко бачите, наскільки ви збігаєтесь із конкретною вакансією і що заважає відгукнутись уже зараз."
      }
    ]
  }
];

export const pricingFlowSteps = [
  {
    title: "Спочатку безкоштовний висновок",
    description: "Людина проходить симуляцію і отримує персоналізований результат ще до оплати."
  },
  {
    title: "Потім акаунт",
    description: "Коли натискає на оформлення, ми просимо увійти або зареєструватися, щоб закріпити доступ за профілем."
  },
  {
    title: "Після цього оплата й доступ",
    description: "На наступному етапі підключається mono checkout, після успішної оплати відкривається весь платний набір."
  }
];

export function getPricingPlan(planId: string | null | undefined) {
  return pricingPlans.find((plan) => plan.id === planId) ?? pricingPlans[0];
}

export function getCheckoutHref(planId: PaidPlanId) {
  return `/checkout?plan=${planId}`;
}
