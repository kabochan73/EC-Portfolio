// カート明細から金額と「購入可否」を計算する純粋関数（クライアント安全）。
// /cart と /checkout で同じ計算を使う。確定金額は POST /api/orders でサーバーが
// 再計算するので、ここはあくまで表示用。

import {
  CART_MAX_QUANTITY_PER_LINE,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
} from "@/lib/constants";
import type { CartItem, CartLineValidation } from "@/lib/types";

export type CartTotals = {
  subtotal: number;
  shipping: number;
  total: number;
  /** 購入不可の明細（在庫切れ / 販売終了 / 数量超過）が 1 つでもあれば true */
  blocked: boolean;
};

export function summarizeCart(
  items: CartItem[],
  getValidation: (item: CartItem) => CartLineValidation,
): CartTotals {
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

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  return { subtotal, shipping, total: subtotal + shipping, blocked };
}
