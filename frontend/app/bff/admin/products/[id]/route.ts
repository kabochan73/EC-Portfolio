// ブラウザ → PUT/DELETE /bff/admin/products/{id} → Laravel /api/admin/products/{id}。

import { NextResponse } from "next/server";

import { deleteProduct, fetchAdminProduct, updateProduct } from "@/lib/admin/products";
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
    const product = await updateProduct(token, Number(id), body);
    revalidate(tags.products, tags.categories, tags.product(product.slug));
    return NextResponse.json({ data: product });
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
    // 削除前に slug を控えて PDP のキャッシュも飛ばす
    const product = await fetchAdminProduct(token, Number(id));
    await deleteProduct(token, Number(id));
    revalidate(tags.products, tags.categories, tags.product(product.slug));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
