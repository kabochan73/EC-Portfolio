// 会員一覧の取得（閲覧のみ。読み取りなので Server Component から直接呼ぶ）。

import { apiFetch } from "@/lib/api";
import type { AdminCustomer, ApiPaginated } from "@/lib/types";

export type AdminCustomerListParams = {
  q?: string;
  page?: number;
};

/** GET /api/admin/customers … role=customer の一覧。?q= name/email 部分一致 &page= */
export async function fetchAdminCustomers(
  token: string,
  params: AdminCustomerListParams = {},
): Promise<ApiPaginated<AdminCustomer>> {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.page) query.set("page", String(params.page));

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<ApiPaginated<AdminCustomer>>(`/api/admin/customers${suffix}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
