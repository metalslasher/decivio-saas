# Product Concept

Status: approved direction since 2026-10-16 (pivot from the B2C career workspace).

This is the strategic source of truth. If code, copy, or another doc conflicts with it, this doc wins until it is deliberately changed.

## One Sentence

Decivio is an AI hiring assistant for Ukrainian small and medium businesses without an HR department: describe who you need, get a ready vacancy and a smart application link, and receive a ranked shortlist of candidates instead of a pile of raw responses.

## Why This Direction

Research from 2026-10 (sources in the pivot discussion, summarised here):

- Ukrainian job seekers rarely pay for online services (63% never paid in 2026; only 6% pay for AI). A paid B2C career tool fights free ChatGPT and free AI features in robota.ua.
- Employers have the pain and the budget: 69% of industrial firms name labour shortage as the main obstacle, unfilled vacancies and fast new-hire churn cost more than salaries, and businesses already pay job boards for postings.
- Small businesses (cafes, retail, logistics, construction, services, production) hire constantly, have no recruiter, and do screening by phone manually.

Payments: Ukrainian FOP + monobank acquiring is enough because buyers are Ukrainian businesses paying in UAH. International merchant-of-record platforms are out of scope.

## Target Customer

Primary: owner or manager of a business with 5–150 employees who personally hires frontline staff.

Typical roles: barista, cook, waiter, seller-consultant, cashier, courier, driver, warehouse worker, loader, packer, builder, electrician, welder, administrator, call-center operator, sales manager, accountant assistant.

Not the target (for now): enterprise HR teams, IT recruiting, recruitment agencies, job seekers.

## Core Promise (Wow Moment)

```text
Describe the position in one sentence → in 30 seconds get a strong vacancy text, a fair pay hint, and a smart application link.
Share the link anywhere (Work.ua, OLX, Telegram, Instagram, a poster with QR) → every candidate answers short screening questions from the phone in 2 minutes → Decivio scores each one and shows who to call first and what to ask.
```

The employer stops reading 80 identical responses and calling people who do not fit the schedule, the district, or the pay.

## Product Loop (MVP)

1. **Vacancy builder** (`/hire/new`, no registration needed to try): free-text brief → AI returns title, ready-to-post vacancy text, pay hint with caveat, must-have requirements, 4–6 screening questions (some are knockout), and red flags.
2. **Publish** (registration required here): vacancy is saved and gets a public link `/apply/<slug>`.
3. **Candidate application** (`/apply/<slug>`): mobile-first, one question per screen, no registration, name + phone + answers, ≤2 minutes.
4. **AI screening**: every application gets score 0–100, verdict (call / maybe / reject), strengths, risks, knockout failures, and 2–3 questions for the phone interview.
5. **Shortlist** (`/hire/<id>`): candidates sorted by score with statuses (new → invited → hired / rejected), one-tap call, copy link, ready posting texts.

## Monetization

- **Free**: 1 active vacancy, up to 10 AI-screened candidates. Enough to feel the value.
- **Pro (main)**: ~990 UAH/month — up to 5 active vacancies, unlimited screening.
- **Business (later)**: ~2490 UAH/month — more vacancies, team access, Telegram bot, branding.
- Pay through existing monobank acquiring (`src/lib/mono-acquiring.ts`).

Prices are hypotheses; validate with the first 10 paying businesses.

## Moat Ideas (later iterations)

- Telegram bot channel for candidates (blue-collar candidates live in Telegram/Viber).
- Auto-replies and interview scheduling for candidates.
- Pay benchmarks from accumulated vacancies by city/role.
- Posting helpers / integrations for Work.ua and OLX.
- Retention module: onboarding checklist for new hires (churn is a big hidden cost).

## Guardrails

- Never discriminate: no questions or scoring on age, gender, family status, health, nationality, appearance. The AI prompt must enforce this; reservation status (бронювання) and military registration are allowed only as factual questions the employer explicitly adds.
- AI recommends, the human decides. No auto-rejection messages without the employer's action.
- Candidate personal data (name, phone) is visible only to the vacancy owner.
- Do not add features that do not shorten time-to-hire for a small business.
- Keep the candidate flow under 2 minutes and fully usable on a cheap Android phone.

## Success Metrics

- Visitor → vacancy draft generated.
- Draft → published (registration).
- Published vacancy → ≥5 applications within 7 days.
- Employer opens shortlist and changes at least one candidate status.
- Free → Pro conversion; target first 10 paying businesses before scaling ads.
