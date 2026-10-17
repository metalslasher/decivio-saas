import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import { enforceRateLimit, errorMessage, jsonError, readJsonBody } from "@/lib/hiring/http";
import { bookInterviewSlot } from "@/lib/hiring/interview";
import { isValidSlot } from "@/lib/hiring/slots";
import { isRecord } from "@/lib/hiring/validate";
import { getTelegramBotToken, runTelegramActions } from "@/lib/telegram/api";
import { isLocalTestModeEnabled } from "@/lib/test-mode";

type RouteContext = { params: Promise<{ token: string }> };

const REASON_MESSAGES = {
  not_found: "Запрошення не знайдено. Перевірте посилання.",
  invalid_slot: "Цей час уже недоступний. Оберіть інший.",
  taken: "Цей час щойно зайняли. Оберіть інший.",
} as const;

export async function POST(request: Request, { params }: RouteContext) {
  const { token } = await params;
  const body = await readJsonBody(request);
  const slot = isRecord(body) ? body.slot : null;
  if (!isValidSlot(slot)) {
    return jsonError("Оберіть час співбесіди.", 400);
  }

  const supabase = getSupabaseServiceRoleClient();
  try {
    const limited = await enforceRateLimit(supabase, request, `interview-${token}`, 20, 3600);
    if (limited) return limited;

    const result = await bookInterviewSlot(supabase, { token }, slot);
    if (!result.ok) {
      return NextResponse.json({ error: REASON_MESSAGES[result.reason], reason: result.reason }, { status: result.reason === "not_found" ? 404 : 409 });
    }

    if (result.actions.length > 0 && getTelegramBotToken() && !isLocalTestModeEnabled()) {
      await runTelegramActions(result.actions);
    }

    return NextResponse.json({ ok: true, slot: result.slot });
  } catch (error) {
    return jsonError(errorMessage(error, "Не вдалося записати на співбесіду."), 500);
  }
}
