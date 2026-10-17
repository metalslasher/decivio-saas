"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/hiring/client";
import type { NotificationSettings, NotifyLevel } from "@/lib/hiring/types";

const LEVELS: Array<{ value: NotifyLevel; label: string }> = [
  { value: "strong", label: "Лише сильні" },
  { value: "all", label: "Усі кандидати" },
  { value: "off", label: "Вимкнено" },
];

export function NotificationsCard() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollTimer = useRef<number | null>(null);

  const load = useCallback(async () => {
    const result = await apiRequest<NotificationSettings>("/api/hiring/notifications", { auth: true });
    setSettings(result);
    return result;
  }, []);

  useEffect(() => {
    load().catch(() => setSettings(null));
    return () => {
      if (pollTimer.current) window.clearInterval(pollTimer.current);
    };
  }, [load]);

  const connect = async () => {
    setError(null);
    // Open the tab synchronously so popup blockers allow it, then point it at the bot link.
    const popup = window.open("", "_blank");
    try {
      const { url } = await apiRequest<{ url: string }>("/api/hiring/notifications", { auth: true, body: { action: "link" } });
      if (popup) popup.location.href = url;
      else window.location.href = url;

      setIsWaiting(true);
      let attempts = 0;
      pollTimer.current = window.setInterval(async () => {
        attempts += 1;
        const next = await load().catch(() => null);
        if (next?.connected || attempts > 60) {
          if (pollTimer.current) window.clearInterval(pollTimer.current);
          setIsWaiting(false);
        }
      }, 3000);
    } catch (connectError) {
      popup?.close();
      setError(connectError instanceof Error ? connectError.message : "Не вдалося підключити Telegram.");
    }
  };

  const setLevel = async (level: NotifyLevel) => {
    if (!settings) return;
    setSettings({ ...settings, level });
    await apiRequest("/api/hiring/notifications", { auth: true, body: { action: "level", level } }).catch(() => load());
  };

  const disconnect = async () => {
    await apiRequest("/api/hiring/notifications", { auth: true, body: { action: "disconnect" } }).catch(() => null);
    await load().catch(() => null);
  };

  if (!settings?.botConfigured) {
    return null;
  }

  return (
    <div className="card mt-4 flex flex-col gap-4 p-5 md:flex-row md:items-center">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e9f5fd] text-xl">✈️</div>
      <div className="min-w-0 flex-1">
        <p className="font-extrabold text-[var(--text-strong)]">
          {settings.connected ? "Сповіщення в Telegram підключено" : "Дізнавайтесь про сильних кандидатів одразу"}
        </p>
        <p className="body-copy mt-1 text-sm">
          {settings.connected
            ? "Бот надсилає картку кандидата з телефоном і кнопками «Запросити» / «Відмова»."
            : "Бот напише вам у Telegram, щойно з'явиться кандидат, якому варто подзвонити першим."}
        </p>
        {error ? <p className="mt-2 text-sm font-semibold text-[var(--bad)]">{error}</p> : null}
      </div>

      {settings.connected ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => setLevel(level.value)}
              className={`chip transition ${settings.level === level.value ? "" : "chip-muted"}`}
            >
              {level.label}
            </button>
          ))}
          <button type="button" onClick={disconnect} className="ml-1 text-xs font-bold text-[var(--text-soft)] hover:text-[var(--bad)]">
            Відключити
          </button>
        </div>
      ) : (
        <button type="button" className="btn-primary !py-2.5 text-sm disabled:opacity-60" disabled={isWaiting} onClick={connect}>
          {isWaiting ? "Чекаємо підтвердження в Telegram..." : "Підключити Telegram"}
        </button>
      )}
    </div>
  );
}
