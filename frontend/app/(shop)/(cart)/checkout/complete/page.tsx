import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import CheckoutComplete from "@/components/checkout/CheckoutComplete";
import { requireAuth } from "@/lib/auth";
import { getMyOrder } from "@/lib/orders";

export const metadata: Metadata = { title: "Order Complete" };

type PageProps = { searchParams: Promise<{ order?: string }> };

export default async function CheckoutCompletePage({ searchParams }: PageProps) {
  const { order: orderNumber } = await searchParams;
  if (!orderNumber) redirect("/account/orders");

  const { token } = await requireAuth(`/checkout/complete?order=${orderNumber}`);
  const order = await getMyOrder(token, orderNumber);
  if (!order) redirect("/account/orders");

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center px-6 py-16">
      {/* CheckoutComplete は useSearchParams（redirect_status）を読むので Suspense 境界が必要 */}
      <Suspense fallback={null}>
        <CheckoutComplete initial={order} />
      </Suspense>
    </div>
  );
}
