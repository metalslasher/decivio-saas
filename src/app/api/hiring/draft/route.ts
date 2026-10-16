import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import { generateVacancyDraft } from "@/lib/hiring/ai";
import { enforceRateLimit, errorMessage, jsonError, readJsonBody, readOptionalString } from "@/lib/hiring/http";
import { isRecord } from "@/lib/hiring/validate";

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (!isRecord(body)) {
    return jsonError("Некоректний запит.", 400);
  }

  const brief = readOptionalString(body.brief, 2000);
  if (!brief || brief.length < 8) {
    return jsonError("Опишіть, кого шукаєте, хоча б одним реченням.", 400);
  }

  try {
    const supabase = getSupabaseServiceRoleClient();
    const limited = await enforceRateLimit(supabase, request, "hiring-draft", 12, 3600);
    if (limited) {
      return limited;
    }

    const content = await generateVacancyDraft({
      brief,
      city: readOptionalString(body.city, 80),
      pay: readOptionalString(body.pay, 80),
      schedule: readOptionalString(body.schedule, 120),
    });

    return NextResponse.json({ content });
  } catch (error) {
    return jsonError(errorMessage(error, "Не вдалося згенерувати вакансію."), 502);
  }
}
