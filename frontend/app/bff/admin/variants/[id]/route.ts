// ブラウザ → PUT/DELETE /bff/admin/variants/{id}?product={productId} → Laravel /api/admin/variants/{id}。
// 商品配下ではなくフラットなパス。ISR 無効化のため product クエリで商品 ID を受け取る。

import { NextResponse } from "next/server";

import { revalidateProductCaches } from "@/lib/admin/products";
import { deleteVariant, updateVariant } from "@/lib/admin/variants";
import { apiErrorResponse } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };

function productIdFrom(request: Request): number | null {
  const value = new URL(request.url).searchParams.get("product");
  return value ? Number(value) : null;
}

export async function PUT(request: Request, { params }: Context) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  try {
    const variant = await updateVariant(token, Number(id), body);
    const productId = productIdFrom(request);
    if (productId) await revalidateProductCaches(token, productId);
    return NextResponse.json({ data: variant });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteVariant(token, Number(id));
    const productId = productIdFrom(request);
    if (productId) await revalidateProductCaches(token, productId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
