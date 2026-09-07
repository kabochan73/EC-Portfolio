"use client";

import Image from "next/image";

import type { CartItem, CartLineValidation } from "@/lib/types";
import type { CartTotals } from "@/lib/cart-summary";

type Props = {
  items: CartItem[];
  getValidation: (item: CartItem) => CartLineValidation;
  totals: CartTotals;
};

/** チェックアウトの注文内容（読み取り専用）。数量変更はカートに戻って行う。 */
export default function OrderReview({ items, getValidation, totals }: Props) {
  return (
    <div className="border border-ink p-6">
      <h2 className="mb-6 text-[11px] tracking-widest text-graphite uppercase">Order</h2>

      <ul className="divide-y divide-mist border-y border-mist">
        {items.map((item) => {
          const v = getValidation(item);
          const price = v.price ?? item.unitPrice;
          const unavailable = !v.available || v.stock_status === "sold_out";

          return (
            <li key={item.variantId} className="flex gap-3 py-4">
              <div className="relative aspect-3/4 w-14 flex-none overflow-hidden bg-mist">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.productName}
                    fill
                    sizes="3.5rem"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-[7px] tracking-widest text-graphite uppercase">
                    No Image
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col">
                <p className="text-xs">{item.productName}</p>
                <p className="mt-1 text-[10px] tracking-widest text-graphite uppercase">
                  {item.size}
                  {item.color ? ` / ${item.color}` : ""} × {item.quantity}
                </p>
                {unavailable && (
                  <p className="mt-1 text-[10px] tracking-widest text-ink uppercase">
                    現在購入できません
                  </p>
                )}
              </div>

              <p className="text-xs">¥{(price * item.quantity).toLocaleString("ja-JP")}</p>
            </li>
          );
        })}
      </ul>

      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="tracking-widest text-graphite uppercase">Subtotal</dt>
          <dd>¥{totals.subtotal.toLocaleString("ja-JP")}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="tracking-widest text-graphite uppercase">Shipping</dt>
          <dd>{totals.shipping === 0 ? "FREE" : `¥${totals.shipping.toLocaleString("ja-JP")}`}</dd>
        </div>
        <div className="flex justify-between border-t border-ink pt-3 text-base">
          <dt className="tracking-widest uppercase">Total</dt>
          <dd>¥{totals.total.toLocaleString("ja-JP")}</dd>
        </div>
      </dl>
    </div>
  );
}
