import Link from "next/link";
import { WordmarkLogo } from "@/components/wordmark-logo";
import { DashboardChip } from "./dashboard-primitives";

export function DashboardGuest({ onLogin }: { onLogin: () => void }) {
  return (
    <section className="dashboard-shell-screen dashboard-shell">
      <div className="mx-auto w-full px-4 py-6 md:px-6 xl:px-8">
        <div className="flex items-center py-2">
          <Link href="/" className="inline-flex items-center" aria-label="Decivio">
            <WordmarkLogo className="text-[2.05rem] md:text-[2.2rem]" />
          </Link>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.08fr,0.92fr] xl:items-center">
          <article className="dashboard-spotlight-card rounded-[2.3rem] p-6 md:p-8">
            <DashboardChip tone="accent">Paid workspace</DashboardChip>
            <h1 className="mt-5 max-w-[11ch] text-[2.5rem] font-semibold leading-[0.92] tracking-[-0.055em] text-[var(--text-strong)] md:text-[3.5rem]">
              Кабінет відкривається після оплати.
            </h1>
            <p className="mt-5 max-w-2xl text-[1rem] leading-[1.78] text-[var(--text-muted)]">
              Якщо у вас уже є оплачений акаунт, увійдіть, щоб відкрити робочий
              простір для перевірки вакансій і підготовки подачі. Новий профіль
              створюється під час оформлення оплати.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button type="button" onClick={onLogin} className="btn-secondary">
                Увійти
              </button>
              <Link href="/pricing" className="btn-primary">
                Перейти до тарифів
              </Link>
            </div>
          </article>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              [
                "Позиція",
                "Після оцінки кабінет тримає ваш ринковий діагноз під рукою.",
              ],
              [
                "Вакансії",
                "Головна paid-дія: перевірити вакансію перед подачею.",
              ],
              [
                "Подача",
                "Результат одразу дає resume-правки й аргументи для розмови.",
              ],
              [
                "Доступ",
                "Тариф, оплата й керування акаунтом винесені в окремий сервісний розділ.",
              ],
            ].map(([title, description]) => (
              <article
                key={title}
                className="surface-panel rounded-[1.7rem] p-5"
              >
                <h2 className="text-[1.1rem] font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
                  {title}
                </h2>
                <p className="mt-3 text-[0.94rem] leading-[1.7] text-[var(--text-muted)]">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function DashboardAccessRequired({
  email,
  onSignOut,
  isSigningOut,
}: {
  email: string;
  onSignOut: () => void;
  isSigningOut: boolean;
}) {
  return (
    <section className="dashboard-shell-screen dashboard-shell">
      <div className="mx-auto w-full px-4 py-6 md:px-6 xl:px-8">
        <div className="flex items-center py-2">
          <Link href="/" className="inline-flex items-center" aria-label="Decivio">
            <WordmarkLogo className="text-[2.05rem] md:text-[2.2rem]" />
          </Link>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.08fr,0.92fr] xl:items-center">
          <article className="dashboard-spotlight-card rounded-[2.3rem] p-6 md:p-8">
            <DashboardChip tone="gold">Потрібна оплата</DashboardChip>
            <h1 className="mt-5 max-w-[12ch] text-[2.5rem] font-semibold leading-[0.92] tracking-[-0.055em] text-[var(--text-strong)] md:text-[3.5rem]">
              Кабінет доступний після оплати.
            </h1>
            <p className="mt-5 max-w-2xl text-[1rem] leading-[1.78] text-[var(--text-muted)]">
              Ви увійшли як {email}. Щоб відкрити аналіз вакансій і робочий
              простір подачі, оформіть доступ на сторінці тарифів.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/pricing" className="btn-primary">
                Перейти до тарифів
              </Link>
              <Link href="/simulate" className="btn-secondary">
                Запустити аналіз
              </Link>
              <button
                type="button"
                onClick={onSignOut}
                disabled={isSigningOut}
                className="btn-dark disabled:opacity-60"
              >
                {isSigningOut ? "Виходимо..." : "Вийти"}
              </button>
            </div>
          </article>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              [
                "Профіль перед оплатою",
                "Акаунт створюється тільки тоді, коли людина переходить до оформлення доступу.",
              ],
              [
                "Оплата закріплює доступ",
                "Після успішної mono-оплати саме цей профіль отримує paid workspace.",
              ],
              [
                "Вхід для чинних клієнтів",
                "Кнопка «Вхід» лишається для тих, хто вже має оплачений акаунт.",
              ],
              [
                "Безкоштовний старт",
                "Симуляцію можна пройти окремо, а кабінет відкривається після покупки.",
              ],
            ].map(([title, description]) => (
              <article
                key={title}
                className="surface-panel rounded-[1.7rem] p-5"
              >
                <h2 className="text-[1.1rem] font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
                  {title}
                </h2>
                <p className="mt-3 text-[0.94rem] leading-[1.7] text-[var(--text-muted)]">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function DashboardError({ message }: { message: string }) {
  return (
    <section className="dashboard-shell-screen dashboard-shell">
      <div className="mx-auto w-full px-4 py-8 md:px-6 xl:px-8">
        <div className="surface-panel rounded-[2.3rem] p-6 md:p-8">
          <DashboardChip tone="gold">Помилка</DashboardChip>
          <h1 className="mt-5 max-w-[11ch] text-[2.4rem] font-semibold leading-[0.94] tracking-[-0.05em] text-[var(--text-strong)] md:text-[3.1rem]">
            Кабінет тимчасово недоступний.
          </h1>
          <p className="mt-5 max-w-2xl text-[1rem] leading-[1.78] text-[var(--text-muted)]">
            {message}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/simulate" className="btn-primary">
              Перейти до оцінки
            </Link>
            <Link href="/" className="btn-secondary">
              На головну
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
