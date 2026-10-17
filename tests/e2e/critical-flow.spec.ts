import { expect, test, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { addDaysToDate, kyivNowLocal } from "../../src/lib/hiring/slots";
import { normalizePhone, parseVacancyContent } from "../../src/lib/hiring/validate";

const tomorrow = addDaysToDate(kyivNowLocal().slice(0, 10), 1);

// Requires: local Supabase with migrations applied. The Playwright web server runs with
// DECIVIO_TEST_MODE=1, so AI calls are replaced with deterministic mocks (see src/lib/hiring/ai.ts).

function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for the flow test.");
  }
  return createClient(url, key);
}

test("phone numbers are normalised to international format", () => {
  expect(normalizePhone("067 123 45 67")).toBe("+380671234567");
  expect(normalizePhone("+38 (050) 111-22-33")).toBe("+380501112233");
  expect(normalizePhone("12345")).toBeNull();
});

test("vacancy content parser keeps only valid knockout answers", () => {
  const content = parseVacancyContent({
    title: "Бариста",
    summary: "Кава біля метро",
    pay_hint: "25 000 грн",
    pay_note: "",
    schedule: "2/2",
    offer: ["Навчання"],
    duties: ["Готувати каву"],
    requirements: ["Пунктуальність"],
    posting_text: "Текст",
    red_flags: [],
    questions: [
      { text: "Графік 2/2 підходить?", kind: "yes_no", options: [], knockout_answer: "Ні" },
      { text: "Досвід?", kind: "choice", options: ["Так", "Ні"], knockout_answer: "Можливо" },
      { text: "Розкажіть про себе", kind: "text", options: ["x"], knockout_answer: "x" },
    ],
  });

  expect(content.questions.map((question) => question.id)).toEqual(["q1", "q2", "q3"]);
  expect(content.questions[0]).toMatchObject({ options: ["Так", "Ні"], knockout_answer: "Ні" });
  expect(content.questions[1].knockout_answer).toBeNull();
  expect(content.questions[2]).toMatchObject({ options: [], knockout_answer: null });
});

