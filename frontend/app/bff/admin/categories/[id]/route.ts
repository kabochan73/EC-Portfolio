// ブラウザ → PUT/DELETE /bff/admin/categories/{id} → Laravel /api/admin/categories/{id}。

import { NextResponse } from "next/server";

import { deleteCategory, updateCategory } from "@/lib/admin/categories";
import { apiErrorResponse } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";
import { revalidate, tags } from "@/lib/revalidate";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Context) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  try {
    const category = await updateCategory(token, Number(id), body);
    // 名前変更は商品カードの category 表示にも波及する
    revalidate(tags.categories, tags.products);
    return NextResponse.json({ data: category });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteCategory(token, Number(id));
    revalidate(tags.categories, tags.products);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
