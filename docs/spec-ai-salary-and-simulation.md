ТЗ: AI-Salary Engine + AI-Simulation Inputs (Україна) + Вивід у Results
0) Ціль

Після онбордингу продукт має:

отримувати з OpenAI зарплатні діапазони і ринкові припущення для:

поточної ролі користувача в Україні

цільової ролі користувача в Україні

порівнювати потенціал “залишитись vs перейти”

будувати фінансову симуляцію (cashflow) і відображати на Results:

verdict (вигідно / умовно / ризиковано)

P25/Median/P75 по поточній і цільовій ролі

прогноз стартової вилки в цільовій ролі (для switcher)

break-even month, max drawdown, long-term delta

додати Pro upsell блоки (сценарії, план, day-in-the-life, резюме)

Фокус гео: Україна
Фокус формату: full-time → full-time (без фрілансу)

1) Вхідні дані з онбордингу (вже є + перевірити)

Потрібні поля (якщо чогось немає — додати):

current_role_text (string) — як ввів користувач (UA/EN)

target_role_text (string) — як ввів користувач (UA/EN)

current_monthly_income (number, UAH)

savings (number, UAH)

years_in_current_role (number або категорії 0–1 / 1–3 / 3–5 / 5+)

learning_hours_per_week (number)

timeframe_goal_months (number) — опціонально

readiness_to_income_drop (enum) — low/medium/high (якщо є)

english_level (опціонально, enum A2/B1/B2/C1+) — якщо вже додали, використати, якщо ні — пропустити

Важливо:

Користувач вводить роль у довільному вигляді. Нічого не нормалізуємо вручну.

Ми просто передаємо рядок в OpenAI та просимо “зрозуміти роль”.

2) Підхід: AI як джерело ринку (AI-only)
2.1. Що саме питаємо у OpenAI

OpenAI має повернути структуровану відповідь (JSON), яка містить:

Для кожної ролі (current_role_text, target_role_text):

canonical_title (string, англ або укр)

category (string) — узагальнена категорія (опційно)

ua_salary_ranges_by_level:

junior: p25, median, p75, currency=UAH

middle: p25, median, p75

senior: p25, median, p75

lead: p25, median, p75 (може бути null)

typical_level_by_years (map) — орієнтовно який рівень відповідає стажу (для оцінки поточної ролі)

typical_salary_growth_per_year_percent (number range) — базове припущення

notes / caveats (array)

confidence (0..1)

sources (array strings) — якщо доступно (навіть домени/назви)

Додатково для цільової ролі для switcher:

expected_entry_level_for_switcher (junior або junior_to_middle тощо)

time_to_first_job_months:

optimistic

base

pessimistic

probability_of_getting_job_within_12_months (0..1)

“what influences salary most” (3–5 bullets) — для пояснення на Results і як Pro-гачок

2.2. Важлива вимога

OpenAI має повернути один JSON, без тексту навколо, щоб ми могли парсити.

3) Архітектура інтеграції
3.1. Серверний endpoint

Створити API route:

POST /api/market-profile

Status: deprecated. The current product flow no longer uses this standalone endpoint and routes onboarding submissions through `/api/simulations`.

Input:

{
  "country": "UA",
  "current_role_text": "...",
  "target_role_text": "...",
  "years_in_current_role": 2,
  "learning_hours_per_week": 8,
  "english_level": "B1",
  "timeframe_goal_months": 12
}

Output:

{
  "market_profile": { ...OPENAI_JSON... }
}
3.2. Кешування (обов’язково, щоб не збанкрутувати)

Навіть якщо ти хочеш AI-only, кеш треба, інакше ти платитимеш за повтори.

Кешувати результат OpenAI на 30 днів по ключу:

country + current_role_text + target_role_text + english_level(optional)

Мінімальна таблиця:

market_profiles_cache

id

cache_key (unique)

payload (jsonb)

created_at

expires_at

Логіка:

якщо cache_key існує і expires_at > now → повернути кеш

інакше → зробити OpenAI запит, зберегти

