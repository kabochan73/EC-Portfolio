// 管理画面の商品画像のサーバー側専用ヘルパー。
// アップロードのみ multipart（FormData）。他は categories.ts と同じ方針。

import { fetchAdminProduct } from "@/lib/admin/products";
import { apiFetch } from "@/lib/api";
import { revalidate, tags } from "@/lib/revalidate";
import type { ApiCollection, ApiResource, ProductImage } from "@/lib/types";

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/** POST /api/admin/products/{id}/images（multipart） */
export async function uploadProductImage(
  token: string,
  productId: number,
  file: File,
  alt?: string,
): Promise<ProductImage> {
  const formData = new FormData();
  formData.append("image", file);
  if (alt) formData.append("alt", alt);

  // Content-Type は付けない（FormData を渡すと fetch が boundary 込みで自動設定する）
  const result = await apiFetch<ApiResource<ProductImage>>(
    `/api/admin/products/${productId}/images`,
    { method: "POST", headers: authHeader(token), body: formData },
  );
  return result.data;
}

/** PUT /api/admin/products/{id}/images/reorder … 並べ替え後の一覧を返す */
export async function reorderProductImages(
  token: string,
  productId: number,
  order: number[],
): Promise<ProductImage[]> {
  const result = await apiFetch<ApiCollection<ProductImage>>(
    `/api/admin/products/${productId}/images/reorder`,
    {
      method: "PUT",
      headers: { ...authHeader(token), "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    },
  );
  return result.data;
}

/** DELETE /api/admin/product-images/{id}（204） */
export async function deleteProductImage(token: string, imageId: number): Promise<void> {
  await apiFetch<void>(`/api/admin/product-images/${imageId}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
}

/**
 * 画像を変えたら商品一覧カードと当該 PDP のキャッシュを飛ばす。
 * slug 解決に失敗しても最低限 products は無効化する。
 */
export async function revalidateProductCaches(token: string, productId: number): Promise<void> {
  try {
    const product = await fetchAdminProduct(token, productId);
    revalidate(tags.products, tags.product(product.slug));
  } catch {
    revalidate(tags.products);
  }
}
