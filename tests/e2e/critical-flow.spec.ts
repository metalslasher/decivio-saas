import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function readLocalEnvValue(key: string) {
  if (process.env[key]) {
    return process.env[key];
  }

  try {
    const envFile = readFileSync(".env.local", "utf8");
    const match = envFile.match(new RegExp(`^${key}=(.*)$`, "m"));
    return match?.[1]?.trim().replace(/^['"]|['"]$/g, "") || undefined;
  } catch {
    return undefined;
  }
}

async function createLocalTestAccessToken() {
  const supabaseUrl = readLocalEnvValue("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = readLocalEnvValue("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Local Supabase env vars are required for billing flow tests.");
  }

  const uniqueId = Date.now();
  const email = `billing-${uniqueId}@decivio.test`;
  const password = `DecivioBilling!${uniqueId}`;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const signUpResponse = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: `Billing Test ${uniqueId}`
      }
    }
  });

  if (signUpResponse.error) {
    throw signUpResponse.error;
  }

  if (signUpResponse.data.session?.access_token) {
    return signUpResponse.data.session.access_token;
  }

  const signInResponse = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInResponse.error) {
    throw signInResponse.error;
  }

  const accessToken = signInResponse.data.session?.access_token;
  if (!accessToken) {
    throw new Error("Could not create a local billing test session.");
  }

  return accessToken;
}

test("guest can simulate, register before checkout, pay in local test mode, and open dashboard", async ({ page }) => {
  const uniqueId = Date.now();
  const email = `flow-${uniqueId}@decivio.test`;
  const password = `DecivioTest!${uniqueId}`;

  await page.goto("/simulate");

  await page.locator("#current-income").fill("45000");
  await page.getByRole("button", { name: "Далі" }).click();

  await page.locator("#current-role").fill("Маркетолог");
  await page.locator("#current-experience-years").fill("5");
  await page.getByRole("button", { name: "Далі" }).click();

  await page.locator("#target-role").fill("Product Manager");
  await page.locator("#experience-level").selectOption("basic");
  await page.getByRole("button", { name: "Далі" }).click();

  await page.locator("#english-level").selectOption("intermediate");
  await page.locator("#target-market").selectOption("ukraine");
  await page.locator("#transition-priority").selectOption("income");
  await page.getByRole("button", { name: /Отримати мій висновок/ }).click();

  await expect(page).toHaveURL(/\/results\?simulationId=/, { timeout: 60_000 });
  await expect(page.getByText("тестовий прогноз переходу готовий")).toBeVisible();

  await page.getByRole("link", { name: "Перейти до тарифів" }).click();
  await expect(page).toHaveURL(/\/pricing/);

  await page.getByTestId("pricing-purchase-annual").click();

  const authDialog = page.getByRole("dialog");
  await expect(authDialog).toBeVisible();
  await authDialog.getByLabel(/Ім/).fill(`Flow Test ${uniqueId}`);
  await authDialog.getByLabel("Електронна пошта").fill(email);
  await authDialog.locator('input[type="password"]').nth(0).fill(password);
  await authDialog.locator('input[type="password"]').nth(1).fill(password);
  await authDialog.getByTestId("auth-submit").click();

  await expect(page).toHaveURL(/\/billing\/return\?plan=annual&checkout=/, { timeout: 60_000 });
  await expect(page.getByTestId("billing-dashboard-link")).toBeVisible({ timeout: 30_000 });

  await page.getByTestId("billing-dashboard-link").click();
  await expect(page).toHaveURL(/\/dashboard\?view=access/);
  await expect(page.getByText("Кабінет доступний після оплати.")).toHaveCount(0);
});

test("local test mode keeps unresolved or failed billing states from granting access", async ({ request }) => {
  const accessToken = await createLocalTestAccessToken();
  const scenarios: Array<{
    planId: "annual" | "monthly";
    testCheckoutStatus: "pending" | "failed" | "expired" | "canceled";
    expectedStatus: "pending" | "failed" | "expired" | "canceled";
  }> = [
    { planId: "annual", testCheckoutStatus: "pending", expectedStatus: "pending" },
    { planId: "annual", testCheckoutStatus: "failed", expectedStatus: "failed" },
    { planId: "annual", testCheckoutStatus: "expired", expectedStatus: "expired" },
    { planId: "monthly", testCheckoutStatus: "canceled", expectedStatus: "canceled" }
  ];

  for (const scenario of scenarios) {
    const checkoutResponse = await request.post("/api/payments/mono/checkout", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      data: {
        planId: scenario.planId,
        testCheckoutStatus: scenario.testCheckoutStatus
      }
    });

    expect(checkoutResponse.ok()).toBeTruthy();
    const checkout = (await checkoutResponse.json()) as {
      checkoutId?: string;
      status?: string;
      testMode?: boolean;
    };

    expect(checkout.testMode).toBe(true);
    expect(checkout.checkoutId).toBeTruthy();

    const statusResponse = await request.get(`/api/payments/mono/checkout/${checkout.checkoutId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    expect(statusResponse.ok()).toBeTruthy();
    const statusPayload = (await statusResponse.json()) as {
      status: string;
      accessGranted: boolean;
    };

    expect(statusPayload.status).toBe(scenario.expectedStatus);
    expect(statusPayload.accessGranted).toBe(false);
  }
});
