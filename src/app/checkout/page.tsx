import { redirect } from "next/navigation";
import { getPricingPurchaseHref, getPricingPlan } from "@/lib/pricing";
import { createMetadata } from "@/lib/seo";

type CheckoutPageProps = {
  searchParams?: Promise<{
    plan?: string;
    checkout?: string;
  }>;
};

export const metadata = createMetadata({
  title: "Оформлення доступу",
  description: "Службовий редірект оформлення доступу до Decivio.",
  path: "/checkout",
  noIndex: true
});

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const resolvedSearchParams = await searchParams;
  const requestedPlanId = typeof resolvedSearchParams?.plan === "string" ? resolvedSearchParams.plan : null;
  const plan = getPricingPlan(requestedPlanId);
  const checkoutId = typeof resolvedSearchParams?.checkout === "string" ? resolvedSearchParams.checkout : null;

  if (checkoutId) {
    const params = new URLSearchParams({
      plan: plan.id,
      checkout: checkoutId
    });

    redirect(`/billing/return?${params.toString()}`);
  }

  if (requestedPlanId) {
    redirect(getPricingPurchaseHref(plan.id));
  }

  redirect("/pricing");
}
