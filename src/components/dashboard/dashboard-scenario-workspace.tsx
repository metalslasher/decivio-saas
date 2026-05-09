import Link from "next/link";
import { DashboardChip, DashboardMetricCard } from "./dashboard-primitives";
import type { DashboardSimulation } from "./types";
import {
  buildLongTermDirectionInsight,
  formatDateTime,
  formatSignedMoney,
  getDashboardHref,
  mapPriorityLabel,
  mapTargetMarketLabel,
  probabilityLabel,
  simulationStatusLabel,
  verdictLabel,
} from "./dashboard-utils";

export function DashboardScenarioWorkspace({
  recentSimulations,
}: {
  recentSimulations: DashboardSimulation[];
}) {
  const latest = recentSimulations[0] ?? null;

  if (!latest) {
    return (
      <div className="space-y-6">
        <article className="dashboard-spotlight-card rounded-[2.3rem] p-6 md:p-8">
          <DashboardChip tone="accent">Сценарії</DashboardChip>
          <h1 className="mt-5 max-w-[13ch] text-[2.3rem] font-semibold leading-[0.94] tracking-[-0.055em] text-[var(--text-strong)] md:text-[3.15rem]">
            Тут зʼявиться перший сценарій переходу.
          </h1>
          <p className="mt-5 max-w-3xl text-[1rem] leading-[1.78] text-[var(--text-muted)]">
            У цьому розділі житиме окрема історія сценаріїв. Після першого
            проходження симуляції сюди підтягнеться останній маршрут, а нижче
            збережуться попередні варіанти для порівняння.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/simulate" className="btn-primary">
              Пройти симуляцію
            </Link>
            <Link href="/dashboard" className="btn-secondary">
              Повернутися на головну
            </Link>
          </div>
        </article>
      </div>
    );
  }

  const focusTitle =
    latest.currentRole && latest.targetRole
      ? `${latest.currentRole} -> ${latest.targetRole}`
      : (latest.targetRole ?? latest.currentRole ?? "Кар'єрний сценарій");
  const verdict = verdictLabel(latest.verdictLabel);
  const probability = probabilityLabel(latest.probabilityOfGettingJob);
  const market = mapTargetMarketLabel(latest.targetMarket);
  const priority = mapPriorityLabel(latest.transitionPriority);
  const moneyDelta = formatSignedMoney(latest.ceilingGapMedian);
  const longTermDirectionInsight = buildLongTermDirectionInsight(
    latest.betterLongTermDirection,
    latest,
  );
  const latestUpdatedLabel = formatDateTime(latest.createdAt);
  const scenarioSummary =
    longTermDirectionInsight ??
    (latestUpdatedLabel
      ? `Останній розрахунок збережено ${latestUpdatedLabel}. Тут зручно тримати робочий сценарій і повертатися до нього перед наступними модулями.`
      : "Тут зручно тримати робочий сценарій і повертатися до нього перед наступними модулями.");

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.14fr),23rem]">
        <article className="dashboard-spotlight-card rounded-[2.3rem] p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <DashboardChip tone="success">Останній сценарій</DashboardChip>
            <DashboardChip tone="default">
              {simulationStatusLabel(latest.status)}
            </DashboardChip>
            {priority ? (
              <DashboardChip tone="accent">{priority}</DashboardChip>
            ) : null}
          </div>

          <h1 className="mt-5 max-w-[15ch] text-[2.3rem] font-semibold leading-[0.94] tracking-[-0.055em] text-[var(--text-strong)] md:text-[3.15rem]">
            {focusTitle}
          </h1>
          <p className="mt-5 max-w-3xl text-[1rem] leading-[1.78] text-[var(--text-muted)]">
            {scenarioSummary}
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DashboardMetricCard
              label="Вердикт"
              value={verdict ?? "Базовий висновок"}
              description="Ключове формулювання з останнього сценарію."
            />
            <DashboardMetricCard
              label="Шанс входу"
              value={probability ?? "ще рахується"}
              description="Орієнтир на реалістичність входу в роль."
            />
            <DashboardMetricCard
              label="Ринок"
              value={market ?? "не вказано"}
              description="Контекст для вимог, конкуренції та вакансій."
            />
            <DashboardMetricCard
              label="Стеля доходу"
              value={moneyDelta ?? "—"}
              description="Розрив із поточним шляхом у довшій перспективі."
            />
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/simulate" className="btn-primary">
              Перерахувати сценарій
            </Link>
            <Link href={getDashboardHref("resume")} className="btn-secondary">
              Перейти до розділу резюме
            </Link>
          </div>
        </article>

        <article className="surface-panel rounded-[2rem] p-5 md:p-6">
          <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">
            Що робити далі
          </h2>
          <div className="mt-5 space-y-3">
            {[
              "Зафіксувати цільову роль і перевести її в розділ резюме.",
              "Порівняти ще один альтернативний маршрут, якщо рішення все ще неочевидне.",
              "Після сильного сценарію перейти в модулі підготовки до ринку.",
            ].map((item) => (
              <div key={item} className="surface-soft rounded-[1.2rem] p-4">
                <p className="text-[0.93rem] leading-[1.72] text-[var(--text-muted)]">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-[1.8rem] font-semibold leading-[1.04] tracking-[-0.045em] text-[var(--text-strong)]">
            Історія сценаріїв
          </h2>
          <p className="mt-2 text-[0.95rem] leading-[1.72] text-[var(--text-muted)]">
            Усі попередні розрахунки зберігаються тут у хронології, щоб можна було
            повернутись до них і порівняти маршрути між собою.
          </p>
        </div>

        <div className="grid gap-4">
          {recentSimulations.map((simulation) => {
            const roleLabel =
              simulation.currentRole && simulation.targetRole
                ? `${simulation.currentRole} -> ${simulation.targetRole}`
                : (simulation.targetRole ??
                  simulation.currentRole ??
                  "Кар'єрний сценарій");

            return (
              <article
                key={simulation.id}
                className="surface-panel rounded-[1.8rem] p-5 md:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[1.24rem] font-semibold leading-[1.14] tracking-[-0.035em] text-[var(--text-strong)]">
                      {roleLabel}
                    </h3>
                    <p className="mt-2 text-[0.93rem] leading-[1.7] text-[var(--text-muted)]">
                      {formatDateTime(simulation.createdAt)
                        ? `Збережено ${formatDateTime(simulation.createdAt)}.`
                        : "Збережено в історії кабінету."}
                    </p>
                  </div>
                  <DashboardChip tone="default">
                    {simulationStatusLabel(simulation.status)}
                  </DashboardChip>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {verdictLabel(simulation.verdictLabel) ? (
                    <DashboardChip tone="success">
                      {verdictLabel(simulation.verdictLabel)}
                    </DashboardChip>
                  ) : null}
                  {probabilityLabel(simulation.probabilityOfGettingJob) ? (
                    <DashboardChip tone="accent">
                      {probabilityLabel(simulation.probabilityOfGettingJob)}
                    </DashboardChip>
                  ) : null}
                  {mapTargetMarketLabel(simulation.targetMarket) ? (
                    <DashboardChip tone="default">
                      {mapTargetMarketLabel(simulation.targetMarket)}
                    </DashboardChip>
                  ) : null}
                  {mapPriorityLabel(simulation.transitionPriority) ? (
                    <DashboardChip tone="default">
                      {mapPriorityLabel(simulation.transitionPriority)}
                    </DashboardChip>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
