import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import OrderStatusActions from "@/components/admin/OrderStatusActions";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

beforeEach(() => {
  refresh.mockReset();
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("OrderStatusActions — 遷移表に応じたボタン", () => {
  it("paid: Shipped と Cancel、Completed は出さない", () => {
    render(<OrderStatusActions orderNumber="EC-1" status="paid" />);
    expect(screen.getByRole("button", { name: "Mark as Shipped" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel Order" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mark as Completed" })).not.toBeInTheDocument();
  });

  it("shipped: Completed と Cancel", () => {
    render(<OrderStatusActions orderNumber="EC-1" status="shipped" />);
    expect(screen.getByRole("button", { name: "Mark as Completed" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel Order" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mark as Shipped" })).not.toBeInTheDocument();
  });

  it("pending: admin は paid にできないので Cancel のみ", () => {
    render(<OrderStatusActions orderNumber="EC-1" status="pending" />);
    expect(screen.getByRole("button", { name: "Cancel Order" })).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("completed / cancelled: 変更不可メッセージ", () => {
    const { rerender } = render(<OrderStatusActions orderNumber="EC-1" status="completed" />);
    expect(screen.getByText(/これ以上変更できません/)).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);

    rerender(<OrderStatusActions orderNumber="EC-1" status="cancelled" />);
    expect(screen.getByText(/これ以上変更できません/)).toBeInTheDocument();
  });
});

describe("OrderStatusActions — 実行", () => {
  it("Mark as Shipped で PUT → 成功なら router.refresh", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<OrderStatusActions orderNumber="EC-20260908-0001" status="paid" />);
    await user.click(screen.getByRole("button", { name: "Mark as Shipped" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/bff/admin/orders/EC-20260908-0001/status",
      expect.objectContaining({ method: "PUT", body: JSON.stringify({ status: "shipped" }) }),
    );
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("失敗レスポンスならエラー表示・refresh しない", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: "「paid」から「completed」へは変更できません。" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<OrderStatusActions orderNumber="EC-1" status="shipped" />);
    await user.click(screen.getByRole("button", { name: "Mark as Completed" }));

    expect(await screen.findByText(/変更できません/)).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("Cancel で confirm がキャンセルされたら fetch しない", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<OrderStatusActions orderNumber="EC-1" status="paid" />);
    await user.click(screen.getByRole("button", { name: "Cancel Order" }));

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
