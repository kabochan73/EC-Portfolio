"use client";

import Image from "next/image";
import Link from "next/link";

import { CART_MAX_QUANTITY_PER_LINE } from "@/lib/constants";
import { useCartStore } from "@/lib/stores/cart";
import type { CartItem, CartLineValidation } from "@/lib/types";

type Props = {
  item: CartItem;
  validation: CartLineValidation;
};

export default function CartLine({ item, validation }: Props) {
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const currentPrice = validation.price ?? item.unitPrice;
  const priceChanged = validation.available && currentPrice !== item.unitPrice;
  const maxQuantity = validation.max_quantity ?? CART_MAX_QUANTITY_PER_LINE;
  const overStock = validation.available && item.quantity > maxQuantity;

  return (
    <div className="flex gap-4 border-b border-mist py-6">
      <Link
        href={`/products/${item.productSlug}`}
        className="relative aspect-3/4 w-20 flex-none overflow-hidden bg-mist"
      >
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.productName} fill sizes="5rem" className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-[8px] tracking-widest text-graphite uppercase">
            No Image
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link href={`/products/${item.productSlug}`} className="text-sm hover:opacity-60">
              {item.productName}
            </Link>
            <p className="mt-1 text-[11px] tracking-widest text-graphite uppercase">
              {item.size}
              {item.color ? ` / ${item.color}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => removeItem(item.variantId)}
            className="text-[10px] tracking-widest text-graphite uppercase hover:text-ink"
          >
            Remove
          </button>
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 pt-4">
          <div className="flex items-center border border-ink">
            <button
              type="button"
              onClick={() => setQuantity(item.variantId, item.quantity - 1)}
              className="px-3 py-1 text-sm hover:bg-mist"
              aria-label="数量を減らす"
            >
              −
            </button>
            <span className="min-w-8 text-center text-sm">{item.quantity}</span>
            <button
              type="button"
              disabled={item.quantity >= maxQuantity}
              onClick={() => setQuantity(item.variantId, item.quantity + 1)}
              className="px-3 py-1 text-sm hover:bg-mist disabled:opacity-30"
              aria-label="数量を増やす"
            >
              +
            </button>
          </div>

          <p className="text-sm">
            ¥{(currentPrice * item.quantity).toLocaleString("ja-JP")}
          </p>
        </div>

        {!validation.available && (
          <p className="mt-3 text-[11px] tracking-widest text-ink uppercase">
            この商品は現在購入できません。削除してください。
          </p>
        )}
        {validation.available && validation.stock_status === "sold_out" && (
          <p className="mt-3 text-[11px] tracking-widest text-ink uppercase">Sold out</p>
        )}
        {overStock && (
          <p className="mt-3 text-[11px] tracking-widest text-ink uppercase">
            在庫は {maxQuantity} 点までです。
          </p>
        )}
        {priceChanged && (
          <p className="mt-3 text-[11px] tracking-widest text-graphite uppercase">
            価格が ¥{currentPrice.toLocaleString("ja-JP")} に変わりました。
          </p>
        )}
      </div>
    </div>
  );
}
