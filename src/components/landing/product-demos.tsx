"use client";

import { useLoop } from "@/components/landing/use-loop";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function PhoneFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cx("relative mx-auto w-full max-w-[290px]", className)}>
      <div className="rounded-[2.6rem] bg-[#121726] p-[9px] shadow-[0_50px_90px_-40px_rgba(18,23,38,0.55)]">
        <div className="relative h-[540px] overflow-hidden rounded-[2.1rem] bg-[#f4f6fc]">
          <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-[#121726]" />
          {children}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Candidate applies from the phone
// ---------------------------------------------------------------------------

const APPLY_STEPS = [
  { kind: "intro" },
  { kind: "q", title: "Чи підходить графік 2/2?", options: ["Так", "Ні"], pick: 0 },
  { kind: "q", title: "Скільки часу добиратися?", options: ["До 30 хвилин", "30–60 хвилин", "Більше години"], pick: 0 },
  { kind: "q", title: "Досвід роботи баристою?", options: ["Немає", "До 1 року", "1–3 роки"], pick: 2 },
  { kind: "contacts" },
  { kind: "done" },
] as const;
const APPLY_STEP_MS = 1900;

export function PhoneApplyDemo() {
  const { ref, elapsed } = useLoop(APPLY_STEPS.length * APPLY_STEP_MS);
  const stepIndex = Math.min(APPLY_STEPS.length - 1, Math.floor(elapsed / APPLY_STEP_MS));
  const step = APPLY_STEPS[stepIndex];
  const within = elapsed % APPLY_STEP_MS;
  const tapped = within > 1100;
  const progress = stepIndex === 0 ? 0 : Math.min(1, stepIndex / 4);

  return (
    <div ref={ref} aria-hidden="true">
      <PhoneFrame>
        <div className="flex h-full flex-col px-5 pb-6 pt-10">
          {step.kind !== "intro" && step.kind !== "done" ? (
            <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-[rgba(22,29,43,0.08)]">
              <div className="h-full rounded-full bg-[var(--accent)] transition-all duration-700" style={{ width: `${progress * 100}%` }} />
            </div>
          ) : null}

          <div key={stepIndex} className="fade-up flex flex-1 flex-col">
            {step.kind === "intro" ? (
              <>
                <span className="chip chip-muted self-start">📍 Київ, Поділ</span>
                <p className="mt-3 text-[1.45rem] font-extrabold leading-tight text-[var(--text-strong)]">Бариста</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Кав&apos;ярня біля метро, навчаємо з нуля</p>
                <div className="mt-4 space-y-2">
                  <div className="rounded-2xl bg-white p-3">
                    <p className="text-[0.65rem] font-bold uppercase text-[var(--text-soft)]">Оплата</p>
                    <p className="text-sm font-extrabold">24 000 – 30 000 грн</p>
                  </div>
                  <div className="rounded-2xl bg-white p-3">
                    <p className="text-[0.65rem] font-bold uppercase text-[var(--text-soft)]">Графік</p>
                    <p className="text-sm font-bold">2/2, з 8:00</p>
                  </div>
                </div>
                <div className={cx("btn-primary mt-auto w-full !py-3 text-sm transition", tapped && "scale-[0.97]")}>Відгукнутися за 2 хвилини</div>
              </>
            ) : null}

            {step.kind === "q" ? (
              <>
                <p className="text-[0.65rem] font-bold uppercase text-[var(--text-soft)]">Питання {stepIndex} з 3</p>
                <p className="mt-2 text-[1.15rem] font-extrabold leading-tight text-[var(--text-strong)]">{step.title}</p>
                <div className="mt-4 space-y-2">
                  {step.options.map((option, index) => (
                    <div key={option} className="option-button !py-3 text-sm" data-selected={tapped && index === step.pick}>
                      {option}
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            {step.kind === "contacts" ? (
              <>
                <p className="text-[1.15rem] font-extrabold text-[var(--text-strong)]">Як з вами зв&apos;язатися?</p>
                <div className="field-surface mt-4 !py-3 text-sm">Олена</div>
                <div className="field-surface mt-2 !py-3 text-sm">067 123 45 67</div>
                <div className={cx("btn-primary mt-auto w-full !py-3 text-sm transition", tapped && "scale-[0.97]")}>Надіслати відгук</div>
              </>
            ) : null}

            {step.kind === "done" ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--good-soft)] text-3xl text-[var(--good)]">✓</div>
                <p className="mt-4 text-lg font-extrabold">Відгук надіслано!</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Без резюме і реєстрації</p>
              </div>
            ) : null}
          </div>
        </div>
      </PhoneFrame>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Telegram: strong candidate notification → invite → booking
// ---------------------------------------------------------------------------

const TG_TOTAL_MS = 9500;

export function TelegramDemo() {
  const { ref, elapsed } = useLoop(TG_TOTAL_MS);
  const showCard = elapsed > 600;
  const tapping = elapsed > 3200 && elapsed < 3900;
  const invited = elapsed >= 3900;
  const showBooking = elapsed > 6000;

  return (
    <div ref={ref} aria-hidden="true" className="mx-auto w-full max-w-[400px]">
      <div className="overflow-hidden rounded-[1.8rem] border border-[var(--line-soft)] bg-[#e7ebf0] shadow-[0_40px_80px_-50px_rgba(18,23,38,0.5)]">
        <div className="flex items-center gap-3 bg-white px-4 py-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[linear-gradient(135deg,#4361ff,#2c3fd6)] text-sm font-extrabold text-white">D</div>
          <div>
            <p className="text-sm font-extrabold text-[var(--text-strong)]">Decivio</p>
            <p className="text-xs text-[#5b8fd6]">бот</p>
          </div>
        </div>

        <div className="min-h-[380px] space-y-3 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.5),transparent_40%)] p-4">
          <div className={cx("max-w-[92%] rounded-2xl rounded-tl-md bg-white p-3.5 text-[0.86rem] shadow-sm transition-all duration-500", showCard ? "opacity-100" : "translate-y-3 opacity-0")}>
            <p>🔥 Сильний кандидат на «Бариста»</p>
            <p className="mt-2 font-extrabold">Олена К. · 91/100</p>
            <p className="text-[var(--text-muted)]">2 роки бариста, живе поруч, готова з понеділка</p>
            <p className="mt-2">✓ Досвід з кавомашиною</p>
            <p>✓ Графік 2/2 підходить</p>
            <p className="mt-2">📞 +380 67 123 45 67</p>
            <div className="mt-3 grid grid-cols-2 gap-1.5 text-center text-[0.8rem] font-bold text-[#3b7dd8]">
              {invited ? (
                <div className="col-span-2 rounded-lg bg-[#eef4fb] py-2">Статус: Запрошено</div>
              ) : (
                <>
                  <div className={cx("rounded-lg bg-[#eef4fb] py-2 transition", tapping && "scale-95 bg-[#dbe8f8]")}>✅ Запросити</div>
                  <div className="rounded-lg bg-[#eef4fb] py-2">✖ Відмова</div>
                </>
              )}
            </div>
          </div>

          <div className={cx("ml-auto max-w-[80%] rounded-2xl rounded-tr-md bg-[#d9f7c8] p-3 text-[0.86rem] transition-all duration-500", invited ? "opacity-100" : "translate-y-3 opacity-0")}>
            Кандидату надіслано вибір часу співбесіди ✓
          </div>

          <div className={cx("max-w-[92%] rounded-2xl rounded-tl-md bg-white p-3.5 text-[0.86rem] shadow-sm transition-all duration-500", showBooking ? "opacity-100" : "translate-y-3 opacity-0")}>
            📅 <b>Олена К.</b> записалася на співбесіду
            <p className="mt-1 font-extrabold text-[var(--accent-strong)]">пт, 24 жовт · 14:00</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Interview booking: candidate picks a slot
// ---------------------------------------------------------------------------

const BOOKING_DAYS = [
  { day: "Чт", date: 23, times: ["10:00", "12:00", "15:00"] },
  { day: "Пт", date: 24, times: ["11:00", "14:00", "16:00"] },
];
const BOOKING_TOTAL_MS = 6000;

export function BookingDemo() {
  const { ref, elapsed } = useLoop(BOOKING_TOTAL_MS);
  const selected = elapsed > 1500;
  const confirmed = elapsed > 3200;

  return (
    <div ref={ref} aria-hidden="true">
      <PhoneFrame>
        <div className="flex h-full flex-col px-5 pb-6 pt-10">
          <span className="chip self-start">Запрошення на співбесіду</span>
          <p className="mt-3 text-[1.3rem] font-extrabold leading-tight">Бариста</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">📍 Кав&apos;ярня «Зерно», Поділ</p>

          {confirmed ? (
            <div className="fade-up mt-8 rounded-3xl bg-white p-6 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--good-soft)] text-2xl text-[var(--good)]">✓</div>
              <p className="mt-3 font-extrabold">Ви записані</p>
              <p className="mt-1 text-xl font-extrabold text-[var(--accent-strong)]">пт, 24 жовт · 14:00</p>
            </div>
          ) : (
            <>
              {BOOKING_DAYS.map((day) => (
                <div key={day.date} className="mt-5">
                  <p className="text-[0.65rem] font-bold uppercase text-[var(--text-soft)]">
                    {day.day}, {day.date} жовт
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {day.times.map((time) => (
                      <div
                        key={time}
                        className="option-button !py-2.5 text-center text-sm"
                        data-selected={selected && day.date === 24 && time === "14:00"}
                      >
                        {time}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className={cx("btn-primary mt-auto w-full !py-3 text-sm transition-opacity", selected ? "opacity-100" : "opacity-40")}>
                {selected ? "Записатися на пт · 14:00" : "Оберіть час"}
              </div>
            </>
          )}
        </div>
      </PhoneFrame>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Roles marquee
// ---------------------------------------------------------------------------

export function RolesMarquee({ roles }: { roles: string[] }) {
  const items = [...roles, ...roles];
  return (
    <div className="relative overflow-hidden py-2 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]" aria-hidden="true">
      <div className="marquee-track flex w-max gap-2.5">
        {items.map((role, index) => (
          <span key={`${role}-${index}`} className="chip chip-muted !px-4 !py-2 !text-[0.9rem]">
            {role}
          </span>
        ))}
      </div>
    </div>
  );
}
