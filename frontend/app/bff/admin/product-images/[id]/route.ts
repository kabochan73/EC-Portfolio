// ブラウザ → DELETE /bff/admin/product-images/{id}?product={productId} → Laravel /api/admin/product-images/{id}。
// 商品配下ではなくフラットなパス。ISR 無効化のため product クエリで商品 ID を受け取る。

import { NextResponse } from "next/server";

import { deleteProductImage, revalidateProductCaches } from "@/lib/admin/productImages";
import { apiErrorResponse } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, { params }: Context) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { id } = await params;
  const productId = new URL(request.url).searchParams.get("product");

  try {
    await deleteProductImage(token, Number(id));
    if (productId) {
      await revalidateProductCaches(token, Number(productId));
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
