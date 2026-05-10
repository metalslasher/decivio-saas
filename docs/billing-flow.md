# Billing Flow

Status: current checkout and paid-access behavior.

## Goal

The user should never feel stuck after payment. Every return from mono must lead to one of these clear states:

- access is active and the dashboard can be opened;
- payment is still waiting or processing and the status can be checked again;
- payment failed, expired, was canceled, or was reversed and a new payment can be created.

## Current Flow

1. User selects a paid plan on `/pricing`.
2. If the user is not authenticated, the auth dialog opens before payment.
3. `/api/payments/mono/checkout` creates a checkout for the authenticated user.
4. The user is sent to mono or, in local test mode, directly to `/billing/return`.
5. `/billing/return` checks `/api/payments/mono/checkout/[checkoutId]`.
6. The status endpoint may poll mono in production, then reads the latest subscription/access row.
7. The dashboard link is shown only when the checkout is successful and active subscription access exists.

## Status Behavior

- `pending`: mono has not confirmed the payment yet; user can check again or reopen the current payment.
- `processing`: mono is processing the payment; page polls for a limited time, then lets the user check manually.
- `paid`: one-time invoice succeeded and annual Pro access should be active.
- `active`: subscription succeeded and monthly Pro access should be active.
- `failed`: payment failed; user can create a new payment.
- `expired`: invoice expired; user can create a new payment.
- `canceled`: subscription was canceled; access is active only if the subscription row still has a future `current_period_end`.
- `reversed`: payment was returned; access is not opened without a new successful payment.

## Local Test Mode

`DECIVIO_TEST_MODE=1` must not call real mono APIs.

The checkout endpoint supports test-only status simulation through `testCheckoutStatus` in the JSON body:

```json
{
  "planId": "annual",
  "testCheckoutStatus": "failed"
}
```

Supported annual invoice test statuses:

- `pending`
- `processing`
- `paid`
- `failed`
- `expired`
- `reversed`

Supported monthly subscription test statuses:

- `pending`
- `processing`
- `active`
- `canceled`
- `failed`

The default local test status remains successful: `paid` for annual and `active` for monthly.

## Production Notes

- The canonical production domain is `https://www.decivio.net`.
- Production should use real mono checkout URLs and real mono webhooks/status polling.
- Checkout creation is accepted only from the configured Decivio origin; cross-site browser origins are rejected.
- Before opening access, mono status data must match the local checkout amount, currency, provider target, and plan interval/reference where available.
- Mono webhook responses do not expose internal errors to callers; mismatched signed payment details are logged and ignored without granting access.
- pRRO/fiscalization is a separate setup topic and should be confirmed before real payment launch.
- Do not rely on registration alone for dashboard access; access must come from active subscription state.
