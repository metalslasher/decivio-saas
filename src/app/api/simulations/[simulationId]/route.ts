import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import { getSupabaseUserServerClient } from "@/lib/db/supabase-server";
import { GUEST_USER_COOKIE_NAME } from "@/lib/guest-session";
import { getAuthenticatedUserFromRequest } from "@/lib/request-auth";
import { consumeRateLimit } from "@/lib/request-rate-limit";
import { buildSimulationResultsPayload } from "@/lib/simulation-results-payload";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SIMULATION_RESULTS_RATE_LIMIT = {
  limit: 60,
  windowSeconds: 10 * 60,
} as const;

function errorResponse(
  status: number,
  title: string,
  description: string,
  headers?: HeadersInit,
) {
  return NextResponse.json(
    {
      title,
      description,
    },
    { status, headers },
  );
}

function isUuid(value: string | null | undefined): value is string {
  return typeof value === "string" && uuidPattern.test(value);
}

function buildRateLimitSubjectHint(
  userId: string | null,
  guestSessionId: string | null,
) {
  if (userId?.trim()) {
    return `user:${userId.trim()}`;
  }

  if (guestSessionId?.trim()) {
    return `guest:${guestSessionId.trim()}`;
  }

  return "anonymous";
}

export async function GET(
  request: Request,
  { params }: { params: { simulationId: string } },
) {
  if (!isUuid(params.simulationId)) {
    return errorResponse(
      400,
      "Некоректний simulationId",
      "Не вдалося розпізнати ідентифікатор симуляції. Перевірте посилання та спробуйте ще раз.",
    );
  }

  let serviceSupabase;

  try {
    serviceSupabase = getSupabaseServiceRoleClient();
  } catch (error) {
    return errorResponse(
      500,
      "Сервер бази даних не налаштовано",
      error instanceof Error
        ? error.message
        : "Перевірте налаштування Supabase і повторіть спробу.",
    );
  }

  let authenticatedUser;

  try {
    authenticatedUser = await getAuthenticatedUserFromRequest(
      serviceSupabase,
      request,
    );
  } catch (error) {
    return errorResponse(
      401,
      "Не вдалося підтвердити авторизацію",
      error instanceof Error
        ? error.message
        : "Спробуйте оновити сторінку та увійти ще раз.",
    );
  }

  const guestSessionId = cookies().get(GUEST_USER_COOKIE_NAME)?.value ?? null;

  let rateLimit;
  try {
    rateLimit = await consumeRateLimit(serviceSupabase, {
      route: "/api/simulations/[simulationId]",
      subjectHint: buildRateLimitSubjectHint(
        authenticatedUser?.userId ?? null,
        guestSessionId,
      ),
      headers: request.headers,
      limit: SIMULATION_RESULTS_RATE_LIMIT.limit,
      windowSeconds: SIMULATION_RESULTS_RATE_LIMIT.windowSeconds,
    });
  } catch (error) {
    return errorResponse(
      500,
      "Не вдалося застосувати обмеження запитів",
      error instanceof Error
        ? error.message
        : "Спробуйте оновити сторінку ще раз через кілька секунд.",
    );
  }

  if (!rateLimit.allowed) {
    return errorResponse(
      429,
      "Забагато спроб за короткий час",
      "Зачекайте кілька хвилин і спробуйте відкрити результат ще раз.",
      {
        "Retry-After": String(rateLimit.retryAfterSeconds),
      },
    );
  }

  if (authenticatedUser) {
    let userSupabase;

    try {
      userSupabase = getSupabaseUserServerClient(
        authenticatedUser.accessToken,
      );
    } catch (error) {
      return errorResponse(
        500,
        "Не вдалося підготувати server client",
        error instanceof Error
          ? error.message
          : "Перевірте server env для Supabase і спробуйте ще раз.",
      );
    }

    const { data: simulation, error: simulationError } = await userSupabase
      .from("simulations")
      .select("id, inputs, created_at")
      .eq("id", params.simulationId)
      .maybeSingle();

    if (simulationError || !simulation) {
      return errorResponse(
        404,
        "Симуляцію не знайдено",
        "Схоже, цього результату вже немає або він недоступний у вашому акаунті.",
      );
    }

    const { data: result, error: resultError } = await userSupabase
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
        "Симуляція збережена, але фінальний висновок ще не сформований. Спробуйте відкрити сторінку ще раз через кілька секунд.",
      );
    }

    const payload = buildSimulationResultsPayload({ simulation, result });

    if (!payload) {
      return errorResponse(
        409,
        "Для цього результату бракує даних",
        "Схоже, цей результат було створено на старій логіці або він пошкоджений. Запустіть симуляцію ще раз, щоб отримати новий висновок.",
      );
    }

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  if (!isUuid(guestSessionId)) {
    return errorResponse(
      403,
      "Цей результат недоступний у поточному режимі",
      "Результат прив'язаний до вашої сесії або акаунта. Увійдіть у тому ж браузері, де проходили симуляцію.",
    );
  }

  const { data: simulation, error: simulationError } = await serviceSupabase
    .from("simulations")
    .select("id, inputs, created_at")
    .eq("id", params.simulationId)
    .eq("guest_session_id", guestSessionId)
    .maybeSingle();

  if (simulationError || !simulation) {
    return errorResponse(
      404,
      "Симуляцію не знайдено",
      "Схоже, цього результату вже немає або він недоступний у вашій поточній сесії.",
    );
  }

  const { data: result, error: resultError } = await serviceSupabase
    .from("simulation_results")
    .select("ai_summary, created_at")
    .eq("simulation_id", params.simulationId)
    .eq("guest_session_id", guestSessionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (resultError || !result) {
    return errorResponse(
      409,
      "Результат ще не готовий",
      "Симуляція збережена, але фінальний висновок ще не сформований. Спробуйте відкрити сторінку ще раз через кілька секунд.",
    );
  }

  const payload = buildSimulationResultsPayload({ simulation, result });

  if (!payload) {
    return errorResponse(
      409,
      "Для цього результату бракує даних",
      "Схоже, цей результат було створено на старій логіці або він пошкоджений. Запустіть симуляцію ще раз, щоб отримати новий висновок.",
    );
  }

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
