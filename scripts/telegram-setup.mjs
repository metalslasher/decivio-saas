// Connects the Telegram bot to the deployed site.
// Usage: node scripts/telegram-setup.mjs https://your-domain.com
// Needs TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET in the environment (or in .env.local).

import { existsSync, readFileSync } from "node:fs";

function readEnvFile(path) {
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
      .map((line) => [line.slice(0, line.indexOf("=")).trim(), line.slice(line.indexOf("=") + 1).trim()]),
  );
}

const fileEnv = readEnvFile(".env.local");
const token = process.env.TELEGRAM_BOT_TOKEN ?? fileEnv.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET ?? fileEnv.TELEGRAM_WEBHOOK_SECRET;
const siteUrl = process.argv[2];

if (!token || !secret || !siteUrl?.startsWith("https://")) {
  console.error("Usage: node scripts/telegram-setup.mjs https://your-domain.com (TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET required)");
  process.exit(1);
}

async function call(method, payload) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  console.log(method, body.ok ? "ok" : body.description);
  return body;
}

await call("setWebhook", {
  url: `${siteUrl.replace(/\/$/, "")}/api/telegram/webhook`,
  secret_token: secret,
  allowed_updates: ["message", "callback_query"],
  drop_pending_updates: true,
});
await call("setMyCommands", {
  commands: [
    { command: "start", description: "Почати" },
    { command: "cancel", description: "Скасувати відгук" },
  ],
});
await call("setMyDescription", {
  description: "Відгукуйтеся на вакансії за 2 хвилини — без резюме і реєстрації. Відкрийте посилання з оголошення, щоб почати.",
});
const me = await call("getMe", {});
if (me.ok) {
  console.log(`\nBot username: @${me.result.username}`);
  console.log(`Set NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=${me.result.username} in Vercel and redeploy.`);
}
