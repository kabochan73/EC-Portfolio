// 管理画面のカテゴリ CRUD のサーバー側専用ヘルパー。
// lib/addresses.ts と同じ方針: 実処理はここ、app/bff/**/route.ts は薄い窓口。

import { apiFetch } from "@/lib/api";
import type {
  AdminCategory,
  AdminCategoryPayload,
  ApiCollection,
  ApiResource,
} from "@/lib/types";

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/** GET /api/admin/categories … position 昇順 */
export async function fetchAdminCategories(token: string): Promise<AdminCategory[]> {
  const result = await apiFetch<ApiCollection<AdminCategory>>("/api/admin/categories", {
    headers: authHeader(token),
  });
  return result.data;
}

/** POST /api/admin/categories */
export async function createCategory(
  token: string,
  payload: AdminCategoryPayload,
): Promise<AdminCategory> {
  const result = await apiFetch<ApiResource<AdminCategory>>("/api/admin/categories", {
    method: "POST",
    headers: { ...authHeader(token), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return result.data;
}

/** PUT /api/admin/categories/{id} */
export async function updateCategory(
  token: string,
  id: number,
  payload: AdminCategoryPayload,
): Promise<AdminCategory> {
  const result = await apiFetch<ApiResource<AdminCategory>>(`/api/admin/categories/${id}`, {
    method: "PUT",
    headers: { ...authHeader(token), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return result.data;
}

/** DELETE /api/admin/categories/{id}（204。所属商品が残っていれば 409） */
export async function deleteCategory(token: string, id: number): Promise<void> {
  await apiFetch<void>(`/api/admin/categories/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
}

/** PUT /api/admin/categories/reorder … id 配列の順に position を振り直す。並べ替え後の一覧を返す。 */
export async function reorderCategories(
  token: string,
  order: number[],
): Promise<AdminCategory[]> {
  const result = await apiFetch<ApiCollection<AdminCategory>>(
    "/api/admin/categories/reorder",
    {
      method: "PUT",
      headers: { ...authHeader(token), "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    },
  );
  return result.data;
}
