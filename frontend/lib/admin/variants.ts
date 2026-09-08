// 管理画面のバリアント CRUD のサーバー側専用ヘルパー。
// lib/admin/categories.ts と同じ方針: 実処理はここ、app/bff/**/route.ts は薄い窓口。

import { apiFetch } from "@/lib/api";
import type {
  AdminProductVariant,
  ApiResource,
  CreateVariantPayload,
  UpdateVariantPayload,
} from "@/lib/types";

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/** POST /api/admin/products/{productId}/variants */
export async function createVariant(
  token: string,
  productId: number,
  payload: CreateVariantPayload,
): Promise<AdminProductVariant> {
  const result = await apiFetch<ApiResource<AdminProductVariant>>(
    `/api/admin/products/${productId}/variants`,
    {
      method: "POST",
      headers: { ...authHeader(token), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return result.data;
}

/** PUT /api/admin/variants/{id} */
export async function updateVariant(
  token: string,
  id: number,
  payload: UpdateVariantPayload,
): Promise<AdminProductVariant> {
  const result = await apiFetch<ApiResource<AdminProductVariant>>(`/api/admin/variants/${id}`, {
    method: "PUT",
    headers: { ...authHeader(token), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return result.data;
}

/** DELETE /api/admin/variants/{id}（204） */
export async function deleteVariant(token: string, id: number): Promise<void> {
  await apiFetch<void>(`/api/admin/variants/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
}
