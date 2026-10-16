import type { DashboardNavItem } from "./types";
import { BriefcaseIcon, HomeIcon, RouteIcon } from "./icons";

export const dashboardNavItems: DashboardNavItem[] = [
  {
    view: "overview",
    label: "Головна",
    helper: "Діагноз, фокус і наступна дія.",
    icon: <HomeIcon />,
  },
  {
    view: "market",
    label: "Позиція",
    helper: "Ринок, дохід, ризик і напрям.",
    icon: <RouteIcon />,
  },
  {
    view: "vacancies",
    label: "Вакансії",
    helper: "Fit score, ризики і подача.",
    icon: <BriefcaseIcon />,
  },
];

