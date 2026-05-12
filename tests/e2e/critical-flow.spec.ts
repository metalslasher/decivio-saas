import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import {
  getInvoiceCheckoutMismatch,
  getSubscriptionCheckoutMismatch
} from "../../src/lib/billing-security";
import {
  applyManualFullAccess,
  hasManualFullAccess
} from "../../src/lib/manual-full-access";

test("manual full-access email resolves to active Pro access", () => {
  expect(hasManualFullAccess(" T0MMY.V4SK1S@GMAIL.COM ")).toBe(true);
  expect(hasManualFullAccess("other@example.com")).toBe(false);

  expect(
    applyManualFullAccess("t0mmy.v4sk1s@gmail.com", {
      plan: "free",
      status: "free",
      currentPeriodEnd: null
    })
  ).toEqual({
    plan: "pro",
    status: "active",
    currentPeriodEnd: null
  });
});

test("billing security helpers reject mismatched provider payment details", () => {
  const annualCheckout = {
    id: "checkout_annual",
    plan_id: "annual" as const,
    billing_kind: "one_time" as const,
    amount: 478800,
    ccy: 980,
    mono_invoice_id: "invoice_1",
    mono_subscription_id: null
  };

  expect(
    getInvoiceCheckoutMismatch(annualCheckout, {
      invoiceId: "invoice_1",
      status: "success",
      amount: 478800,
      ccy: 980,
      finalAmount: 478800,
      reference: "checkout_annual"
    })
  ).toBeNull();

  expect(
    getInvoiceCheckoutMismatch(annualCheckout, {
      invoiceId: "invoice_1",
      status: "success",
      amount: 100,
      ccy: 980,
      finalAmount: 100,
      reference: "checkout_annual"
    })
  ).toBe("invoice_amount_mismatch");

  expect(
    getInvoiceCheckoutMismatch(annualCheckout, {
      invoiceId: "invoice_1",
      status: "success",
      amount: 478800,
      ccy: 980,
      finalAmount: 478800,
      reference: "other_checkout"
    })
  ).toBe("invoice_reference_mismatch");

  const monthlyCheckout = {
    id: "checkout_monthly",
    plan_id: "monthly" as const,
    billing_kind: "subscription" as const,
    amount: 79900,
    ccy: 980,
    mono_invoice_id: null,
    mono_subscription_id: "subscription_1"
  };

  expect(
    getSubscriptionCheckoutMismatch(monthlyCheckout, {
      subscriptionId: "subscription_1",
      status: "active",
      startDate: "2026-05-10T09:00:00.000Z",
      amount: 79900,
      ccy: 980,
      interval: "1m"
    })
  ).toBeNull();

  expect(
    getSubscriptionCheckoutMismatch(monthlyCheckout, {
      subscriptionId: "subscription_1",
      status: "active",
      startDate: "2026-05-10T09:00:00.000Z",
      amount: 79900,
      ccy: 840,
      interval: "1m"
    })
  ).toBe("subscription_currency_mismatch");

  expect(
    getSubscriptionCheckoutMismatch(monthlyCheckout, {
      subscriptionId: "subscription_1",
      status: "active",
      startDate: "2026-05-10T09:00:00.000Z",
      amount: 79900,
      ccy: 980,
      interval: "1y"
    })
  ).toBe("subscription_interval_mismatch");
});

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

test("checkout creation rejects hostile browser origins", async ({ request }) => {
  const accessToken = await createLocalTestAccessToken();
  const response = await request.post("/api/payments/mono/checkout", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Origin: "https://evil.example"
    },
    data: {
      planId: "annual"
    }
  });

  expect(response.status()).toBe(403);
  const payload = (await response.json()) as { error?: string };
  expect(payload.error).toContain("Decivio");
});
