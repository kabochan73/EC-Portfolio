import { apiFetch } from "@/lib/api";
import type { Address, AddressPayload, ApiCollection, ApiResource } from "@/lib/types";

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

/** GET /api/addresses … is_default を先頭に */
export async function getAddresses(token: string): Promise<Address[]> {
  const res = await apiFetch<ApiCollection<Address>>("/api/addresses", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

/** POST /api/addresses */
export async function createAddress(token: string, payload: AddressPayload): Promise<Address> {
  const res = await apiFetch<ApiResource<Address>>("/api/addresses", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.data;
}

/** PUT /api/addresses/{id} */
export async function updateAddress(
  token: string,
  id: number,
  payload: AddressPayload,
): Promise<Address> {
  const res = await apiFetch<ApiResource<Address>>(`/api/addresses/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.data;
}

/** DELETE /api/addresses/{id} */
export async function deleteAddress(token: string, id: number): Promise<void> {
  await apiFetch<void>(`/api/addresses/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

/** POST /api/addresses/{id}/default */
export async function setDefaultAddress(token: string, id: number): Promise<Address> {
  const res = await apiFetch<ApiResource<Address>>(`/api/addresses/${id}/default`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
