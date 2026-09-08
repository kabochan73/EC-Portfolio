// 管理画面の CMS（トップページコンテンツ）のサーバー側専用ヘルパー。
// 画像アップロードのみ multipart。他は categories.ts と同じ方針。

import { apiFetch } from "@/lib/api";
import type { ApiResource, SiteContent } from "@/lib/types";

export type ContentKey = keyof SiteContent;

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/** GET /api/admin/content … 4 キーの生 data（未設定はデフォルトで埋まる） */
export async function fetchAdminContent(token: string): Promise<SiteContent> {
  const res = await apiFetch<ApiResource<SiteContent>>("/api/admin/content", {
    headers: authHeader(token),
  });
  return res.data;
}

/** PUT /api/admin/content/{key} … その key の data 全体を差し替え */
export async function updateContent<K extends ContentKey>(
  token: string,
  key: K,
  data: SiteContent[K],
): Promise<SiteContent[K]> {
  const res = await apiFetch<{ data: SiteContent[K] }>(`/api/admin/content/${key}`, {
    method: "PUT",
    headers: { ...authHeader(token), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.data;
}

/** POST /api/admin/content/{key}/images … 画像を保存して /media/... の url を返す */
export async function uploadContentImage(
  token: string,
  key: ContentKey,
  file: File,
): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await apiFetch<{ url: string }>(`/api/admin/content/${key}/images`, {
    method: "POST",
    headers: authHeader(token),
    body: formData,
  });
  return res.url;
}
