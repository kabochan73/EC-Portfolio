// ブラウザ → GET /bff/me → Laravel GET /api/me。
// AccountLink がログイン状態を確認するために叩く。PUT（プロフィール更新）は Step 41。

import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api";
import { fetchCurrentUser, getSessionToken } from "@/lib/auth";

export async function GET() {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  try {
    const user = await fetchCurrentUser(token);
    return NextResponse.json({ data: user });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
