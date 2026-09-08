import { describe, expect, it } from "vitest";

import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/constants";
import { summarizeCart } from "@/lib/cart-summary";
import type { CartItem, CartLineValidation } from "@/lib/types";

function item(overrides: Partial<CartItem> = {}): CartItem {
  return {
    variantId: 1,
    productSlug: "boxy-cotton-t-shirt",
    productName: "Boxy Cotton T-Shirt",
    size: "M",
    color: "Black",
    unitPrice: 5000,
    quantity: 1,
    imageUrl: null,
    ...overrides,
  };
}

/** デフォルトは「取得前」の楽観状態（available だけ true） */
const optimistic = (i: CartItem): CartLineValidation => ({
  variant_id: i.variantId,
  available: true,
});

describe("summarizeCart", () => {
  it("小計は 単価 × 数量 の合計", () => {
    const items = [item({ variantId: 1, unitPrice: 5000, quantity: 2 }), item({ variantId: 2, unitPrice: 3000, quantity: 1 })];
    expect(summarizeCart(items, optimistic).subtotal).toBe(13000);
  });

  it("しきい値未満は送料あり、以上は無料", () => {
    const under = summarizeCart([item({ unitPrice: FREE_SHIPPING_THRESHOLD - 1, quantity: 1 })], optimistic);
    expect(under.shipping).toBe(SHIPPING_FEE);
    expect(under.total).toBe(FREE_SHIPPING_THRESHOLD - 1 + SHIPPING_FEE);

    const over = summarizeCart([item({ unitPrice: FREE_SHIPPING_THRESHOLD, quantity: 1 })], optimistic);
    expect(over.shipping).toBe(0);
    expect(over.total).toBe(FREE_SHIPPING_THRESHOLD);
  });

  it("検証で返ってきた price が snapshot の unitPrice より優先される", () => {
    const items = [item({ variantId: 1, unitPrice: 5000, quantity: 2 })];
    const getValidation = (): CartLineValidation => ({ variant_id: 1, available: true, price: 4000 });
    expect(summarizeCart(items, getValidation).subtotal).toBe(8000);
  });

  it("available:false の明細があれば blocked", () => {
    const getValidation = (): CartLineValidation => ({ variant_id: 1, available: false });
    expect(summarizeCart([item()], getValidation).blocked).toBe(true);
  });

  it("stock_status が sold_out なら blocked", () => {
    const getValidation = (): CartLineValidation => ({
      variant_id: 1,
      available: true,
      stock_status: "sold_out",
    });
    expect(summarizeCart([item()], getValidation).blocked).toBe(true);
  });

  it("数量が max_quantity を超えていれば blocked", () => {
    const getValidation = (): CartLineValidation => ({
      variant_id: 1,
      available: true,
      max_quantity: 3,
    });
    expect(summarizeCart([item({ quantity: 4 })], getValidation).blocked).toBe(true);
    expect(summarizeCart([item({ quantity: 3 })], getValidation).blocked).toBe(false);
  });

  it("全明細が正常なら blocked は false", () => {
    expect(summarizeCart([item(), item({ variantId: 2 })], optimistic).blocked).toBe(false);
  });
});
