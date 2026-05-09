import { defineConfig } from "@playwright/test";

const port = Number(process.env.PORT ?? 3000);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;
const inheritedEnv = Object.fromEntries(
  Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === "string")
);

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "critical-flow.spec.ts",
  timeout: 120_000,
  expect: {
    timeout: 15_000
  },
  use: {
    baseURL,
    trace: "on-first-retry",
    video: "retain-on-failure"
  },
  webServer: {
    command: `npm run dev -- -p ${port}`,
    url: baseURL,
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "1",
    timeout: 120_000,
    env: {
      ...inheritedEnv,
      DECIVIO_TEST_MODE: "1",
      NEXT_PUBLIC_SITE_URL: baseURL
    }
  }
});
