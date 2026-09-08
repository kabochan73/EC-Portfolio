// 管理画面の商品 CRUD のサーバー側専用ヘルパー。
// lib/admin/categories.ts と同じ方針: 実処理はここ、app/bff/**/route.ts は薄い窓口。

import { apiFetch } from "@/lib/api";
import type {
  AdminProduct,
  AdminProductListItem,
  AdminProductPayload,
  ApiPaginated,
  ApiResource,
} from "@/lib/types";

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export type AdminProductListParams = {
  q?: string;
  category?: string;
  page?: number;
};

/** GET /api/admin/products … 未公開含む。検索・カテゴリ絞り込み・ページング */
export async function fetchAdminProducts(
  token: string,
  params: AdminProductListParams = {},
): Promise<ApiPaginated<AdminProductListItem>> {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.category) query.set("category", params.category);
  if (params.page) query.set("page", String(params.page));

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<ApiPaginated<AdminProductListItem>>(`/api/admin/products${suffix}`, {
    headers: authHeader(token),
  });
}

/** GET /api/admin/products/{id} … 編集用フル情報（images / variants 込み） */
export async function fetchAdminProduct(token: string, id: number): Promise<AdminProduct> {
  const result = await apiFetch<ApiResource<AdminProduct>>(`/api/admin/products/${id}`, {
    headers: authHeader(token),
  });
  return result.data;
}

/** POST /api/admin/products */
export async function createProduct(
  token: string,
  payload: AdminProductPayload,
): Promise<AdminProduct> {
  const result = await apiFetch<ApiResource<AdminProduct>>("/api/admin/products", {
    method: "POST",
    headers: { ...authHeader(token), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return result.data;
}

/** PUT /api/admin/products/{id} */
export async function updateProduct(
  token: string,
  id: number,
  payload: AdminProductPayload,
): Promise<AdminProduct> {
  const result = await apiFetch<ApiResource<AdminProduct>>(`/api/admin/products/${id}`, {
    method: "PUT",
    headers: { ...authHeader(token), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return result.data;
}

/** DELETE /api/admin/products/{id}（204） */
export async function deleteProduct(token: string, id: number): Promise<void> {
  await apiFetch<void>(`/api/admin/products/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
}
