import type { Metadata } from "next";
import { redirect } from "next/navigation";

import CheckoutClient from "@/components/checkout/CheckoutClient";
import { getAddresses } from "@/lib/addresses";
import { requireAuth } from "@/lib/auth";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const { user, token } = await requireAuth("/checkout");

  // 注文にはメール認証が必須（Laravel 側 verified ミドルウェア）。
  // 未認証なら先に /verify-email へ誘導する。
  if (!user.email_verified) {
    redirect("/verify-email");
  }

  const addresses = await getAddresses(token);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-medium tracking-[0.15em] uppercase">Checkout</h1>
      <CheckoutClient addresses={addresses} />
    </div>
  );
}
