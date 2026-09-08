// ブラウザ → PUT /bff/admin/content/{key} → Laravel /api/admin/content/{key}。
// 保存後にトップページの ISR キャッシュ（tag: content）を無効化する。

import { NextResponse } from "next/server";

import { updateContent, type ContentKey } from "@/lib/admin/content";
import { apiErrorResponse } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";
import { revalidate, tags } from "@/lib/revalidate";

type Context = { params: Promise<{ key: string }> };

export async function PUT(request: Request, { params }: Context) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { key } = await params;
  const body = await request.json();

  try {
    const data = await updateContent(token, key as ContentKey, body);
    revalidate(tags.content);
    return NextResponse.json({ data });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
