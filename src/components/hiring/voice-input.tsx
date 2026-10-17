"use client";

import { useEffect, useRef, useState } from "react";

const MAX_SECONDS = 90;

function pickMimeType() {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

/** Records a spoken vacancy brief and returns the transcribed text. */
export function VoiceInput({ onText }: { onText: (text: string) => void }) {
  const [state, setState] = useState<"idle" | "recording" | "transcribing">("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearInterval(timer.current);
      recorder.current?.stream.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  const stop = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    if (recorder.current?.state === "recording") recorder.current.stop();
  };

  const upload = async (blob: Blob) => {
    setState("transcribing");
    try {
      const form = new FormData();
      form.append("audio", blob, "brief");
      const response = await fetch("/api/hiring/transcribe", { method: "POST", body: form });
      const payload = (await response.json().catch(() => null)) as { text?: string; error?: string } | null;
      if (!response.ok || !payload?.text) throw new Error(payload?.error ?? "Не вдалося розпізнати запис.");
      onText(payload.text);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Не вдалося розпізнати запис.");
    } finally {
      setState("idle");
    }
  };

  const start = async () => {
    setError(null);
    const mimeType = pickMimeType();
    if (mimeType === null || !navigator.mediaDevices?.getUserMedia) {
      setError("Цей браузер не підтримує запис голосу. Опишіть вакансію текстом.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const media = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunks.current = [];
      media.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.current.push(event.data);
      };
      media.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks.current, { type: media.mimeType || "audio/webm" });
        if (blob.size > 0) void upload(blob);
        else setState("idle");
      };
      recorder.current = media;
      media.start();
      setSeconds(0);
      setState("recording");
      timer.current = window.setInterval(() => {
        setSeconds((value) => {
          if (value + 1 >= MAX_SECONDS) stop();
          return value + 1;
        });
      }, 1000);
    } catch {
      setError("Немає доступу до мікрофона. Дозвольте його в налаштуваннях браузера.");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {state === "recording" ? (
        <button type="button" onClick={stop} className="inline-flex items-center gap-2 rounded-full bg-[var(--bad)] px-4 py-2 text-sm font-bold text-white">
          <span className="pulse-dot h-2.5 w-2.5 rounded-full bg-white" />
          Зупинити · 0:{String(seconds).padStart(2, "0")}
        </button>
      ) : (
        <button
          type="button"
          onClick={start}
          disabled={state === "transcribing"}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-white px-4 py-2 text-sm font-bold text-[var(--text-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)] disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3ZM5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          {state === "transcribing" ? "Розпізнаємо..." : "Надиктувати голосом"}
        </button>
      )}
      {state === "recording" ? <span className="text-xs text-[var(--text-muted)]">Розкажіть: посада, місто, графік, оплата, вимоги</span> : null}
      {error ? <span className="text-xs font-semibold text-[var(--bad)]">{error}</span> : null}
    </div>
  );
}
