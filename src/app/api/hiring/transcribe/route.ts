import { NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import { enforceRateLimit, errorMessage, jsonError } from "@/lib/hiring/http";
import { isLocalTestModeEnabled } from "@/lib/test-mode";

export const maxDuration = 60;

// ~90 s of compressed speech; keeps cost and latency predictable.
const MAX_AUDIO_BYTES = 4 * 1024 * 1024;
const TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe";

/** Voice brief for the vacancy builder: audio in, Ukrainian text out. Open to guests, rate-limited. */
export async function POST(request: Request) {
  const supabase = getSupabaseServiceRoleClient();
  const limited = await enforceRateLimit(supabase, request, "hiring-transcribe", 20, 3600);
  if (limited) return limited;

  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) {
    return jsonError("Не отримали запис. Спробуйте ще раз.", 400);
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return jsonError("Запис задовгий. Розкажіть коротше — до хвилини.", 413);
  }

  if (isLocalTestModeEnabled()) {
    return NextResponse.json({ text: "Шукаю баристу в кав'ярню на Подолі, графік 2/2, можна без досвіду" });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 1, timeout: 45_000 });
    const extension = audio.type.includes("mp4") ? "mp4" : audio.type.includes("ogg") ? "ogg" : "webm";
    const result = await client.audio.transcriptions.create({
      file: await toFile(audio, `brief.${extension}`, { type: audio.type || "audio/webm" }),
      model: TRANSCRIBE_MODEL,
      language: "uk",
      prompt: "Роботодавець описує вакансію: посада, місто, графік, оплата, вимоги.",
    });

    const text = result.text?.trim();
    if (!text) {
      return jsonError("Не вдалося розпізнати мову. Спробуйте говорити ближче до мікрофона.", 422);
    }
    return NextResponse.json({ text });
  } catch (error) {
    return jsonError(errorMessage(error, "Не вдалося розпізнати запис."), 502);
  }
}
