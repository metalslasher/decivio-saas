import { defineConfig } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";

const port = Number(process.env.PORT ?? 3000);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;
const inheritedEnv = Object.fromEntries(
  Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === "string")
);
const flowEnv = readOptionalEnvFile(".env.flow.local");
const localEnv = readOptionalEnvFile(".env.local");
const flowSupabaseEnv = Object.fromEntries(
  [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY"
  ].flatMap((key) => {
    const value = getFlowEnvValue(key);
    return value ? [[key, value]] : [];
  })
);

function readOptionalEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return {};
  }

  const entries: Record<string, string> = {};
  const content = readFileSync(filePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");

    if (key) {
      entries[key] = value;
    }
  }

  return entries;
}

function getFlowEnvValue(key: string) {
  return process.env[`DECIVIO_FLOW_${key}`] ?? flowEnv[key] ?? inheritedEnv[key] ?? localEnv[key];
}

// Test files talk to Supabase directly (creating and cleaning up test users), so expose the same values to workers.
for (const [key, value] of Object.entries(flowSupabaseEnv)) {
  process.env[key] = value;
}

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
      TELEGRAM_WEBHOOK_SECRET: "flow-test-secret",
      NEXT_PUBLIC_SITE_URL: baseURL,
      ...flowSupabaseEnv
    }
  }
});