test("telegram bot walks a candidate through the screening dialog", async ({ request }) => {
  const admin = getAdminClient();
  const email = `tg-${randomUUID().slice(0, 8)}@decivio.test`;
  const employerPassword = `Tg-${randomUUID()}A1`;
  const { data: created } = await admin.auth.admin.createUser({ email, password: employerPassword, email_confirm: true });
  const userId = created.user!.id;
  const slug = `tg${randomUUID().replace(/-/g, "").slice(0, 10)}`;
  const chatId = Math.floor(Math.random() * 1_000_000_000);
  const employerChatId = chatId + 1;
  let updateId = 1;

  const content = parseVacancyContent({
    title: "Бариста <Поділ>",
    summary: "Кава біля метро",
    pay_hint: "25 000 грн",
    pay_note: "",
    schedule: "2/2",
    offer: ["Навчання"],
    duties: ["Готувати каву"],
    requirements: ["Пунктуальність"],
    posting_text: "Текст",
    red_flags: [],
    questions: [
      { text: "Графік 2/2 підходить?", kind: "yes_no", options: [], knockout_answer: "Ні" },
      { text: "Досвід?", kind: "choice", options: ["Немає", "1–3 роки"], knockout_answer: null },
      { text: "Розкажіть про досвід", kind: "text", options: [], knockout_answer: null },
    ],
  });
  const { data: vacancy } = await admin
    .from("hiring_vacancies")
    .insert({ owner_id: userId, slug, title: content.title, brief: "test", content })
    .select("id")
    .single();

  const from = { id: chatId, first_name: "Олена", last_name: "Бот" };
  const chat = { id: chatId, type: "private" };
  const post = async (update: Record<string, unknown>, secret = "flow-test-secret") => {
    const response = await request.post("/api/telegram/webhook", {
      headers: { "x-telegram-bot-api-secret-token": secret },
      data: { update_id: updateId++, ...update },
    });
    return { status: response.status(), body: await response.json() };
  };
  const message = (extra: Record<string, unknown>) => ({ message: { message_id: updateId, chat, from, ...extra } });
  const employerChat = { id: employerChatId, type: "private" };
  const employerFrom = { id: employerChatId, first_name: "Власник" };
  const tap = (data: string) => ({ callback_query: { id: `cb${updateId}`, from, data, message: { message_id: 1, chat } } });
  const texts = (body: { actions: Array<{ method: string; payload: { text?: string } }> }) =>
    body.actions.filter((action) => action.method === "sendMessage").map((action) => action.payload.text ?? "");

  try {
    expect((await post(message({ text: `/start ${slug}` }), "wrong")).status).toBe(401);

    // Employer links Telegram notifications from the cabinet.
    const { data: auth } = await createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      .auth.signInWithPassword({ email, password: employerPassword });
    const linkResponse = await request.post("/api/hiring/notifications", {
      headers: { Authorization: `Bearer ${auth.session!.access_token}` },
      data: { action: "link" },
    });
    const { url: linkUrl } = await linkResponse.json();
    expect(linkUrl.startsWith("https://t.me/DecivioTestBot?start=e_")).toBe(true);
    const linkPayload = new URL(linkUrl).searchParams.get("start");
    const linked = await post({ message: { message_id: 1, chat: employerChat, from: employerFrom, text: `/start ${linkPayload}` } });
    expect(texts(linked.body)[0]).toContain("Сповіщення Decivio підключено");

    const start = await post(message({ text: `/start ${slug}` }));
    expect(texts(start.body)[0]).toContain("Бариста &lt;Поділ&gt;");
    expect(texts(start.body)[1]).toContain("Питання 1 з 3");

    // Stale or wrong-step taps are ignored; a valid tap moves to the next question.
    expect(texts((await post(tap("a:1:0"))).body)).toEqual([]);
    expect(texts((await post(tap("a:0:0"))).body)[0]).toContain("Питання 2 з 3");
    expect(texts((await post(message({ text: "щось інше" }))).body)[0]).toContain("оберіть варіант");
    expect(texts((await post(message({ text: "1–3 роки" }))).body)[0]).toContain("Питання 3 з 3");
    expect(texts((await post(message({ text: "Два роки бариста" }))).body)[0]).toContain("Як до вас звертатися");
    expect(texts((await post(tap("n:me"))).body)[0]).toContain("номер телефону");
    const done = await post(message({ contact: { phone_number: "380671234567", user_id: chatId } }));
    const sent = done.body.actions.filter((action: { method: string }) => action.method === "sendMessage");
    const employerMessage = sent.find((action: { payload: { chat_id: number } }) => action.payload.chat_id === employerChatId);
    const candidateMessage = sent.find((action: { payload: { chat_id: number } }) => action.payload.chat_id === chatId);
    expect(candidateMessage.payload.text).toContain("Відгук на вакансію");
    expect(employerMessage.payload.text).toContain("Сильний кандидат");
    expect(employerMessage.payload.text).toContain("+380671234567");

    const { data: applications } = await admin.from("hiring_applications").select("*").eq("vacancy_id", vacancy!.id);
    expect(applications).toHaveLength(1);
    expect(applications![0]).toMatchObject({
      source: "telegram",
      candidate_name: "Олена Бот",
      candidate_phone: "+380671234567",
      telegram_user_id: chatId,
    });
    expect(applications![0].screening).not.toBeNull();

    // Employer publishes interview slots, then taps "Запросити" in the notification; other chats cannot change statuses.
    await admin
      .from("hiring_vacancies")
      .update({ interview: { location: "Кав'ярня на Подолі", slots: [`${tomorrow}T10:00`, `${tomorrow}T11:00`] } })
      .eq("id", vacancy!.id);
    const inviteData = employerMessage.payload.reply_markup.inline_keyboard[0][0].callback_data as string;
    const foreign = await post(tap(inviteData));
    expect(foreign.body.actions[0].payload.text).toContain("не підключено");
    const invited = await post({ callback_query: { id: "cb-invite", from: employerFrom, data: inviteData, message: { message_id: 7, chat: employerChat } } });
    expect(invited.body.actions[0].payload.text).toContain("Запрошено");
    const { data: afterInvite } = await admin.from("hiring_applications").select("status").eq("vacancy_id", vacancy!.id).single();
    expect(afterInvite!.status).toBe("invited");

    // The candidate gets slot buttons in Telegram and books one; the employer is notified.
    const slotInvite = invited.body.actions.find((action: { payload: { chat_id?: number } }) => action.payload.chat_id === chatId);
    expect(slotInvite.payload.text).toContain("Вас запрошують на співбесіду");
    const slotButton = slotInvite.payload.reply_markup.inline_keyboard[0][0];
    const stranger = await post({ callback_query: { id: "cb-stranger", from: { id: 42, first_name: "Хтось" }, data: slotButton.callback_data, message: { message_id: 9, chat: { id: 42, type: "private" } } } });
    expect(stranger.body.actions[0].payload.text).toContain("не знайдено");
    const booked = await post(tap(slotButton.callback_data));
    expect(booked.body.actions[0].payload.text).toBe("Записано!");
    expect(booked.body.actions.some((action: { payload: { chat_id?: number; text?: string } }) => action.payload.chat_id === employerChatId && action.payload.text?.includes("записався"))).toBe(true);
    const { data: afterBooking } = await admin.from("hiring_applications").select("interview_slot").eq("vacancy_id", vacancy!.id).single();
    expect(afterBooking!.interview_slot).toBe(`${tomorrow}T10:00`);

    const again = await post(message({ text: `/start ${slug}` }));
    expect(texts(again.body)[0]).toContain("вже відгукнулися");
  } finally {
    await admin.from("telegram_sessions").delete().eq("chat_id", chatId);
    await admin.from("employer_notification_settings").delete().eq("user_id", userId);
    await admin.auth.admin.deleteUser(userId);
  }
});

