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
    description: "Повний доступ з помісячною оплатою. Підійде, якщо хочете пройти активний цикл підготовки без довгого зобов'язання одразу.",
    monthlyEquivalentUah: 799,
    billedNowUah: 799,
    billingLabel: "Щомісячна оплата",
    savingsUah: 0,
    oldMonthlyEquivalentUah: 1599,
    featured: false
  },
  {
    id: "annual",
    name: "Річний доступ",
    badge: "Найкраща ціна",
    description: "Той самий повний набір інструментів на 12 місяців одним платежем і з найнижчою ціною в перерахунку на місяць.",
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
        title: "Порівняння сценаріїв переходу",
        description: "Порівнюєте кілька напрямів і бачите, де вища окупність, нижчий ризик і реалістичніший темп входу."
      },
      {
        title: "Прогноз доходу та ризик-період",
        description: "Оцінюєте не лише стартову зарплату, а просадку, період окупності й потенціал доходу в часі."
      },
      {
        title: "Модель робочого дня в новій ролі",
        description: "Розумієте типові задачі, ритм комунікації, навантаження й очікування від ролі до того, як вкладати час."
      },
      {
        title: "Оцінка пропозиції роботи",
        description: "Перевіряєте, чи новий офер справді вигідний для вашої ситуації, а не лише виглядає кращим на папері."
      }
    ]
  },
  {
    heading: "Підготовка до переходу",
    items: [
      {
        title: "План переходу 30/60/90",
        description: "Отримуєте структуру дій на перші місяці: що закрити спочатку, що відкласти і як рухатися без хаосу."
      },
      {
        title: "Резюме під цільову роль",
        description: "Перепаковуєте досвід під конкретну роль або вакансію, щоб рекрутер швидше побачив вашу релевантність."
      },
      {
        title: "Підготовка до співбесід",
        description: "Готуєте відповіді під розмову з рекрутером, hiring manager і професійну частину співбесіди."
      },
      {
        title: "Сильні сторони та прогалини",
        description: "Бачите, що вже можна продавати як перевагу, а які слабкі місця краще закрити перед активними відгуками."
      }
    ]
  },
  {
    heading: "Робота з вакансіями",
    items: [
      {
        title: "Перевірка відповідності вакансії",
        description: "Швидко бачите, наскільки ваш досвід збігається з вимогами конкретної вакансії і що заважає відгукнутися зараз."
      },
      {
        title: "Пріоритети перед відгуком",
        description: "Отримуєте список того, що варто підтягнути першим, щоб не витрачати час на слабкі або зарані невідповідні вакансії."
      },
      {
        title: "Адаптація резюме під вакансію",
        description: "Підлаштовуєте акценти резюме під вимоги конкретної ролі, а не надсилаєте один і той самий файл усюди."
      }
    ]
  }
];

export const pricingFlowSteps = [
  {
    title: "Обираєте формат доступу",
    description: "На сторінці цін ви одразу вирішуєте, що підходить саме вам: помісячна оплата чи рік за вигіднішою ціною."
  },
  {
    title: "Потім акаунт",
    description: "Перед оплатою ми просимо увійти або зареєструватися, щоб закріпити доступ саме за вашим профілем."
  },
  {
    title: "Після цього оплата й доступ",
    description: "Після успішної оплати відкривається весь платний набір інструментів без окремих доплат за модулі."
  }
];

export function getPricingPlan(planId: string | null | undefined) {
  return pricingPlans.find((plan) => plan.id === planId) ?? pricingPlans[0];
}

export function getCheckoutHref(planId: PaidPlanId) {
  return `/checkout?plan=${planId}`;
}
