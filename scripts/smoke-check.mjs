// Post-deploy smoke check for production.
// Usage: node scripts/smoke-check.mjs https://www.decivio.net [--ai]
//   --ai  also generates one real vacancy draft (one OpenAI call, ~1 cent).
// Telegram webhook is checked when TELEGRAM_BOT_TOKEN is set in the environment.

const base = process.argv[2]?.replace(/\/$/, "");
const withAi = process.argv.includes("--ai");

if (!base?.startsWith("http")) {
  console.error("Usage: node scripts/smoke-check.mjs https://your-domain [--ai]");
  process.exit(1);
}

let failures = 0;

async function check(name, run) {
  try {
    const detail = await run();
    console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
  } catch (error) {
    failures += 1;
    console.log(`✗ ${name} — ${error.message}`);
  }
}

async function request(path, init) {
  const response = await fetch(`${base}${path}`, { redirect: "manual", ...init });
  const text = await response.text();
  return { status: response.status, text };
}

function expectStatus(result, expected, hint) {
  if (result.status !== expected) {
    throw new Error(`expected HTTP ${expected}, got ${result.status}${hint ? `. ${hint}` : ""}`);
  }
}

await check("Landing is the hiring product", async () => {
  const result = await request("/");
  expectStatus(result, 200);
  if (!result.text.includes("Наймайте")) throw new Error("old landing is still deployed (merge to main?)");
});

for (const path of ["/hire/new", "/pricing", "/roles/barista", "/privacy", "/terms"]) {
  await check(`Page ${path}`, async () => expectStatus(await request(path), 200));
}

await check("Sitemap lists role pages", async () => {
  const result = await request("/sitemap.xml");
  expectStatus(result, 200);
  if (!result.text.includes("/roles/")) throw new Error("role pages missing in sitemap");
});

await check("robots.txt hides the cabinet", async () => {
  const result = await request("/robots.txt");
  if (!result.text.includes("/hire/")) throw new Error("cabinet is not disallowed");
});

await check("Migration: hiring tables exist", async () =>
  expectStatus(await request("/apply/zzzzzzzz"), 404, "500 here usually means `supabase db push` was not run"),
);

await check("Migration: interview booking columns exist", async () =>
  expectStatus(await request("/interview/zzzzzzzzzzzzzzzz"), 404, "500 here usually means the latest migrations are missing"),
);

await check("Employer API requires auth", async () => expectStatus(await request("/api/hiring/vacancies"), 401));

await check("Draft API validates input", async () =>
  expectStatus(
    await request("/api/hiring/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brief: "x" }) }),
    400,
  ),
);

await check("Telegram webhook rejects requests without the secret", async () =>
  expectStatus(await request("/api/telegram/webhook", { method: "POST", body: "{}" }), 401),
);

if (withAi) {
  await check("AI vacancy draft (real OpenAI call)", async () => {
    const result = await request("/api/hiring/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief: "Бариста в кав'ярню, графік 2/2", city: "Київ" }),
    });
    expectStatus(result, 200, result.text.slice(0, 200));
    const { content } = JSON.parse(result.text);
    return `${content.title}, ${content.pay_hint}, ${content.questions.length} питань`;
  });
}

const token = process.env.TELEGRAM_BOT_TOKEN;
if (token) {
  await check("Telegram webhook is registered", async () => {
    const response = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const { result } = await response.json();
    if (result.url !== `${base}/api/telegram/webhook`) throw new Error(`webhook url is "${result.url || "empty"}" — run scripts/telegram-setup.mjs`);
    if (result.last_error_message) throw new Error(`last Telegram error: ${result.last_error_message}`);
    return `pending updates: ${result.pending_update_count}`;
  });
} else {
  console.log("· Telegram webhook not checked (set TELEGRAM_BOT_TOKEN to include it)");
}

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
