// ブラウザ → PUT /bff/admin/categories/reorder → Laravel /api/admin/categories/reorder。
// 静的パスなので [id] より優先してマッチさせたい → 別ディレクトリで定義。

import { NextResponse } from "next/server";

import { reorderCategories } from "@/lib/admin/categories";
import { apiErrorResponse } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";
import { revalidate, tags } from "@/lib/revalidate";

export async function PUT(request: Request) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const body = await request.json();

  try {
    const categories = await reorderCategories(token, body.order);
    revalidate(tags.categories);
    return NextResponse.json({ data: categories });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