async function answerApplication(page: Page, choices: string[]) {
  for (const choice of choices) {
    await page.getByRole("button", { name: choice, exact: true }).click();
  }
}

test("employer creates a vacancy, candidate applies, employer sees a scored candidate", async ({ browser }) => {
  const admin = getAdminClient();
  const email = `flow-${randomUUID().slice(0, 8)}@decivio.test`;
  const password = `Flow-${randomUUID().slice(0, 12)}A1`;
  const { data: created, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  expect(error).toBeNull();
  const userId = created.user!.id;

  try {
    const employer = await browser.newPage();

    // 1. Guest describes the position and gets an AI draft.
    await employer.goto("/hire/new");
    await employer.getByPlaceholder(/Наприклад/).fill("Бариста в кав'ярню біля метро, графік 2/2");
    await employer.getByRole("button", { name: /Створити вакансію/ }).last().click();
    await expect(employer.getByRole("heading", { name: /Вакансія готова/ })).toBeVisible();

    // 2. Publishing asks to sign in; after login the draft is published automatically.
    await employer.getByRole("button", { name: /Опублікувати/ }).first().click();
    const dialog = employer.getByRole("dialog");
    await dialog.getByRole("button", { name: "Увійти", exact: true }).click();
    await dialog.locator('input[type="email"]').fill(email);
    await dialog.locator('input[type="password"]').fill(password);
    await dialog.getByTestId("auth-submit").click();
    await expect(employer).toHaveURL(/\/hire\/[0-9a-f-]+\?created=1/);
    await expect(employer.getByText("Вакансія опублікована")).toBeVisible();

    const applyUrl = await employer.locator("span", { hasText: "/apply/" }).first().innerText();
    expect(applyUrl).toMatch(/\/apply\/[a-z0-9]+$/);

    // 3. Candidate applies from a phone.
    const candidateContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const candidate = await candidateContext.newPage();
    await candidate.goto(new URL(applyUrl).pathname);
    await candidate.getByRole("button", { name: "Відгукнутися за 2 хвилини" }).click();
    await answerApplication(candidate, ["Так", "До 30 хвилин", "1–3 роки", "Одразу"]);
    await candidate.getByPlaceholder("Кілька слів буде достатньо").fill("Два роки працювала баристою");
    await candidate.getByRole("button", { name: "Далі" }).click();
    await candidate.getByPlaceholder("Ваше ім'я").fill("Олена Тестова");
    await candidate.getByPlaceholder(/Телефон/).fill("067 123 45 67");
    await candidate.getByRole("button", { name: "Надіслати відгук" }).click();
    await expect(candidate.getByText("Відгук надіслано!")).toBeVisible();
    await candidateContext.close();

    // 4. Employer sees the candidate ranked as a strong match.
    await employer.reload();
    await expect(employer.getByText("Олена Тестова")).toBeVisible();
    await expect(employer.getByText("Дзвонити першим").first()).toBeVisible();

    // 5. Free plan allows only one active vacancy.
    const { data: session } = await createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      .auth.signInWithPassword({ email, password });
    const vacancyId = new URL(employer.url()).pathname.split("/").pop();
    const detail = await employer.request.get(`/api/hiring/vacancies/${vacancyId}`, {
      headers: { Authorization: `Bearer ${session.session!.access_token}` },
    });
    const { vacancy } = await detail.json();
    const second = await employer.request.post("/api/hiring/vacancies", {
      headers: { Authorization: `Bearer ${session.session!.access_token}` },
      data: { content: vacancy.content, brief: "друга вакансія" },
    });
    expect(second.status()).toBe(402);

    // 6. Employer invites the web candidate; the candidate books a slot by link.
    const authHeaders = { Authorization: `Bearer ${session.session!.access_token}` };
    await employer.request.patch(`/api/hiring/vacancies/${vacancyId}`, {
      headers: authHeaders,
      data: { interview: { location: "Офіс", slots: [`${tomorrow}T14:00`, `${tomorrow}T15:00`] } },
    });
    const { applications } = await (await employer.request.get(`/api/hiring/vacancies/${vacancyId}`, { headers: authHeaders })).json();
    const invite = await employer.request.patch(`/api/hiring/applications/${applications[0].id}`, { headers: authHeaders, data: { status: "invited" } });
    const { interviewUrl, sentToTelegram } = await invite.json();
    expect(sentToTelegram).toBe(false);

    const bookingContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const booking = await bookingContext.newPage();
    await booking.goto(new URL(interviewUrl).pathname);
    await expect(booking.getByText("вас запрошують на співбесіду")).toBeVisible();
    await booking.getByRole("button", { name: "15:00", exact: true }).click();
    await booking.getByRole("button", { name: /Записатися на/ }).click();
    await expect(booking.getByText("Ви записані")).toBeVisible();
    const invalid = await booking.request.post(`${new URL(interviewUrl).pathname.replace("/interview/", "/api/interview/")}`, { data: { slot: "2000-01-01T10:00" } });
    expect(invalid.status()).toBe(409);
    await bookingContext.close();

    const { data: bookedRow } = await admin.from("hiring_applications").select("interview_slot").eq("id", applications[0].id).single();
    expect(bookedRow!.interview_slot).toBe(`${tomorrow}T15:00`);

    // 7. Deleting the vacancy removes its candidates.
    expect((await employer.request.delete(`/api/hiring/vacancies/${vacancyId}`, { headers: authHeaders })).status()).toBe(200);
    expect((await employer.request.get(`/api/hiring/vacancies/${vacancyId}`, { headers: authHeaders })).status()).toBe(404);
    const { count: leftover } = await admin.from("hiring_applications").select("id", { count: "exact", head: true }).eq("vacancy_id", vacancyId!);
    expect(leftover).toBe(0);
  } finally {
    await admin.auth.admin.deleteUser(userId);
  }
});
