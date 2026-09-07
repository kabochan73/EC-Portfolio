import { ApiError, apiFetch } from "@/lib/api";
import type {
  ApiCollection,
  ApiResource,
  CreateOrderPayload,
  OrderDetail,
  OrderListItem,
} from "@/lib/types";

/**
 * POST /api/orders … 配送先を確定して pending 注文を作成し、在庫を引き当てる。
 * 要メール認証（Laravel 側 verified ミドルウェア）。在庫不足は 422。
 */
export async function createOrder(
  token: string,
  payload: CreateOrderPayload,
): Promise<OrderDetail> {
  const res = await apiFetch<ApiResource<OrderDetail>>("/api/orders", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.data;
}

/** GET /api/orders … 本人の注文一覧（新しい順・要約）。BFF / Server Component から。 */
export async function getMyOrders(token: string): Promise<OrderListItem[]> {
  const res = await apiFetch<ApiCollection<OrderListItem>>("/api/orders", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

/** GET /api/orders/{order_number} … 本人の注文詳細。他人・不明は null。 */
export async function getMyOrder(token: string, orderNumber: string): Promise<OrderDetail | null> {
  try {
    const res = await apiFetch<ApiResource<OrderDetail>>(`/api/orders/${orderNumber}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
