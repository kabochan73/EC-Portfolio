"use client";

import Link from "next/link";

import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/constants";

type Props = {
  subtotal: number;
  /** チェックアウトに進めない理由（購入不可の明細がある / 数量超過 等）があれば true */
  blocked: boolean;
};

export default function CartSummary({ subtotal, blocked }: Props) {
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;

  return (
    <div className="border border-ink p-6">
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="tracking-widest text-graphite uppercase">Subtotal</dt>
          <dd>¥{subtotal.toLocaleString("ja-JP")}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="tracking-widest text-graphite uppercase">Shipping</dt>
          <dd>{shipping === 0 ? "FREE" : `¥${shipping.toLocaleString("ja-JP")}`}</dd>
        </div>
        <div className="flex justify-between border-t border-ink pt-3 text-base">
          <dt className="tracking-widest uppercase">Total</dt>
          <dd>¥{total.toLocaleString("ja-JP")}</dd>
        </div>
      </dl>

      {blocked ? (
        <p className="mt-6 block w-full bg-mist py-3 text-center text-xs tracking-widest text-graphite uppercase">
          購入できない明細があります
        </p>
      ) : (
        <Link
          href="/checkout"
          className="mt-6 block w-full bg-ink py-3 text-center text-xs tracking-widest text-paper uppercase transition-opacity hover:opacity-80"
        >
          Checkout
        </Link>
      )}

      {shipping !== 0 && (
        <p className="mt-3 text-[11px] tracking-widest text-graphite uppercase">
          あと ¥{(FREE_SHIPPING_THRESHOLD - subtotal).toLocaleString("ja-JP")} で送料無料
        </p>
      )}
    </div>
  );
}
