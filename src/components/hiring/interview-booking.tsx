"use client";

import { useState } from "react";
import { formatSlot } from "@/lib/hiring/slots";

type BookingProps = {
  token: string;
  candidateName: string;
  vacancyTitle: string;
  city: string | null;
  location: string;
  bookedSlot: string | null;
  freeSlots: string[];
};

function groupByDay(slots: string[]) {
  const groups = new Map<string, string[]>();
  for (const slot of slots) {
    const day = slot.slice(0, 10);
    groups.set(day, [...(groups.get(day) ?? []), slot]);
  }
  return Array.from(groups.entries());
}

export function InterviewBooking(props: BookingProps) {
  const [booked, setBooked] = useState<string | null>(props.bookedSlot);
  const [freeSlots, setFreeSlots] = useState(props.freeSlots);
  const [selected, setSelected] = useState<string | null>(null);
  const [isChanging, setIsChanging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    if (!selected) return;
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/interview/${props.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot: selected }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string; reason?: string } | null;
      if (!response.ok) {
        if (payload?.reason === "taken" || payload?.reason === "invalid_slot") {
          setFreeSlots((current) => current.filter((slot) => slot !== selected));
          setSelected(null);
        }
        throw new Error(payload?.error ?? "Не вдалося записатися.");
      }
      if (booked) setFreeSlots((current) => [...current, booked].sort());
      setFreeSlots((current) => current.filter((slot) => slot !== selected));
      setBooked(selected);
      setSelected(null);
      setIsChanging(false);
    } catch (bookingError) {
      setError(bookingError instanceof Error ? bookingError.message : "Не вдалося записатися.");
    } finally {
      setIsSaving(false);
    }
  };

  const firstName = props.candidateName.split(" ")[0];
  const showPicker = !booked || isChanging;

  return (
    <div className="space-y-5 fade-up">
      <div>
        <span className="chip">Запрошення на співбесіду</span>
        <h1 className="mt-3 text-[1.7rem] font-extrabold leading-[1.1] tracking-[-0.03em] text-[var(--text-strong)]">{props.vacancyTitle}</h1>
        <p className="mt-2 text-[0.95rem] text-[var(--text-muted)]">
          {firstName}, вас запрошують на співбесіду{props.city ? ` (${props.city})` : ""}. {showPicker ? "Оберіть зручний час." : ""}
        </p>
        {props.location ? <p className="mt-2 text-sm font-semibold text-[var(--text-strong)]">📍 {props.location}</p> : null}
      </div>

      {booked && !isChanging ? (
        <div className="card p-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--good-soft)] text-2xl text-[var(--good)]">✓</div>
          <p className="mt-3 text-lg font-extrabold text-[var(--text-strong)]">Ви записані</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--accent-strong)]">{formatSlot(booked)}</p>
          <p className="body-copy mt-2 text-sm">Роботодавець отримав підтвердження. Якщо плани зміняться — оберіть інший час.</p>
          {freeSlots.length > 0 ? (
            <button type="button" className="text-link mt-4 text-sm" onClick={() => setIsChanging(true)}>
              Змінити час
            </button>
          ) : null}
        </div>
      ) : null}

      {showPicker ? (
        freeSlots.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="font-bold text-[var(--text-strong)]">Вільного часу поки немає</p>
            <p className="body-copy mt-1 text-sm">Роботодавець додасть нові слоти або зателефонує вам, щоб домовитися.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupByDay(freeSlots).map(([day, slots]) => (
              <div key={day}>
                <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--text-soft)]">{formatSlot(slots[0]).split(" · ")[0]}</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className="option-button !py-3 text-center"
                      data-selected={selected === slot}
                      onClick={() => setSelected(slot)}
                    >
                      {slot.slice(11)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {error ? <p className="text-sm font-semibold text-[var(--bad)]">{error}</p> : null}
            <div className="sticky bottom-3">
              <button type="button" className="btn-primary w-full disabled:opacity-50" disabled={!selected || isSaving} onClick={confirm}>
                {isSaving ? "Записуємо..." : selected ? `Записатися на ${formatSlot(selected)}` : "Оберіть час"}
              </button>
            </div>
            {isChanging ? (
              <button type="button" className="text-link w-full text-center text-sm" onClick={() => setIsChanging(false)}>
                Залишити поточний час
              </button>
            ) : null}
          </div>
        )
      ) : null}
    </div>
  );
}