4) Симуляція “залишитись vs перейти” (як використовувати дані OpenAI)
4.1. Оцінка поточного рівня користувача

Якщо є years_in_current_role:

визначити estimated_current_level:

0–1 → junior

1–3 → middle (або junior/middle edge)

3–5 → senior

5+ → senior/lead

Або використати typical_level_by_years з OpenAI.

Поточний “ринковий потенціал”:

показати на Results:
“Ваша поточна зарплата vs ринкова медіана вашого рівня”

current_income vs current_role_salary_median_for_estimated_level

4.2. Прогноз “залишитись”

старт: current_monthly_income

ріст: typical_salary_growth_per_year_percent (взяти base)

upper bound: p75 (для рівня + потенційного росту)

горизонт: horizon_months (вже є у моделі)

4.3. Прогноз “перейти”

фаза навчання/переходу: користувач працює full-time, але може бути “просадка/інвестиція часу”

точка першого працевлаштування: time_to_first_job_months.base

стартова зарплата в новій ролі: p25/median для expected_entry_level_for_switcher

ріст: typical_salary_growth_per_year_percent

4.4. Результати симуляції

Порахувати й зберегти:

break_even_month

max_drawdown

long_term_difference (за horizon)

cashflow_series_stay (array length horizon)

cashflow_series_transition (array length horizon)

Використати для нової Results сторінки.

5) Results UI: що показувати (оновлена структура + продаж)

На Results показати:

A) Verdict

На основі:

break_even_month

max_drawdown

savings

long_term_difference

(додатково) probability_of_getting_job_within_12_months

Три статуси:

Вигідно / Умовно / Ризиковано

B) 3 ключові метрики

Окупність: X міс

Максимальна просадка: –Y грн

Різниця за N міс: +Z грн

C) Графік “Залишитись vs Перейти”
D) “Порівняння зарплатних потенціалів”

Два блоки:

Поточна роль (UA):

estimated level

p25 / median / p75 (UAH)

“ваша зарплата зараз: X”

“ринкова медіана для вашого рівня: Y”

індикатор: нижче/в межах/вище ринку

Цільова роль (UA):

expected entry level for switcher

p25 / median / p75 для entry рівня

time_to_first_job (base)

probability within 12 months

Це критично: користувач має бачити “чому цифри такі”.

E) Risk panel

savings vs max_drawdown

“не вистачає / достатньо”

F) Pro upsell (конверсія)

Показати, що в free:

1 сценарій (ця цільова роль)

базова симуляція

базові зарплатні вилки

Pro:

3 сценарії (порівняння різних ролей)

персональний план переходу (6–12 місяців)

day-in-the-life

генератор резюме

список навичок + шлях навчання

підбір вакансій (пізніше)

CTA: “Розблокувати Pro”

6) OpenAI інтеграція: вимоги до реалізації
6.1. Ключі і безпека

OpenAI API key зберігати тільки на сервері (.env)

ніколи не віддавати ключ на клієнт

6.2. Формат відповіді: строгий JSON

Використати structured output (json schema) або “response_format: json” (в залежності від SDK/версії).

6.3. Модель

Використати одну модель (щоб простіше):

GPT-4.1 або GPT-4o (що доступно на твоєму тарифі/аккаунті)
Важливо: якщо tools/web-search недоступні в API у твоєму сетапі — тоді працюємо без джерел, але з lower confidence.

7) Логування і дебаг

Додати лог:

чи був cache hit

час відповіді

confidence

помилки парсингу JSON

Якщо OpenAI повернув невалідний JSON:

повторити 1 раз з “Відповідай тільки валідним JSON”

якщо знову fail — показати fallback повідомлення

8) Deliverables (що Codex має зробити)

Deprecated historical note: `/api/market-profile` was an intermediate design idea. The active flow now calls `/api/simulations` directly after onboarding.

Модифікація симуляції: використовувати дані market_profile

Оновлення results сторінки: додати блоки зарплатних вилок та порівняння “ви vs ринок”

Додати Pro upsell блоки

Додати error/loading states
