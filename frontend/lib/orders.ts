import { ApiError, apiFetch } from "@/lib/api";
import type { ApiCollection, ApiResource, OrderDetail, OrderListItem } from "@/lib/types";

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
