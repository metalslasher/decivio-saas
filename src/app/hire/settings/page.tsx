import { CabinetSettings } from "@/components/hiring/cabinet-settings";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Налаштування",
  description: "Сповіщення та акаунт у Decivio.",
  path: "/hire/settings",
  noIndex: true,
});

export default function SettingsPage() {
  return <CabinetSettings />;
}
