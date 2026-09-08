import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import CartLine from "@/components/cart/CartLine";
import { useCartStore } from "@/lib/stores/cart";
import type { CartItem, CartLineValidation } from "@/lib/types";

function item(overrides: Partial<CartItem> = {}): CartItem {
  return {
    variantId: 1,
    productSlug: "boxy-cotton-t-shirt",
    productName: "Boxy Cotton T-Shirt",
    size: "M",
    color: "Black",
    unitPrice: 5000,
    quantity: 2,
    imageUrl: null,
    ...overrides,
  };
}

const ok: CartLineValidation = { variant_id: 1, available: true };

beforeEach(() => {
  useCartStore.setState({ items: [] });
});

describe("CartLine", () => {
  it("商品名・サイズ/色・小計を表示する", () => {
    render(<CartLine item={item({ unitPrice: 5000, quantity: 2 })} validation={ok} />);
    expect(screen.getByText("Boxy Cotton T-Shirt")).toBeInTheDocument();
    expect(screen.getByText("M / Black")).toBeInTheDocument();
    expect(screen.getByText("¥10,000")).toBeInTheDocument();
  });

  it("検証で返った price を小計に使う", () => {
    render(
      <CartLine
        item={item({ unitPrice: 5000, quantity: 2 })}
        validation={{ variant_id: 1, available: true, price: 4000 }}
      />,
    );
    expect(screen.getByText("¥8,000")).toBeInTheDocument();
    expect(screen.getByText(/価格が ¥4,000 に変わりました/)).toBeInTheDocument();
  });

  it("− でその明細の数量を1減らす", async () => {
    const user = userEvent.setup();
    useCartStore.setState({ items: [item({ variantId: 1, quantity: 2 })] });
    render(<CartLine item={item({ variantId: 1, quantity: 2 })} validation={ok} />);

    await user.click(screen.getByRole("button", { name: "数量を減らす" }));
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it("Remove で明細を消す", async () => {
    const user = userEvent.setup();
    useCartStore.setState({ items: [item({ variantId: 1 })] });
    render(<CartLine item={item({ variantId: 1 })} validation={ok} />);

    await user.click(screen.getByRole("button", { name: /remove/i }));
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("数量が上限に達したら + は disabled", () => {
    render(
      <CartLine
        item={item({ quantity: 3 })}
        validation={{ variant_id: 1, available: true, max_quantity: 3 }}
      />,
    );
    expect(screen.getByRole("button", { name: "数量を増やす" })).toBeDisabled();
  });

  it("available:false で購入不可メッセージ", () => {
    render(<CartLine item={item()} validation={{ variant_id: 1, available: false }} />);
    expect(screen.getByText(/現在購入できません/)).toBeInTheDocument();
  });

  it("sold_out で Sold out 表示", () => {
    render(
      <CartLine
        item={item()}
        validation={{ variant_id: 1, available: true, stock_status: "sold_out" }}
      />,
    );
    expect(screen.getByText("Sold out")).toBeInTheDocument();
  });

  it("数量超過で上限メッセージ", () => {
    render(
      <CartLine
        item={item({ quantity: 5 })}
        validation={{ variant_id: 1, available: true, max_quantity: 3 }}
      />,
    );
    expect(screen.getByText(/在庫は 3 点までです/)).toBeInTheDocument();
  });
});
