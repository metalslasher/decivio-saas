# Product Flow

Status: current public product flow. The dashboard internals are intentionally out of scope for this document.

## Correct User Path

1. User lands on `/`.
2. Header CTA "Оцінити перехід" opens `/simulate`.
3. User completes the four-step simulation without registration.
4. App creates a guest simulation and opens `/results?simulationId=<id>`.
5. Result page gives a useful first answer and sends the user to `/pricing`.
6. User chooses a plan.
7. If not authenticated, user signs up or logs in before checkout.
8. Guest simulation is attached to the authenticated account.
9. App creates a mono checkout.
10. After successful payment, user lands in `/dashboard` with paid access.

## Auth Rules

- Header "Вхід" opens login.
- Header CTA does not open registration; it sends users to the simulation.
- Registration should happen only when it is needed for checkout or account ownership.
- A user should not reach the paid dashboard without active paid access.

## Billing Rules

- Monthly plan: mono subscription.
- Annual plan: mono one-time invoice.
- Access is active when the checkout/subscription state is paid or active.
- Local E2E tests use a successful mock checkout; production must use real mono callbacks/status.

## What The Free Result Should Do

- Confirm that Decivio understood the user's current role, target role, market, English level, and priority.
- Show the main career-transition estimate in a compact, credible way.
- Explain the reasoning enough to build trust.
- Lead naturally to pricing for the full practical plan.

## What It Should Not Do

- Do not ask for registration before the simulation.
- Do not show the paid dashboard before payment.
- Do not keep old onboarding fields in active docs unless the product brings them back.
- Do not duplicate pricing/business logic in multiple docs; link back to this flow and the code.
