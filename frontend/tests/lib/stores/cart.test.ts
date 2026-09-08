import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useCartItemCount, useCartStore } from "@/lib/stores/cart";
import type { CartItem } from "@/lib/types";

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

const state = () => useCartStore.getState();

beforeEach(() => {
  useCartStore.setState({ items: [] });
});

describe("useCartStore", () => {
  it("addItem: 新規バリアントは行を追加する", () => {
    state().addItem(item({ variantId: 1 }));
    state().addItem(item({ variantId: 2 }));
    expect(state().items).toHaveLength(2);
  });

  it("addItem: 同じバリアントは数量を合算し、行は増やさない", () => {
    state().addItem(item({ variantId: 1, quantity: 2 }));
    state().addItem(item({ variantId: 1, quantity: 3 }));
    expect(state().items).toHaveLength(1);
    expect(state().items[0].quantity).toBe(5);
  });

  it("removeItem: 指定バリアントを消す", () => {
    state().addItem(item({ variantId: 1 }));
    state().addItem(item({ variantId: 2 }));
    state().removeItem(1);
    expect(state().items.map((i) => i.variantId)).toEqual([2]);
  });

  it("setQuantity: 正の数で数量を更新する", () => {
    state().addItem(item({ variantId: 1, quantity: 1 }));
    state().setQuantity(1, 4);
    expect(state().items[0].quantity).toBe(4);
  });

  it("setQuantity: 0 以下は削除扱い", () => {
    state().addItem(item({ variantId: 1 }));
    state().setQuantity(1, 0);
    expect(state().items).toHaveLength(0);
  });

  it("clear: 全消し", () => {
    state().addItem(item({ variantId: 1 }));
    state().addItem(item({ variantId: 2 }));
    state().clear();
    expect(state().items).toHaveLength(0);
  });
});

describe("useCartItemCount", () => {
  it("行数ではなく数量の合計を返す", () => {
    state().addItem(item({ variantId: 1, quantity: 2 }));
    state().addItem(item({ variantId: 2, quantity: 3 }));
    const { result } = renderHook(() => useCartItemCount());
    expect(result.current).toBe(5);
  });
});
