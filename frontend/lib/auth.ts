// ─────────────────────────────────────────────────────────────
// 認証まわりのサーバー側専用ヘルパー（Route Handler / Server Component から使う）。
// - Cookie 管理: トークンは httpOnly Cookie に入れ、ブラウザの JS からは触れない
// - Laravel 呼び出し: app/bff/**\/route.ts を薄く保てるよう実処理はここに置く
//
// パスワードリセットの関数は Step 40 でここに足す。
// ─────────────────────────────────────────────────────────────

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextResponse } from "next/server";

import { ApiError, apiFetch } from "@/lib/api";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import type {
  ApiResource,
  LoginPayload,
  RegisterPayload,
  UpdatePasswordPayload,
  UpdateProfilePayload,
  User,
} from "@/lib/types";

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

type AuthResult = { user: User; token: string };

/** Server Component / Route Handler から、ログイン中のトークンを読む */
export async function getSessionToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value;
}

/** ログイン / 会員登録成功時。httpOnly / secure(本番のみ) / sameSite=lax / 30日（docs/08 §4） */
export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE_NAME);
}

/** POST /api/register */
export async function registerUser(payload: RegisterPayload): Promise<AuthResult> {
  const result = await apiFetch<ApiResource<User> & { token: string }>("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { user: result.data, token: result.token };
}

/** POST /api/login */
export async function loginUser(payload: LoginPayload): Promise<AuthResult> {
  const result = await apiFetch<ApiResource<User> & { token: string }>("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { user: result.data, token: result.token };
}

/** POST /api/logout。現在のトークンだけ失効 */
export async function logoutUser(token: string): Promise<void> {
  await apiFetch("/api/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

/** GET /api/me */
export async function fetchCurrentUser(token: string): Promise<User> {
  const result = await apiFetch<ApiResource<User>>("/api/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return result.data;
}

/** PUT /api/me（氏名・メール変更） */
export async function updateProfile(token: string, payload: UpdateProfilePayload): Promise<User> {
  const result = await apiFetch<ApiResource<User>>("/api/me", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return result.data;
}

/** PUT /api/me/password。成功時 204 */
export async function updatePassword(
  token: string,
  payload: UpdatePasswordPayload,
): Promise<void> {
  await apiFetch<void>("/api/me/password", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/** POST /api/email/verification-notification。検証メール再送。認証済みなら Laravel 側で 204 */
export async function resendVerificationEmail(token: string): Promise<void> {
  await apiFetch<void>("/api/email/verification-notification", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * GET /api/email/verify/{id}/{hash}?expires=&signature=（signed:relative）。
 * フロントの /verify-email 着地時、クエリを組み立ててここから叩く。成功時 204。
 */
export async function verifyEmail(
  token: string,
  params: { id: string; hash: string; expires: string; signature: string },
): Promise<void> {
  const query = new URLSearchParams({
    expires: params.expires,
    signature: params.signature,
  }).toString();

  await apiFetch<void>(`/api/email/verify/${params.id}/${params.hash}?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * 要ログインの Server Component（/account 系）の先頭で呼ぶ。
 * middleware は Cookie の有無しか見ないので、ここでトークンの有効性まで確認し、
 * 無い/失効していれば /login?redirect=<戻り先> へ飛ばす。
 */
export async function requireAuth(redirectTo: string): Promise<AuthResult> {
  const loginPath = `/login?redirect=${encodeURIComponent(redirectTo)}`;
  const token = await getSessionToken();
  if (!token) {
    redirect(loginPath);
  }

  try {
    const user = await fetchCurrentUser(token);
    return { user, token };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect(loginPath);
    }
    throw error;
  }
}

/**
 * 要管理者権限の Server Component（/admin 系）の先頭で呼ぶ。
 * 未ログインは /login へ、ログイン済みだが admin でなければ / へ戻す（docs/05-admin.md）。
 */
export async function requireAdmin(redirectTo: string): Promise<AuthResult> {
  const result = await requireAuth(redirectTo);
  if (result.user.role !== "admin") {
    redirect("/");
  }
  return result;
}
