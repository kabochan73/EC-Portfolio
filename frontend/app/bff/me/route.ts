// ブラウザ → GET/PUT /bff/me → Laravel GET/PUT /api/me。
// GET: AccountLink がログイン状態を確認。PUT: /account/profile の氏名・メール変更。

import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api";
import { fetchCurrentUser, getSessionToken, updateProfile } from "@/lib/auth";

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

export async function PUT(request: Request) {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const body = await request.json();

  try {
    const user = await updateProfile(token, body);
    return NextResponse.json({ data: user });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
