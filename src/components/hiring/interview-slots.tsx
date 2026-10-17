"use client";

import { useMemo, useState } from "react";
import { apiRequest } from "@/lib/hiring/client";
import { addDaysToDate, formatSlot, kyivNowLocal } from "@/lib/hiring/slots";
import type { InterviewSettings } from "@/lib/hiring/types";

const TIMES = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
const DAYS_AHEAD = 14;
const WEEKDAY_SHORT = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

export function InterviewSlots({
  vacancyId,
  initial,
  bookedSlots,
  onSaved,
}: {
  vacancyId: string;
  initial: InterviewSettings | null;
  bookedSlots: string[];
  onSaved: (settings: InterviewSettings) => void;
}) {
  const now = kyivNowLocal();
  const today = now.slice(0, 10);
  const days = useMemo(() => Array.from({ length: DAYS_AHEAD }, (_, index) => addDaysToDate(today, index)), [today]);
  const [location, setLocation] = useState(initial?.location ?? "");
  const [slots, setSlots] = useState<string[]>((initial?.slots ?? []).filter((slot) => slot > now));
  const [activeDay, setActiveDay] = useState(days[1] ?? days[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const toggle = (slot: string) => {
    if (bookedSlots.includes(slot)) return;
    setState("idle");
    setSlots((current) => (current.includes(slot) ? current.filter((item) => item !== slot) : [...current, slot].sort()));
  };

  const copyDayToWeekdays = () => {
    const times = slots.filter((slot) => slot.startsWith(activeDay)).map((slot) => slot.slice(11));
    const next = new Set(slots);
    for (const day of days) {
      const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
      if (day > activeDay && weekday !== 0 && weekday !== 6) {
        times.forEach((time) => next.add(`${day}T${time}`));
      }
    }
    setSlots(Array.from(next).sort());
    setState("idle");
  };

  const save = async () => {
    setState("saving");
    try {
      const result = await apiRequest<{ interview: InterviewSettings }>(`/api/hiring/vacancies/${vacancyId}`, {
        auth: true,
        method: "PATCH",
        body: { interview: { location, slots } },
      });
      onSaved(result.interview);
      setState("saved");
    } catch {
      setState("error");
    }
  };

  const upcoming = slots.filter((slot) => slot > now);

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--text-soft)]">Співбесіди</h2>
        <button type="button" className="chip" onClick={() => setIsOpen((value) => !value)}>
          {isOpen ? "Згорнути" : upcoming.length > 0 ? "Змінити" : "Налаштувати"}
        </button>
      </div>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        {upcoming.length > 0
          ? `${upcoming.length} вільних слотів. Запрошені кандидати самі обирають час — у Telegram або за посиланням.`
          : "Додайте час для співбесід — і запрошені кандидати записуватимуться самі, без дзвінків туди-сюди."}
      </p>

      {isOpen ? (
        <div className="fade-up mt-4 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-[var(--text-muted)]">Де проходить співбесіда</span>
            <input
              className="field-surface text-sm"
              placeholder="вул. Хрещатик, 1, кав'ярня «Зерно» або «Дзвінок у Telegram»"
              value={location}
              onChange={(event) => {
                setLocation(event.target.value);
                setState("idle");
              }}
            />
          </label>

          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {days.map((day) => {
              const count = slots.filter((slot) => slot.startsWith(day)).length;
              const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setActiveDay(day)}
                  className={`flex min-w-[3.4rem] shrink-0 flex-col items-center rounded-2xl border px-2 py-2 text-xs font-bold transition ${
                    activeDay === day ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]" : "border-[var(--line-soft)] text-[var(--text-muted)]"
                  }`}
                >
                  <span>{WEEKDAY_SHORT[weekday]}</span>
                  <span className="text-base text-[var(--text-strong)]">{Number(day.slice(8))}</span>
                  <span className={count > 0 ? "text-[var(--good)]" : "opacity-0"}>{count || 0}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {TIMES.map((time) => {
              const slot = `${activeDay}T${time}`;
              const isPast = slot <= now;
              const isBooked = bookedSlots.includes(slot);
              const isSelected = slots.includes(slot);
              return (
                <button
                  key={time}
                  type="button"
                  disabled={isPast || isBooked}
                  onClick={() => toggle(slot)}
                  className={`rounded-xl border py-2 text-sm font-bold transition disabled:opacity-40 ${
                    isBooked
                      ? "border-[var(--good)] bg-[var(--good-soft)] text-[var(--good)]"
                      : isSelected
                        ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                        : "border-[var(--line-soft)] text-[var(--text-strong)] hover:border-[var(--accent)]"
                  }`}
                  title={isBooked ? "Зайнято кандидатом" : undefined}
                >
                  {time}
                </button>
              );
            })}
          </div>

          <button type="button" className="text-link text-xs" onClick={copyDayToWeekdays}>
            Повторити цей час на всі наступні будні
          </button>

          <div className="flex items-center gap-3">
            <button type="button" className="btn-primary !py-2.5 text-sm disabled:opacity-60" disabled={state === "saving"} onClick={save}>
              {state === "saving" ? "Зберігаємо..." : "Зберегти слоти"}
            </button>
            {state === "saved" ? <span className="text-sm font-semibold text-[var(--good)]">Збережено ✓</span> : null}
            {state === "error" ? <span className="text-sm font-semibold text-[var(--bad)]">Не вдалося зберегти</span> : null}
          </div>

          {upcoming.length > 0 ? (
            <p className="text-xs text-[var(--text-muted)]">Найближчі: {upcoming.slice(0, 3).map(formatSlot).join(" · ")}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
