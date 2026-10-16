import Link from "next/link";
import type { EmployerUsage } from "@/lib/hiring/types";

export function PlanBanner({ usage }: { usage: EmployerUsage | null }) {
  if (!usage || usage.plan === "pro") {
    return null;
  }

  const screenLimit = usage.limits.screenedApplications ?? 0;
  const screenedShare = Math.min(1, usage.screenedApplications / Math.max(1, screenLimit));
  const isExhausted = usage.screenedApplications >= screenLimit;

  return (
    <div className={`card mt-6 flex flex-col gap-4 p-5 md:flex-row md:items-center ${isExhausted ? "border-[rgba(201,138,6,0.35)]" : ""}`}>
      <div className="min-w-0 flex-1">
        <p className="font-extrabold text-[var(--text-strong)]">
          {isExhausted ? "Безкоштовні ШІ-оцінки закінчились" : "Безкоштовний тариф"}
        </p>
        <p className="body-copy mt-1">
          {isExhausted
            ? "Нові кандидати й далі надходять, але без оцінки та рейтингу. Перейдіть на Pro, щоб ШІ оцінював усіх."
            : `Оцінено ${usage.screenedApplications} з ${screenLimit} кандидатів · активних вакансій ${usage.activeVacancies} з ${usage.limits.activeVacancies}`}
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[rgba(22,29,43,0.08)]">
          <div
            className={`h-full rounded-full ${isExhausted ? "bg-[var(--warn)]" : "bg-[var(--accent)]"}`}
            style={{ width: `${screenedShare * 100}%` }}
          />
        </div>
      </div>
      <Link href="/pricing" className={`${isExhausted ? "btn-primary" : "btn-secondary"} !py-2.5 text-sm`}>
        Pro за 990 грн/міс
      </Link>
    </div>
  );
}
