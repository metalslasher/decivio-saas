import { expect, test, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { normalizePhone, parseVacancyContent } from "../../src/lib/hiring/validate";

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
  } finally {
    await admin.auth.admin.deleteUser(userId);
  }
});
