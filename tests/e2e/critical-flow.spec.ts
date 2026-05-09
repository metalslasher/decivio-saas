import { expect, test } from "@playwright/test";

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
