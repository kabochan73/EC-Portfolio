import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import VariantSelector from "@/components/product/VariantSelector";
import { useCartStore } from "@/lib/stores/cart";
import type { ProductVariant } from "@/lib/types";

function variant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    id: 1,
    size: "S",
    color: "Black",
    stock_status: "in_stock",
    stock_label: "在庫あり",
    selectable: true,
    ...overrides,
  };
}

function renderSelector(variants: ProductVariant[], colors = ["Black"]) {
  return render(
    <VariantSelector
      productSlug="boxy-cotton-t-shirt"
      productName="Boxy Cotton T-Shirt"
      price={12000}
      imageUrl={null}
      colors={colors}
      variants={variants}
    />,
  );
}

beforeEach(() => {
  useCartStore.setState({ items: [] });
});

describe("VariantSelector", () => {
  it("最初の色に属するサイズだけボタンにする", () => {
    renderSelector(
      [
        variant({ id: 1, size: "S", color: "Black" }),
        variant({ id: 2, size: "M", color: "Black" }),
        variant({ id: 3, size: "L", color: "Ecru" }),
      ],
      ["Black", "Ecru"],
    );
    expect(screen.getByRole("button", { name: "S" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "M" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "L" })).not.toBeInTheDocument();
  });

  it("sold_out のサイズは disabled", () => {
    renderSelector([variant({ id: 1, size: "S", stock_status: "sold_out", selectable: false })]);
    expect(screen.getByRole("button", { name: "S" })).toBeDisabled();
  });

  it("サイズ未選択なら Add to Cart は無効", () => {
    renderSelector([variant()]);
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeDisabled();
  });

  it("selectable なサイズを選ぶと Add to Cart 有効 → クリックでカートに入る", async () => {
    const user = userEvent.setup();
    renderSelector([variant({ id: 7, size: "M", color: "Black", selectable: true })]);

    await user.click(screen.getByRole("button", { name: "M" }));
    const addButton = screen.getByRole("button", { name: /add to cart/i });
    expect(addButton).toBeEnabled();

    await user.click(addButton);
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ variantId: 7, size: "M", color: "Black", quantity: 1, unitPrice: 12000 });
  });

  it("selectable:false のサイズを選んでも Add to Cart は無効のまま", async () => {
    const user = userEvent.setup();
    renderSelector([variant({ id: 1, size: "S", stock_status: "low_stock", selectable: false })]);

    await user.click(screen.getByRole("button", { name: /^s/i }));
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeDisabled();
  });

  it("色を変えるとサイズ選択がリセットされる", async () => {
    const user = userEvent.setup();
    renderSelector(
      [
        variant({ id: 1, size: "M", color: "Black" }),
        variant({ id: 2, size: "M", color: "Ecru" }),
      ],
      ["Black", "Ecru"],
    );

    await user.click(screen.getByRole("button", { name: "M" }));
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Ecru" }));
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeDisabled();
  });
});
