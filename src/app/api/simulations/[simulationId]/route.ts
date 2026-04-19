import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/db/supabase";
import { GUEST_USER_COOKIE_NAME } from "@/lib/guest-session";
import { getAuthenticatedUserIdFromRequest } from "@/lib/request-auth";
import { buildSimulationResultsPayload } from "@/lib/simulation-results-payload";

function toString(value: unknown) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function errorResponse(status: number, title: string, description: string) {
  return NextResponse.json(
    {
      title,
      description
    },
    { status }
  );
}

export async function GET(
  request: Request,
  { params }: { params: { simulationId: string } }
) {
  let supabase;

  try {
    supabase = getSupabaseAdminClient();
  } catch (error) {
    return errorResponse(
      500,
      "Сервер бази даних не налаштовано",
      error instanceof Error ? error.message : "Перевірте налаштування Supabase і повторіть спробу."
    );
  }

  let authenticatedUserId: string | null;

  try {
    authenticatedUserId = await getAuthenticatedUserIdFromRequest(supabase, request);
  } catch (error) {
    return errorResponse(
      401,
      "Не вдалося підтвердити авторизацію",
      error instanceof Error ? error.message : "Спробуйте оновити сторінку та увійти ще раз."
    );
  }

  const guestSessionId = cookies().get(GUEST_USER_COOKIE_NAME)?.value ?? null;

  const { data: simulation, error: simulationError } = await supabase
    .from("simulations")
    .select("id, user_id, guest_session_id, inputs, created_at")
    .eq("id", params.simulationId)
    .maybeSingle();

  if (simulationError || !simulation) {
    return errorResponse(
      404,
      "Симуляцію не знайдено",
      "Схоже, цього результату вже немає або він недоступний у вашій поточній сесії."
    );
  }

  const simulationUserId = toString(simulation.user_id);
  const simulationGuestSessionId = toString(simulation.guest_session_id);
  const isAuthorized =
    (authenticatedUserId !== null && simulationUserId === authenticatedUserId) ||
    (guestSessionId !== null && simulationGuestSessionId === guestSessionId);

  if (!isAuthorized) {
    return errorResponse(
      403,
      "Цей результат недоступний у поточному режимі",
      authenticatedUserId
        ? "Результат не прив'язаний до цього акаунта. Якщо він був створений до входу, спробуйте відкрити його в тому ж браузері ще раз."
        : "Результат прив'язаний до вашої сесії або акаунта. Увійдіть у кабінет у тому ж браузері, де проходили симуляцію."
    );
  }

  const { data: result, error: resultError } = await supabase
    .from("simulation_results")
    .select("ai_summary, created_at")
    .eq("simulation_id", params.simulationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (resultError || !result) {
    return errorResponse(
      409,
      "Результат ще не готовий",
      "Симуляція збережена, але фінальний висновок ще не сформований. Спробуйте відкрити сторінку ще раз через кілька секунд."
    );
  }

  const payload = buildSimulationResultsPayload({ simulation, result });

  if (!payload) {
    return errorResponse(
      409,
      "Для цього результату бракує даних",
      "Схоже, цей результат було створено на старій логіці або він пошкоджений. Запустіть симуляцію ще раз, щоб отримати новий висновок."
    );
  }

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
