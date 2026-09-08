// ダッシュボード統計の取得。読み取りなので Server Component から直接呼ぶ（docs/08 §3.1）。

import { apiFetch } from "@/lib/api";
import type { ApiResource, DashboardStats } from "@/lib/types";

/** GET /api/admin/stats */
export async function fetchDashboardStats(token: string): Promise<DashboardStats> {
  const { data } = await apiFetch<ApiResource<DashboardStats>>("/api/admin/stats", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}
