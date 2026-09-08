// ブラウザ → GET/POST /bff/admin/categories → Laravel /api/admin/categories。
// admin 判定は Laravel の admin ミドルウェアが行う（ここは token 有無だけ見る）。

import { NextResponse } from "next/server";

import { createCategory, fetchAdminCategories } from "@/lib/admin/categories";
import { apiErrorResponse } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";
import { revalidate, tags } from "@/lib/revalidate";

export async function GET() {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  try {
    return NextResponse.json({ data: await fetchAdminCategories(token) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const body = await request.json();

  try {
    const category = await createCategory(token, body);
    revalidate(tags.categories);
    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
