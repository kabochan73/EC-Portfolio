// ブラウザ → PUT /bff/admin/products/{id}/images/reorder → Laravel の同パス。

import { NextResponse } from "next/server";

import { reorderProductImages, revalidateProductCaches } from "@/lib/admin/productImages";
import { apiErrorResponse } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Context) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  try {
    const images = await reorderProductImages(token, Number(id), body.order);
    await revalidateProductCaches(token, Number(id));
    return NextResponse.json({ data: images });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
