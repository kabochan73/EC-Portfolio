"use client";

import Link from "next/link";

import CartLine from "@/components/cart/CartLine";
import CartSummary from "@/components/cart/CartSummary";
import { useCartValidation } from "@/lib/hooks/useCartValidation";
import { CART_MAX_QUANTITY_PER_LINE } from "@/lib/constants";
import { useCartStore } from "@/lib/stores/cart";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const { getValidation } = useCartValidation(items);

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="text-xs tracking-[0.2em] text-graphite uppercase">Your cart is empty</p>
        <Link
          href="/"
          className="mt-8 border border-ink px-6 py-3 text-xs tracking-[0.2em] uppercase transition-opacity hover:opacity-60"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  let subtotal = 0;
  let blocked = false;
  for (const item of items) {
    const v = getValidation(item);
    const price = v.price ?? item.unitPrice;
    const max = v.max_quantity ?? CART_MAX_QUANTITY_PER_LINE;
    subtotal += price * item.quantity;
    if (!v.available || v.stock_status === "sold_out" || item.quantity > max) {
      blocked = true;
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-medium tracking-[0.15em] uppercase">Cart</h1>

      <div className="grid gap-12 md:grid-cols-[1fr_20rem] md:items-start">
        <div className="border-t border-ink">
          {items.map((item) => (
            <CartLine key={item.variantId} item={item} validation={getValidation(item)} />
          ))}
        </div>

        <div className="md:sticky md:top-20">
          <CartSummary subtotal={subtotal} blocked={blocked} />
        </div>
      </div>
    </div>
  );
}
